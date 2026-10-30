import { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaCheck, FaSpinner, FaUserClock, FaUserTimes } from 'react-icons/fa';
import { useNetworkStore } from '../../store/networkStore';

interface ConnectButtonProps {
  userId: string;
  initialStatus?: {
    connected: boolean;
    sentRequest: string | null;
    receivedRequest: string | null;
  };
  onStatusChange?: (newStatus: any) => void;
  size?: 'sm' | 'md' | 'lg';
}

const ConnectButton = ({ 
  userId, 
  initialStatus, 
  onStatusChange,
  size = 'md' 
}: ConnectButtonProps) => {
  const { 
    sendConnectionRequest, 
    acceptConnectionRequest, 
    declineConnectionRequest, 
    removeConnection, 
    checkRelationship 
  } = useNetworkStore();
  
  const [status, setStatus] = useState(initialStatus || {
    connected: false,
    sentRequest: null,
    receivedRequest: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use memoized function to check relationship status
  const checkRelationshipStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const relationshipStatus = await checkRelationship(userId);
      setStatus({
        connected: relationshipStatus.connected,
        sentRequest: relationshipStatus.sentRequest,
        receivedRequest: relationshipStatus.receivedRequest
      });
    } catch (error) {
      console.error('Error checking relationship status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, checkRelationship]);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    } else {
      // Check relationship status if not provided
      checkRelationshipStatus();
    }
  }, [userId, initialStatus, checkRelationshipStatus]);

  const handleConnect = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // If already connected and hovering (indicating user wants to disconnect)
      if (status.connected && isHovered) {
        // Remove connection using the store method
        await removeConnection(userId);
        setStatus(prev => ({
          ...prev,
          connected: false,
          sentRequest: null,
          receivedRequest: null
        }));
      }
      // If there's a received request, accept it
      else if (status.receivedRequest === 'pending') {
        await acceptConnectionRequest(userId);
        setStatus(prev => ({
          ...prev,
          receivedRequest: null,
          connected: true
        }));
      } 
      // Otherwise send a new request
      else if (!status.sentRequest && !status.connected) {
        const response = await sendConnectionRequest(userId);
        setStatus(prev => ({
          ...prev,
          sentRequest: 'pending',
          connected: response.status === 'accepted'
        }));
      }
      
      if (onStatusChange) {
        onStatusChange(status);
      }
    } catch (error) {
      console.error('Error handling connection action:', error);
      // Refresh the status in case of error
      checkRelationshipStatus();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Button sizing classes
  const buttonSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  // Determine button style based on status
  let buttonContent;
  let buttonClasses = `rounded-md flex items-center justify-center transition-all ${buttonSizes[size]}`;
  
  if (isLoading) {
    buttonContent = (
      <>
        <FaSpinner className="animate-spin mr-1" /> 
        <span>{size !== 'sm' ? 'Loading...' : ''}</span>
      </>
    );
    buttonClasses += ' bg-gray-600 cursor-not-allowed opacity-70';
  } else if (status.connected) {
    buttonContent = (
      <>
        <FaCheck className="mr-1" /> 
        <span>{size !== 'sm' ? 'Connected' : ''}</span>
      </>
    );
    
    if (isHovered) {
      buttonContent = (
        <>
          <FaUserTimes className="mr-1" /> 
          <span>{size !== 'sm' ? 'Remove' : ''}</span>
        </>
      );
      buttonClasses += ' bg-red-600 hover:bg-red-700';
    } else {
      buttonClasses += ' bg-green-600 hover:bg-green-700';
    }
  } else if (status.sentRequest === 'pending') {
    buttonContent = (
      <>
        <FaUserClock className="mr-1" /> 
        <span>{size !== 'sm' ? 'Pending' : ''}</span>
      </>
    );
    buttonClasses += ' bg-yellow-600 hover:bg-yellow-700 cursor-default';
  } else if (status.receivedRequest === 'pending') {
    buttonContent = (
      <>
        <FaUserPlus className="mr-1" /> 
        <span>{size !== 'sm' ? 'Accept' : ''}</span>
      </>
    );
    buttonClasses += ' bg-blue-600 hover:bg-blue-700';
  } else {
    buttonContent = (
      <>
        <FaUserPlus className="mr-1" /> 
        <span>{size !== 'sm' ? 'Connect' : ''}</span>
      </>
    );
    buttonClasses += ' bg-purple-600 hover:bg-purple-700';
  }
  
  return (
    <button
      onClick={handleConnect}
      disabled={isLoading || (status.sentRequest === 'pending' && !status.connected && !isHovered)}
      className={buttonClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={
        status.connected ? (isHovered ? 'Remove connection' : 'Connected') :
        status.sentRequest === 'pending' ? 'Connection request pending' :
        status.receivedRequest === 'pending' ? 'Accept connection request' :
        'Send connection request'
      }
    >
      {buttonContent}
    </button>
  );
};

export default ConnectButton; 