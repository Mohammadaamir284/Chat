import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = lazy(() => import('./modules/Dashboard/Dashboard'));
const Form = lazy(() => import('./modules/Form'));

const ProtectedRoutes = ({ children, auth = false }) => {
  const isLogin = localStorage.getItem('user:token') !== null;
  const pathname = window.location.pathname;

  if (!isLogin && auth) return <Navigate to="/user/sign_up" />;
  if (isLogin && ['/user/sign_up', '/user/sign_in'].includes(pathname)) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Routes>
          <Route path="/" element={
            <ProtectedRoutes auth={true}>
              <Dashboard />
            </ProtectedRoutes>
          } />
          <Route path="/user/sign_up" element={
            <ProtectedRoutes>
              <Form isSignin={false} />
            </ProtectedRoutes>
          } />
          <Route path="/user/sign_in" element={
            <ProtectedRoutes>
              <Form isSignin={true} />
            </ProtectedRoutes>
          } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
