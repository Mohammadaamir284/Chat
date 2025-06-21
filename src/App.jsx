import { useState } from 'react'
import Form from './modules/Form'
import Dashboard from './modules/Dashboard/Dashboard'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoutes = ({ children, auth=false }) => {
  const isLogin = localStorage.getItem('user:token') !== null 
  if (!isLogin && auth) {
    return <Navigate to={'/user/sign_up'} />
  } else if (isLogin && ['/user/sign_up', '/user/sign_in'].includes(window.location.pathname)) {
    return <Navigate to={'/'} />
  }
 return children
}

function App() {

  return (

    <>
       <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path='/' element={
          <ProtectedRoutes auth={true}>
            <Dashboard  />
          </ProtectedRoutes>
        } />
        <Route path='/user/sign_up' element={
          <ProtectedRoutes>
            <Form isSignin={false} />
          </ProtectedRoutes>
        } />
        <Route path='/user/sign_in' element={
          <ProtectedRoutes>
            <Form isSignin={true} />
          </ProtectedRoutes>
        } />

      </Routes>
    </>
  )
}

export default App
