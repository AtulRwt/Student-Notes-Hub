import React from 'react';
import FeedbackForm from '../components/shared/FeedbackForm';

const FeedbackPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-4">Feedback</h1>
          <p className="text-light opacity-80">
            We value your feedback! Please let us know your thoughts, suggestions, or report any issues you've encountered.
          </p>
        </div>
        
        <FeedbackForm />
      </div>
    </div>
  );
};

export default FeedbackPage; 