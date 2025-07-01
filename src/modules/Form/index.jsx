import { useState } from 'react'
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom'

const Input = lazy(() => import('../../components/Input'));
const Button = lazy(() => import('../../components/Button'));
const Form = ({ isSignin = true }) => {

    const base = import.meta.env.VITE_API_BASE_URL;

    const [data, setdata] = useState({
        ...(!isSignin && { fullname: '' }),
        email: '',
        password: ''
    })

    const handelSubmit = async (e) => {
        e.preventDefault()
        console.log('Form submitted:', data)
        const res = await fetch(`${base}/api/${isSignin ? 'login' : 'register'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        const resdata = await res.json()
        console.log('data == ', resdata)
        alert(resdata.message)
        if (resdata.token) {
            localStorage.setItem('user:token', resdata.token)
            localStorage.setItem('userdata', JSON.stringify(resdata.user))
            navigate('/')
        } else (
            console.log('alert', resdata.message)
        )
    }


    const navigate = useNavigate()
    return (
        <div className='h-screen flex items-center justify-center w-full'>
            <div className='bg-white h-[80vh] md:w-[50vw] w-[90vw] shadow-2xl rounded-lg shadow-gray-400 p-3 flex flex-col items-center'>
                <div className='text-4xl mb-4 text-blue-600 font-bold'>Welcome {isSignin && "Back"}</div>
                <div className='text-xl font-semibold border-b w-full text-center pb-7'> {isSignin ? 'Sign In to Explore' : 'SignUp to Get Started'} </div>
                <form className='flex flex-col items-center mt-4' onSubmit={(e) => { handelSubmit(e) }}>
                    <div className='mt-4 flex flex-col'>
                        <Suspense fallback={<div>Loading form...</div>}>
                            {!isSignin && (
                                <Input
                                    className=' md:w-[40vw] w-[80vw]'
                                    type='text'
                                    placeholder='Enter Your Name'
                                    label='Full Name'
                                    value={data.fullname}
                                    onChange={(e) => setdata({ ...data, fullname: e.target.value })}
                                />
                            )}
                            <Input
                                className=' md:w-[40vw] w-[80vw]'
                                type='text'
                                placeholder='Enter Your Email Address'
                                label='Email Address'
                                value={data.email}
                                onChange={(e) => setdata({ ...data, email: e.target.value })}
                            />
                            <Input
                                className=' md:w-[40vw] w-[80vw]'
                                type='password'
                                placeholder='Enter Your Password'
                                label='Password'
                                value={data.password}
                                onChange={(e) => setdata({ ...data, password: e.target.value })}
                            />
                            <Button
                                label={isSignin ? 'Sign In' : 'Join By Sign Up'}
                                type='submit'
                                className='mt-4 text-center'
                            />
                        </Suspense>
                    </div>
                </form>
                {
                    isSignin ?
                        <div className='text-[20px] md:mt-3 mt-8'>Create Account <span onClick={() => navigate('/user/sign_up')} className='text-blue-600 underline text-[20px] cursor-pointer'>SignUp</span></div>
                        :
                        <div className='text-[20px] md:mt-3 mt-8'>Already Have An Account? <span onClick={() => navigate('/user/sign_in')} className='text-blue-600 underline text-[20px] cursor-pointer'>SignIn</span></div>
                }
            </div >
        </div>
    )
}

export default Form