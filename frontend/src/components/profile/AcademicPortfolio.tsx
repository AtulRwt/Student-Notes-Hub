import React, { useState } from 'react';
import { FaEdit, FaGraduationCap, FaBookmark, FaChartLine, FaMedal, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/axios';
import type { User } from '../../types';

// Extended User type with additional properties
interface ExtendedUser extends User {
  location?: string;
  website?: string;
  createdAt: string;
}

interface AcademicPortfolioProps {
  user: ExtendedUser;
  isEditable?: boolean;
  onUpdate?: (portfolio: Record<string, any>) => void;
}

const AcademicPortfolio: React.FC<AcademicPortfolioProps> = ({ user, isEditable, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [education, setEducation] = useState(user.education || '');
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.put('/api/auth/profile', {
        education,
        interests
      });
      
      if (response.data) {
        toast.success('Academic portfolio updated!');
        
        // Update the user in the parent component
        if (onUpdate) {
          onUpdate({
            education,
            interests
          });
        }
        
        // Dispatch a custom event to notify other components
        const event = new CustomEvent('current-user-profile-updated', {
          detail: { education, interests }
        });
        window.dispatchEvent(event);
        
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating portfolio:', error);
      toast.error(error.response?.data?.message || 'Failed to update portfolio');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };
  
  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };
  
  return (
    <div className="glass rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="gradient-text text-xl font-bold">Academic Portfolio</h2>
        {isEditable && !isEditing && (
          <button 
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-md text-sm flex items-center"
            onClick={() => setIsEditing(true)}
          >
            <FaEdit className="mr-1" /> Edit
          </button>
        )}
        
        {isEditing && (
          <div className="flex gap-2">
            <button
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded-md text-sm flex items-center"
              onClick={() => {
                setIsEditing(false);
                setEducation(user.education || '');
                setInterests(user.interests || []);
              }}
              disabled={isLoading}
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
            
            <button 
              className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1 rounded-md text-sm flex items-center"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FaSave className="mr-1" /> Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isEditing ? (
          // Edit mode
          <>
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaGraduationCap className="text-blue-400 mr-2" />
                <h3 className="font-semibold">Education</h3>
              </div>
              <textarea
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-sm text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your education information..."
                rows={3}
              />
            </div>
            
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaBookmark className="text-purple-400 mr-2" />
                <h3 className="font-semibold">Interests</h3>
              </div>
              <div className="mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-sm text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Add an interest..."
                  />
                  <button
                    onClick={addInterest}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <div key={index} className="bg-dark-light px-3 py-1 rounded-md text-xs flex items-center">
                    <span>{interest}</span>
                    <button
                      className="ml-2 text-red-400 hover:text-red-300"
                      onClick={() => removeInterest(interest)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {interests.length === 0 && (
                  <p className="text-sm text-light/80">No interests added yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          // View mode
          <>
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaGraduationCap className="text-blue-400 mr-2" />
                <h3 className="font-semibold">Education</h3>
              </div>
              <p className="text-sm text-light/80">
                {user.education || 'No education information added yet'}
              </p>
            </div>
            
            <div className="glass-light p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaBookmark className="text-purple-400 mr-2" />
                <h3 className="font-semibold">Interests</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                  user.interests.map((interest, index) => (
                    <span key={index} className="bg-dark-light px-2 py-1 rounded-md text-xs">
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-light/80">No interests added yet</p>
                )}
              </div>
            </div>
          </>
        )}
        
        <div className="glass-light p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaChartLine className="text-green-400 mr-2" />
            <h3 className="font-semibold">Activity</h3>
          </div>
          <div className="flex justify-between text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{user._count?.notes || 0}</div>
              <div className="text-xs opacity-70">Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{user._count?.following || 0}</div>
              <div className="text-xs opacity-70">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{user._count?.followers || 0}</div>
              <div className="text-xs opacity-70">Followers</div>
            </div>
          </div>
        </div>
        
        <div className="glass-light p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaMedal className="text-yellow-400 mr-2" />
            <h3 className="font-semibold">Achievements</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-md text-xs flex items-center">
              <FaMedal className="mr-1 text-yellow-400" size={10} /> First Note
            </span>
            {user._count && user._count.notes >= 5 && (
              <span className="bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-1 rounded-md text-xs flex items-center">
                <FaMedal className="mr-1 text-green-400" size={10} /> 5+ Notes
              </span>
            )}
            {user._count && user._count.followers >= 1 && (
              <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md text-xs flex items-center">
                <FaMedal className="mr-1 text-blue-400" size={10} /> First Follower
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicPortfolio; 