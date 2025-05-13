import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

interface ErrorMessageProps {
  title: string;
  message: string;
  showBackButton?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title, 
  message, 
  showBackButton = true 
}) => {
  const navigate = useNavigate();

  return (
    <div className="glass p-6 rounded-lg text-center">
      <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-400 mb-3">{title}</h2>
      <p className="text-accent mb-6">{message}</p>
      
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md bg-dark-medium hover:bg-dark-light transition-colors flex items-center mx-auto"
        >
          <FaArrowLeft className="mr-2" /> Go Back
        </button>
      )}
    </div>
  );
};

export default ErrorMessage; 