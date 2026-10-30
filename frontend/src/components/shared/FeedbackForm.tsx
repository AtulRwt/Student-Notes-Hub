import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { feedbackAPI } from '../../services/api';
import type { FeedbackFormData } from '../../types';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

interface FormState extends FeedbackFormData {
  rating: number; // Override the optional rating to make it required in the component state
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    message: '',
    category: 'general',
    rating: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await feedbackAPI.submitFeedback(formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        message: '',
        category: 'general',
        rating: 0
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="glass rounded-lg p-6 max-w-2xl mx-auto">
      <h1 className="gradient-text text-2xl font-bold mb-6">Send us Feedback</h1>
      
      {success && (
        <div className="bg-green-900/20 text-green-400 p-4 rounded-md mb-6">
          <p>Thank you for your feedback! We appreciate your input.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-light text-sm font-bold mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
            minLength={2}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-light text-sm font-bold mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-light text-sm font-bold mb-2">
            Feedback Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="general">General Feedback</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="content">Content Issue</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-light text-sm font-bold mb-2">
            Rating
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className="text-2xl focus:outline-none transition-colors"
              >
                {star <= formData.rating ? (
                  <FaStar className="text-yellow-400" />
                ) : (
                  <FaRegStar className="text-gray-400 hover:text-yellow-400" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-light text-sm font-bold mb-2">
            Your Feedback *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent resize-none"
            required
            minLength={10}
          />
          <p className="text-sm text-gray-400 mt-1">
            Your feedback will be sent to: studentnoteshub@gmail.com
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm; 