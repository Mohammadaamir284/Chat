import { useState, useEffect, useRef } from 'react'
import { MoreVertical, Home, Users, ArrowLeft } from 'lucide-react';
import Input from '../../components/Input';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import MessageToast from '../../components/Message';
import Button from '../../components/Button';
const Dashboard = () => {

    const [data, setdata] = useState('')
    const [SendMessage, setSendMessage] = useState('')
    const [conversation, setconversation] = useState([])
    const [message, setmessage] = useState({ message: [] })
    const [allUser, setallUser] = useState([])
    const [Socket, setSocket] = useState(null)
    const [Notifications, setNotifications] = useState([]);
    const [isMiddleVisible, setIsMiddleVisible] = useState(false);
    const [isMobileFirst, setisMobileFirst] = useState(true)
    const [isMobileSecond, setisMobileSecond] = useState(false)
    const currentUser = JSON.parse(localStorage.getItem('userdata'));
    const messagesEndRef = useRef(null)
    const currentConversationIdRef = useRef(null);
    const messageRef = useRef(message);

    const base = import.meta.env.VITE_API_BASE_URL;

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
        const getNotifications = async () => {
            const res = await fetch(`/api/notifications/${currentUser.userId}`);
            const data = await res.json();
            setNotifications(data.notifications); // save in state
        };

        getNotifications();
    }, [currentUser.userId]);


    const fetchUserChat = async (conversationId, receiverUser) => {
     
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
        } catch (err) {
            console.error("Message fetch error:", err);
        }
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
            conversationId: message?.conversationId,
            senderId: currentUser.userId,
            messages: SendMessage,
            receiverId: message?.reciver?.receiverId
        })
        if (!SendMessage || !message) return;
        const payload = {
            conversationId: message?.conversationId,
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


    return (<>

        <div className='flex w-screen '>
            <div className={`md:w-[25%] md:relative absolute z-50 w-screen h-screen bg-[#011031] flex flex-col p-4 space-y-4 md:block  ${isMobileFirst ? 'block' : 'hidden'}`}>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center '>
                        <img className='w-15 h-15' src="/bubble.svg" alt="" />
                        <div className='text-white font-semibold text-2xl'>ChatApp</div>
                    </div>
                    <MoreVertical size={24} className='text-white ' />
                </div>
                <Input type='text' placeholder='Search' className=' block ' value={data} onChange={(e) => setdata(e.target.value)} />

                <div className='md:h-[75vh] h-[72vh] p-4 overflow-y-scroll your-class'>
                    <ul className='flex flex-col space-y-2.5 justify-center '>
                        {conversation.length > 0 ? (
                            [...conversation]
                                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // last message wale upar
                                .map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex justify-between items-center gap-6 cursor-pointer"
                                        onClick={() => {
                                            fetchUserChat(item.conversationId, item.user2),
                                                markNotificationsRead(item.conversationId);

                                            setisMobileFirst(false)
                                            setisMobileSecond(false)
                                        }}
                                    >
                                        <div className="flex items-center w-[17vw] gap-2">
                                            <img
                                                className="border rounded-full bg-white p-1 w-12"
                                                src="/vite.svg"
                                                alt=""
                                            />
                                            <div className="text-white text-[15px]">
                                                <div className=''>{item?.user2?.fullname}</div>
                                                <div className="opacity-40 overflow-hidden w-45 text-sm">
                                                    kyanode
                                                </div>
                                            </div>
                                        </div>

                                        {/* 🔴 Red Dot if unread */}
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
                </div>
            </div>

            <div className='md:w-[50%] w-screen h-screen md:relative  absolute md:border-x border-white'>
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
                                <img className='border rounded-full bg-white p-1 mr-3 w-10 h-10' src="/vite.svg" alt="" />
                                <div className='overflow-hidden'>
                                    <div className='truncate text-sm md:text-base'>{message?.reciver?.fullname}</div>
                                    <div className='opacity-40 text-xs truncate'>{message?.reciver?.email}</div>
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
                                        <div className="bg-blue-500 w-fit break-words text-white p-3 rounded-l-xl rounded-tr-lg max-w-xs shadow">
                                            {messages}
                                        </div>
                                        <div className='flex flex-col justify-end'>
                                            <img className='bg-white rounded-full w-7 ml-2' src="/vite.svg" alt="" />
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="flex justify-start" key={index}>
                                        <div className='flex flex-col justify-end'>
                                            <img className='bg-white rounded-full w-7 mr-2' src="/vite.svg" alt="" />
                                        </div>
                                        <div className="bg-white w-fit break-words text-black p-3 rounded-r-xl rounded-tl-xl max-w-xs shadow">
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
                            <Input className='md:w-[40vw] w-[70vw] ' placeholder='Send Message' type='text' value={SendMessage}
                                onChange={(e) => setSendMessage(e.target.value)} />
                            <div className='flex items-center gap-3'>
                                <img onClick={() => sendMessage()} className={`w-10 rounded-full bg-[#21c063] ${!SendMessage && 'pointer-events-none'}`} src="/send.svg" alt="" />
                                <img className={`w-10 text-white ${!SendMessage && 'pointer-events-none'}`} src="/gallery.svg" alt="" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`md:w-[25%] md:block  w-screen md:z-0 z-50 absolute h-screen bg-[#011031] md:relative  ${isMobileSecond ? 'block' : 'hidden'}`}>

                <div className='flex flex-col items-center justify-end p-4  text-white '>
                    <img className='bg-white w-20 h-20 rounded-full ' src="src/assets/react.svg" alt="vwwqd" />
                    <div className='flex flex-col justify-center items-center'>
                        <div className='mt-2 text-xl'>{currentUser.fullname}</div>
                        <div className=' pb-5 w-full text-center '>My Account</div>
                        <div className='border w-[25vw]'></div>
                    </div>
                </div>
                <div className='h-[60vh] p-4 overflow-y-scroll your-class'>
                    <ul className='flex flex-col space-y-2.5 justify-center '>
                        {allUser.length > 0 ?
                            Array.isArray(allUser) && allUser.map((item, index) => {
                                return (
                                    <li key={index} className='flex items-center gap-6 cursor-pointer' onClick={() => {
                                        fetchUserChat('new', item.user)
                                        setisMobileFirst(false)
                                        setisMobileSecond(false)
                                    }}>
                                        <div className=''><img className='border rounded-full bg-white p-1 w-14 ' src="/vite.svg" alt="" /></div>
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
                {/* <div className='left-[40%] absolute bottom-0' ><Button label='LogOut' /></div> */}
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