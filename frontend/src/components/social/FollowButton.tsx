import { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaUserMinus, FaSpinner } from 'react-icons/fa';
import { useNetworkStore } from '../../store/networkStore';
import apiClient from '../../api/axios';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onStatusChange?: (following: boolean) => void;
  onFollowChange?: (following: boolean) => void;
  onProfileUpdate?: (userData: any) => void;
  size?: 'sm' | 'md' | 'lg';
}

const FollowButton = ({ 
  userId, 
  initialFollowing,
  onStatusChange,
  onFollowChange,
  onProfileUpdate,
  size = 'md' 
}: FollowButtonProps) => {
  const { followUser, unfollowUser, checkRelationship } = useNetworkStore();
  const [isFollowing, setIsFollowing] = useState(initialFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if the user is following the target user
  const checkFollowingStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const relationshipStatus = await checkRelationship(userId);
      setIsFollowing(relationshipStatus.following);
    } catch (error) {
      console.error('Error checking following status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, checkRelationship]);

  useEffect(() => {
    if (initialFollowing !== undefined) {
      setIsFollowing(initialFollowing);
    } else {
      // Check following status if not provided
      checkFollowingStatus();
    }
  }, [userId, initialFollowing, checkFollowingStatus]);
  
  // Function to refresh user profile data with a delay
  const refreshUserProfile = async () => {
    if (!userId || !onProfileUpdate) return;
    
    try {
      // Add a small delay to ensure the database has been updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the updated profile data
      const response = await apiClient.get(`/api/users/${userId}`);
      onProfileUpdate(response.data);
      
      // Also refresh the current user's profile to update their following count
      // Get the current user's ID from auth token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Parse JWT token to get current user ID
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const currentUserId = decodedToken.id;
          
          // Don't refresh if we're already refreshing the current user's profile
          if (currentUserId !== userId) {
            const currentUserResponse = await apiClient.get(`/api/users/${currentUserId}`);
            
            // Dispatch an event to notify that the current user profile data has changed
            const event = new CustomEvent('current-user-profile-updated', { 
              detail: currentUserResponse.data 
            });
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.error('Error refreshing current user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        
        if (onStatusChange) {
          onStatusChange(false);
        }
        
        if (onFollowChange) {
          onFollowChange(false);
        }
      } else {
        await followUser(userId);
        setIsFollowing(true);
        
        if (onStatusChange) {
          onStatusChange(true);
        }
        
        if (onFollowChange) {
          onFollowChange(true);
        }
      }
      
      // Refresh the user profile data to get updated follower/following counts
      await refreshUserProfile();
    } catch (error) {
      console.error('Error handling follow/unfollow action:', error);
      // Refresh status in case of error
      checkFollowingStatus();
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
  
  // Determine button style based on following status
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
  } else if (isFollowing) {
    buttonContent = (
      <>
        <FaUserMinus className="mr-1" /> 
        <span>{size !== 'sm' ? 'Following' : ''}</span>
      </>
    );
    buttonClasses += ' bg-green-600 hover:bg-red-700 hover:text-white';
  } else {
    buttonContent = (
      <>
        <FaUserPlus className="mr-1" /> 
        <span>{size !== 'sm' ? 'Follow' : ''}</span>
      </>
    );
    buttonClasses += ' bg-blue-600 hover:bg-blue-700';
  }
  
  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={buttonClasses}
      title={isFollowing ? 'Following this user' : 'Follow this user'}
    >
      {buttonContent}
    </button>
  );
};

export default FollowButton; 