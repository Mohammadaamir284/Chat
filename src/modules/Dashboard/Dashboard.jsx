import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Home, Users, ArrowLeft, Edit,  X } from 'lucide-react';
import Input from '../../components/Input';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import MessageToast from '../../components/Message';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {

    const [data, setdata] = useState('')
    const [SendMessage, setSendMessage] = useState('')
    const [conversation, setconversation] = useState([])
    const [message, setmessage] = useState({ message: [] })
    const [allUser, setallUser] = useState([])
    const [Socket, setSocket] = useState(null)
    const [Notifications, setNotifications] = useState([]);
    const [isMobileFirst, setisMobileFirst] = useState(true)
    const [isMobileSecond, setisMobileSecond] = useState(false)
    const [me, setme] = useState(false)
    const [me2, setme2] = useState([])
    const [newPic, setnewPic] = useState(null)
    const [Edits, setEdit] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('userdata'));
    const messagesEndRef = useRef(null)
    const currentConversationIdRef = useRef(null);
    const messageRef = useRef(message);

    const base = import.meta.env.VITE_API_BASE_URL;
    //const base = `http://localhost:8000`
    const navigate = useNavigate()
    const saveNotifications = (notifs) => {
        setNotifications(notifs);
        localStorage.setItem("notifications", JSON.stringify(notifs));
    };

    useEffect(() => {
        messageRef.current = message;
    }, [message]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
        }
    }, [message.message]);
    useEffect(() => {
        const newSocket = io(`${base}`);
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    useEffect(() => {
        if (Socket && currentUser?.userId) {
            Socket.emit('addUser', currentUser.userId);

            Socket.on('getUser', socketUser => { });
            Socket.on('getMessage', data => {

                const currentMessage = messageRef.current;
                const isCurrentChat = currentMessage?.conversationId === data.conversationId;
                const isReceiver = data.receiverId === currentUser.userId;

                if (isCurrentChat) {
                    setmessage(prev => ({
                        ...prev,
                        message: [...(prev.message || []), { user: data.socketUser, messages: data.messages }],
                    }));
                } else {
                    console.log("Error ")
                }
                // 3. Show toast only if this user is the receiver and not actively chatting with the sender
                if (!isCurrentChat && isReceiver) {
                    new Audio('/bell.mp3').play()
                    toast.info(<MessageToast name={data.socketUser?.fullname} message={data.messages} />, {
                        position: "top-center",
                        autoClose: 3000,
                        theme: "dark"
                    });
                    const newNotification = {
                        _id: crypto.randomUUID(), // dummy id
                        senderId: data.socketUser,
                        message: data.messages,
                        conversationId: data.conversationId,
                        isRead: false
                    };
                    const updatedNotifications = [newNotification, ...messageRef.current.notifications || []];
                    saveNotifications(updatedNotifications);
                }
                setconversation(prev => {
                    const targetId = currentUser.userId === data.senderId ? data.receiverId : data.senderId;
                    const old = prev.find(item => item.user2.receiverId === targetId);
                    if (!old) return prev;
                    const updated = {
                        ...old,
                        lastMessage: data.messages,
                        unread: !isCurrentChat && data.senderId !== currentUser.userId,
                    };
                    const rest = prev.filter(item => item.user2.receiverId !== old.user2.receiverId);
                    return [updated, ...rest];
                });
            });
        }
    }, [Socket, currentUser?.userId]);
    useEffect(() => {
        if (Socket) {
            Socket.on("getUser", (users) => {
                setOnlineUsers(users.map(user => user.UserId));
            });
        }
    }, [Socket]);




    useEffect(() => {
        const fetchconversation = async () => {
            const res = await fetch(`${base}/api/conversation/${currentUser?.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            const resdata = await res.json()
            setconversation(resdata.cleanConversationData)
        }
        fetchconversation()
    }, [])

    useEffect(() => {
        const fetchAllUser = async () => {
            const resUser = await fetch(`${base}/api/user/${currentUser.userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            const resUserData = await resUser.json()
            setallUser(resUserData.userdata)
            
        }
        fetchAllUser()
    }, [])



    useEffect(() => {
        const results = allUser.filter((user) =>
            user?.user?.fullname.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(results);
    }, [searchTerm, allUser])


    useEffect(() => {
        const getNotifications = async () => {
            const res = await fetch(`${base}/api/notifications/${currentUser.userId}`);
            const data = await res.json();
            setNotifications(data.notifications); // save in state
        };
        getNotifications();
    }, [currentUser.userId]);

    const markNotifications = async (userId) => {
        try {
            const response = await fetch(`${base}/api/notifications/read/${userId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
        } catch (error) {
            console.error('Error marking notifications as read:', error.message);
        }
    };
    const fetchUserChat = async (conversationId, receiverUser) => {
        console.log('jhwdjqvwdjjd')
        currentConversationIdRef.current = conversationId;
        try {
            const resmessage = await fetch(
                `${base}/api/message/${conversationId}?senderId=${currentUser.userId}&receiverId=${receiverUser.receiverId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            const resdata = await resmessage.json();
            const allMessages = resdata.cleanConversationData;
            setmessage({
                message: allMessages,
                reciver: receiverUser,
                conversationId,
            });
            
        } catch (err) { console.error("Message fetch error:", err); }

        setconversation(prev =>
            prev.map(item =>
                item.conversationId === conversationId
                    ? { ...item, unread: false }
                    : item
            )
        );
    };

    const sendMessage = async () => {
        Socket?.emit('sendMessage', {
            conversationId: message?.conversationId === 'new' ? undefined : message?.conversationId,
            senderId: currentUser.userId,
            messages: SendMessage,
            receiverId: message?.reciver?.receiverId
        })
        if (!SendMessage || !message) return;
        const payload = {
            conversationId: message?.conversationId === 'new' ? undefined : message?.conversationId,
            senderId: currentUser.userId,
            messages: SendMessage,
            receiverId: message?.reciver?.receiverId
        };
        const res = await fetch(`${base}/api/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setSendMessage(''); // clear input
    };

    const markNotificationsRead = (conversationId) => {
        const updated = Notifications.map(n =>
            n.conversationId === conversationId ? { ...n, isRead: true } : n
        );
        saveNotifications(updated);
    };
    useEffect(() => {
        const localNotifs = JSON.parse(localStorage.getItem("notifications") || "[]");
        setNotifications(localNotifs);
    }, []);
    const LogOut = () => {
        if (confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('user:token')
            localStorage.removeItem('userdata')
            navigate('/user/sign_up')
        }
    }
    const fileInputRef = useRef(null);
    const handleIconClick = () => { fileInputRef.current.click(); };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setnewPic(event.target.result); };
            reader.readAsDataURL(file);
        }
    };

    const updateProfilePic = async () => {
        const res = await fetch(`${base}/api/update-pic/${currentUser.userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                pic: newPic
            })
        });
        const data = await res.json();
        if (res.ok) {
            const updatedUser = { ...currentUser, pic: data.pic };
            localStorage.setItem('userdata', JSON.stringify(updatedUser));
            navigate('/')
            setEdit(false)
            setSelectedImage(null)
        } else {
            console.error('Error:', data.message);
        }
    }
    return (<>
        <div className='flex w-screen'>
            <div className={`md:w-[25%] md:relative absolute z-50 w-screen h-[100vh]  bg-[#011031] flex flex-col p-4 space-y-4 md:block  ${isMobileFirst ? 'block' : 'hidden'}`}>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center '>
                        <img className='w-15 h-15' src="/bubble.svg" alt="" />
                        <div className='text-white font-semibold text-2xl'>ChatApp</div>
                    </div>
                    <MoreVertical size={24} className='text-white  ' onClick={() => setEdit(!Edits)} />
                </div>
                <Input type='text' placeholder='Search' className={` block `} value={data} onChange={(e) => setdata(e.target.value)} />

                <div className={`${Edits ? 'block' : 'hidden'} bg-[#817e7eb0] absolute md:bottom-0 bottom-20 w-[90%] border rounded-xl shadow-xl md:h-[95vh] h-[87vh]`}>

                    {/* Edit Icon in top-right corner */}
                    <div className="flex items-center justify-between p-4">
                        <div onClick={() => setEdit(false)} className='text-white cursor-pointer'><X size={24} /></div>
                        <button onClick={handleIconClick} className="text-white hover:text-gray-200">
                            <Edit size={24} />
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />

                    </div>

                    {/* Profile Image & User Info */}
                    <div className="flex flex-col items-center justify-center text-white">
                        <img
                            className="w-24 h-24 rounded-full bg-white object-cover border-2 border-gray-200"
                            src={currentUser.pic}
                            alt="Profile"
                        />
                        <h2 className="mt-3 text-2xl font-semibold">{currentUser.fullname}</h2>
                        <p className="text-gray-200 text-sm mb-4">{currentUser.email}</p>
                        <div className="w-1/2 border-t border-white/30 mb-6"></div>
                    </div>

                    {/* Save Button */}
                    {selectedImage && (
                        <div className="flex justify-center">
                            <button
                                onClick={updateProfilePic}
                                className="bg-white text-black font-semibold px-6 py-2 rounded-full hover:bg-gray-100 transition">
                                Save
                            </button>
                        </div>
                    )}
                    <div className='left-[40%] absolute bottom-0' onClick={() => LogOut()} ><Button label='LogOut' /></div>
                </div>

                <div className='md:h-[75vh] h-[72vh] p-2 overflow-y-scroll your-class'>
                    <ul className='flex flex-col space-y-2.5 justify-center '>
                        {conversation.length > 0 ? (

                            [...conversation]
                                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // last message wale upar
                                .map((item, index) =>
                                (
                                    <li
                                        key={index}
                                        className="flex justify-between items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-[40%px] flex items-center gap-2">
                                            <img
                                                className='object-contain rounded-full bg-white h-14 w-14 '
                                                src={item?.user2?.pic}
                                                alt=""
                                                onClick={() => {
                                                    setme(!me)
                                                    setme2(item)
                                                }}
                                            />
                                            <div className="text-white text-[15px]"
                                                onClick={() => {
                                                    fetchUserChat(item.conversationId, item.user2),
                                                    markNotificationsRead(item.conversationId);
                                                    markNotifications(currentUser.userId);
                                                    setisMobileFirst(false)
                                                    setisMobileSecond(false)
                                                }}
                                            >
                                                <div className=''>{item?.user2?.fullname}</div>
                                                <div className=" overflow-hidden w-45 text-sm">
                                                    {onlineUsers?.includes(item.user2.receiverId) ? (
                                                        <span style={{ color: "green" }}>● Online</span>
                                                    ) : (
                                                        <span style={{ color: "red" }}>● Offline</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {item.unread || Notifications.some(n => n.conversationId === item.conversationId && !n.isRead) && (
                                            <div className="w-2 h-2  bg-green-600 rounded-full "></div>
                                        )}
                                        {item.unread && (
                                            <div className="w-2 h-2  bg-green-600 rounded-full "></div>
                                        )}
                                    </li>

                                ))
                        ) : (
                            <div className="text-white text-center mt-12 text-xl">No Conversation</div>
                        )}
                    </ul>
                    <div className={`${me ? 'block' : 'hidden'} bg-[#817e7eb0] absolute top-40  w-[83%] border rounded-xl shadow-xl  h-[50vh]`}>
                        <div className="flex items-center justify-between p-4">
                            <div onClick={() => setme(false)} className='text-white cursor-pointer'><X size={24} />
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center text-white">
                            <img
                                className="w-24 h-24 rounded-full bg-white object-cover border-2 border-gray-200"
                                src={me2?.user2?.pic}
                                alt="Profile" />
                            <h2 className="mt-3 text-2xl font-semibold">{me2?.user2?.fullname}</h2>
                            <p className="text-gray-200 text-sm mb-4">{me2?.user2?.email}</p>
                            <div className="w-1/2 border-t border-white/30 mb-6"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='md:w-[50%] w-screen h-[100vh] md:relative  absolute md:border-x border-white'>
                <div className='bg-[#011031] h-[11vh] flex items-center px-4'>
                    {message?.reciver?.fullname?.length > 0 && (
                        <div className='bg-gray-700 text-white flex items-center justify-between rounded-full px-3 py-2 w-full max-w-[90vw] md:max-w-[48vw] mx-auto'>
                            {/* Left arrow for mobile */}
                            <div className='md:hidden flex items-center'>
                                <ArrowLeft
                                    size={28}
                                    className='cursor-pointer mr-2'
                                    onClick={() => {
                                        setisMobileFirst(true);
                                        setisMobileSecond(false);
                                    }}
                                />
                            </div>
                            {/* User info */}
                            <div className='flex items-center flex-1 min-w-0'>
                                <img className='object-contain rounded-full bg-white  mr-3 w-10 h-10' src={message?.reciver?.pic} alt="" />
                                <div className='overflow-hidden'>
                                    <div className='truncate text-sm md:text-base'>{message?.reciver?.fullname}</div>
                                    <div className="opacity-80 overflow-hidden w-45 text-sm">
                                        {onlineUsers?.includes(message?.reciver?.receiverId) ? (
                                            <span style={{ color: "green" }}>● Online</span>
                                        ) : (
                                            <span style={{ color: "red" }}>● Offline</span>
                                        )}

                                    </div>
                                </div>
                            </div>
                            {/* Call icon */}
                            <div className='ml-3'>
                                <img className='border rounded-full p-2 bg-white w-10 h-10' src="/call.svg" alt="Call" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-[79vh] flex flex-col  overflow-y-scroll your-class p-4 space-y-2 bg-gray-100">
                    {Array.isArray(message.message) && message?.message?.length > 0 ? (
                        message?.message?.map(({ messages, user }, index) => {
                            if ((user?.id || senderId) === currentUser?.userId) {
                                return (
                                    <div className="flex justify-end" key={index}>
                                        <div className="bg-[#008000]  w-fit break-words text-white p-3 rounded-l-xl rounded-tr-lg max-w-xs shadow">
                                            {messages}
                                        </div>
                                        <div className='flex flex-col justify-end'>
                                            <img className='object-cover border bg-white rounded-full w-7 h-7 ml-2' src={currentUser.pic} alt="" />
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="flex justify-start" key={index}>
                                        <div className='flex flex-col justify-end'>
                                            <img className='object-cover border bg-white rounded-full w-7 h-7 mr-2' src={message?.reciver?.pic} alt="" />
                                        </div>
                                        <div className="bg-slate-500 w-fit break-words text-white p-3 rounded-r-xl rounded-tl-xl max-w-xs shadow">
                                            {messages}
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : (
                        <div className='text-center mt-28 opacity-30 text-2xl font-light'>Chats Start</div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className='bg-[#011031] h-[10vh] flex items-center justify-center'>
                    {message?.reciver?.fullname?.length > 0 && (
                        <div className='flex items-center justify-center gap-3'>
                            <Input className='md:w-[40vw] w-[70vw] '
                                placeholder='Send Message'
                                type='text' value={SendMessage}
                                onChange={(e) =>
                                    setSendMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <div className='flex items-center gap-3'>
                                <img onClick={() => sendMessage()} className={`w-10 rounded-full bg-[#21c063] ${!SendMessage && 'pointer-events-none'}`} src="/send.svg" alt="" />
                                <img className={`w-10 text-white ${!SendMessage && 'pointer-events-none'}`} src="/gallery.svg" alt="" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className={`md:w-[25%] md:block  w-screen md:z-0 z-50 absolute h-[100vh] bg-[#011031] md:relative  ${isMobileSecond ? 'block' : 'hidden'}`}>
                <div className=' md:flex flex-col items-center justify-end p-4  text-white hidden '>
                    <img className='object-contain bg-white w-20 h-20 rounded-full '
                        src={currentUser.pic}
                        alt="vwwqd" />
                    <div className='flex flex-col justify-center items-center'>
                        <div className='mt-2 text-xl'>{currentUser.fullname}</div>
                        <div className=' pb-5 w-full text-center '>My Account</div>
                        <div className='border w-[25vw]'></div>
                    </div>
                </div>
                <div className='mx-2'>
                    <Input type='text' placeholder='Search' className={` block `} value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className='h-[60vh] p-4 overflow-y-scroll your-class'>
                    <ul className='flex flex-col space-y-2.5 justify-center '>

                        {searchTerm ?
                            filteredUsers.length>0 ?
                                filteredUsers.map((user, index) => (
                                   <li key={index} className='flex items-center gap-6 cursor-pointer' onClick={() => {
                                            fetchUserChat('new', user.user)
                                            setisMobileFirst(false)
                                            setisMobileSecond(false)
                                        }}>
                                            <div className=''><img className='object-contain rounded-full bg-white h-14 w-14 ' src={user?.user?.pic} alt="" /></div>
                                            <div className='text-white'>
                                                <div>{user?.user?.fullname}</div>
                                                <div className='opacity-40 overflow-hidden w-45'>{user?.user?.email}</div>
                                            </div>
                                 </li>
                                )): <div className="text-white text-center mt-12 text-xl">User Not Found</div>
                            :
                            allUser.length > 0 ?
                                Array.isArray(allUser) && allUser.map((item, index) => {
                                    return (
                                        <li key={index} className='flex items-center gap-6 cursor-pointer' onClick={() => {
                                            fetchUserChat('new', item.user)
                                            setisMobileFirst(false)
                                            setisMobileSecond(false)
                                        }}>
                                            <div className=''><img className='object-contain rounded-full bg-white h-14 w-14 ' src={item?.user?.pic} alt="" /></div>
                                            <div className='text-white'>
                                                <div>{item?.user?.fullname}</div>
                                                <div className='opacity-40 overflow-hidden w-45'>{item?.user?.email}</div>
                                            </div>
                                        </li>
                                    )
                                }) : <div className="text-white text-center mt-12 text-xl">No Conversation</div>
                        }
                    </ul>
                </div>
                <div className='left-[40%] absolute bottom-0' onClick={() => LogOut()} ><Button label='LogOut' /></div>
            </div>
        </div >
        <div className='md:hidden block'>
            {(isMobileFirst || isMobileSecond) && (
                <div className='absolute bottom-0 z-50  flex  w-screen h-15 bg-gray-500'>
                    <div onClick={() => { setisMobileFirst(true); setisMobileSecond(false) }} className='flex justify-center items-center border-r border-white w-[50%]'><Home className='text-white text-2xl' size={40} /></div>
                    <div onClick={() => { setisMobileFirst(false); setisMobileSecond(true) }} className='flex justify-center items-center border-l border-white w-[50%]'><Users className='text-white text-2xl' size={40} /></div>
                </div>
            )}
        </div>
    </>)
}

export default Dashboard