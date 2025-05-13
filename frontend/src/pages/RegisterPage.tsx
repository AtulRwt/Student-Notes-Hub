import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuthStore } from '../store/authStore';

const RegisterPage = () => {
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
      <RegisterForm />
    </div>
  );
};

export default RegisterPage; 