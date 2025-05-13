import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import type { RegisterData } from '../../types';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: ''
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await register(formData);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h1 className="gradient-text text-2xl font-bold mb-6 text-center">Create an Account</h1>
      
      <form onSubmit={handleSubmit} className="glass rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="name" className="block text-light text-sm font-bold mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
            placeholder="Enter your full name"
            minLength={2}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-light text-sm font-bold mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-light text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
            placeholder="Choose a password"
            minLength={6}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-light text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
            placeholder="Confirm your password"
            minLength={6}
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="gradient-border bg-dark py-2 px-4 w-full rounded-md hover:bg-dark-light transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
          
          <div className="text-center text-sm text-light">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Login here
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm; 