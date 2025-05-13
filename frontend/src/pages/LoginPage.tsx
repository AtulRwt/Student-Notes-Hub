import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <LoginForm />
    </div>
  );
};

export default LoginPage; 