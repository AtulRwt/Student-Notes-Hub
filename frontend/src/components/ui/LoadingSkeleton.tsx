import React from 'react';

interface LoadingSkeletonProps {
  type: 'profile' | 'note' | 'card' | 'list';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 1 }) => {
  const renderProfileSkeleton = () => (
    <div className="glass p-6 rounded-lg mb-6 animate-pulse relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-dark-medium"></div>
        
        <div className="flex-1 w-full">
          <div className="h-8 bg-dark-medium rounded w-3/4 md:w-1/2 mb-3"></div>
          <div className="h-4 bg-dark-medium rounded w-1/2 md:w-1/4 mb-6"></div>
          
          <div className="h-12 bg-dark-medium rounded w-full mb-6"></div>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="h-12 w-16 bg-dark-medium rounded"></div>
            <div className="h-12 w-16 bg-dark-medium rounded"></div>
            <div className="h-12 w-16 bg-dark-medium rounded"></div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="h-10 w-24 bg-dark-medium rounded"></div>
          <div className="h-10 w-24 bg-dark-medium rounded"></div>
        </div>
      </div>
    </div>
  );

  const renderNoteSkeleton = () => (
    <div className="glass p-6 rounded-lg mb-6 animate-pulse">
      <div className="h-8 bg-dark-medium rounded w-3/4 mb-4"></div>
      
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-dark-medium"></div>
        <div className="ml-3">
          <div className="h-4 bg-dark-medium rounded w-32 mb-2"></div>
          <div className="h-3 bg-dark-medium rounded w-24"></div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-dark-medium rounded w-full"></div>
        <div className="h-4 bg-dark-medium rounded w-full"></div>
        <div className="h-4 bg-dark-medium rounded w-3/4"></div>
      </div>
      
      <div className="flex justify-between mt-6">
        <div className="h-8 w-20 bg-dark-medium rounded"></div>
        <div className="h-8 w-20 bg-dark-medium rounded"></div>
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="glass-light p-4 rounded-lg animate-pulse">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-dark-medium"></div>
        <div className="ml-3 flex-1">
          <div className="h-4 bg-dark-medium rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-dark-medium rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-24 bg-dark-medium rounded mb-3"></div>
      <div className="flex justify-between">
        <div className="h-6 bg-dark-medium rounded w-16"></div>
        <div className="h-6 bg-dark-medium rounded w-16"></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="glass-light p-4 rounded-lg flex items-center">
          <div className="w-10 h-10 rounded-full bg-dark-medium"></div>
          <div className="ml-3 flex-1">
            <div className="h-4 bg-dark-medium rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-dark-medium rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-dark-medium rounded"></div>
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'profile':
      return renderProfileSkeleton();
    case 'note':
      return renderNoteSkeleton();
    case 'card':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(count)].map((_, index) => (
            <React.Fragment key={index}>
              {renderCardSkeleton()}
            </React.Fragment>
          ))}
        </div>
      );
    case 'list':
      return renderListSkeleton();
    default:
      return null;
  }
};

export default LoadingSkeleton; 