import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaPlus, FaChevronRight, FaCrown, FaSearch, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/axios';
import type { StudyGroup, User } from '../../types';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface StudyGroupsProps {
  user: User;
  onCreateGroup?: () => void;
}

const StudyGroups: React.FC<StudyGroupsProps> = ({ user, onCreateGroup }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupCourse, setGroupCourse] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStudyGroups();
  }, [user.id]);

  const fetchStudyGroups = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call to fetch the user's study groups
      const response = await apiClient.get(`/api/users/${user.id}/study-groups`);
      
      // If the API exists and returns data, use it
      if (response.data) {
        setGroups(response.data);
      } else {
        // Otherwise use demo data
        setGroups([
          {
            id: '1',
            name: 'Advanced Algorithms Study Group',
            description: 'Weekly discussions on algorithms and problem-solving',
            members: 24,
            isAdmin: true,
            course: 'B.Tech. Information Technology',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Database Systems',
            description: 'Preparing for the final DB exam',
            members: 12,
            isAdmin: false,
            course: 'B.Sc. Computer Science',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching study groups:', err);
      
      // If API fails, use demo data
      setGroups([
        {
          id: '1',
          name: 'Advanced Algorithms Study Group',
          description: 'Weekly discussions on algorithms and problem-solving',
          members: 24,
          isAdmin: true,
          course: 'B.Tech. Information Technology',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Database Systems',
          description: 'Preparing for the final DB exam',
          members: 12,
          isAdmin: false,
          course: 'B.Sc. Computer Science',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setGroupName('');
    setGroupDescription('');
    setGroupCourse('');
    setShowForm(true);
  };

  const handleEdit = (group: StudyGroup) => {
    if (!group.isAdmin) {
      toast.error('You can only edit groups where you are an admin');
      return;
    }
    
    setEditingId(group.id);
    setGroupName(group.name);
    setGroupDescription(group.description);
    setGroupCourse(group.course || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string, isAdmin: boolean) => {
    if (!isAdmin) {
      toast.error('You can only delete groups where you are an admin');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this study group?')) {
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // await apiClient.delete(`/api/study-groups/${id}`);
      
      // For now, just remove from local state
      setGroups(groups.filter(g => g.id !== id));
      toast.success('Study group deleted successfully');
    } catch (err: any) {
      console.error('Error deleting study group:', err);
      toast.error(err.response?.data?.message || 'Failed to delete study group');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingId) {
        // Update existing group (in a real app)
        // const response = await apiClient.put(`/api/study-groups/${editingId}`, {
        //   name: groupName,
        //   description: groupDescription,
        //   course: groupCourse
        // });
        
        // For now, update local state
        setGroups(groups.map(g => 
          g.id === editingId ? { 
            ...g, 
            name: groupName,
            description: groupDescription,
            course: groupCourse,
            updatedAt: new Date().toISOString()
          } : g
        ));
        
        toast.success('Study group updated successfully');
      } else {
        // Create new group (in a real app)
        // const response = await apiClient.post('/api/study-groups', {
        //   name: groupName,
        //   description: groupDescription,
        //   course: groupCourse
        // });
        
        // For now, add to local state with mock data
        const newGroup: StudyGroup = {
          id: Math.random().toString(36).substring(2, 9),
          name: groupName,
          description: groupDescription,
          course: groupCourse,
          members: 1,
          isAdmin: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setGroups([...groups, newGroup]);
        toast.success('Study group created successfully');
      }
      
      // Reset form
      setShowForm(false);
      setEditingId(null);
      setGroupName('');
      setGroupDescription('');
      setGroupCourse('');
    } catch (err: any) {
      console.error('Error saving study group:', err);
      toast.error(err.response?.data?.message || 'Failed to save study group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCardClick = (group: StudyGroup, e: React.MouseEvent) => {
    // Prevent navigation if clicking on edit/delete buttons
    if ((e.target as Element).closest('button')) {
      e.stopPropagation();
      return;
    }
    
    navigate(`/groups/${group.id}`);
  };

  const filteredGroups = searchQuery.trim() 
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (group.course?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : groups;

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaUsers className="text-blue-400 mr-2" />
            <h2 className="gradient-text text-xl font-bold">Study Circles</h2>
          </div>
        </div>
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaUsers className="text-blue-400 mr-2" />
          <h2 className="gradient-text text-xl font-bold">Study Circles</h2>
        </div>
        
        {!showForm && (
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaPlus className="mr-1" /> Create Group
          </button>
        )}
      </div>

      {/* Group Creation/Edit Form */}
      {showForm && (
        <div className="glass-light p-5 rounded-lg mb-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-3">
            {editingId ? 'Edit Study Group' : 'Create New Study Group'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                placeholder="e.g., Machine Learning Study Group"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="What will your group focus on?"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Course/Subject (Optional)
              </label>
              <input
                type="text"
                value={groupCourse}
                onChange={(e) => setGroupCourse(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Computer Science, Calculus, etc."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-dark-light hover:bg-dark-light/70 text-light px-3 py-2 rounded-md text-sm"
                disabled={isSaving}
              >
                <FaTimes className="mr-1 inline-block" /> Cancel
              </button>
              
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <FaSave className="mr-1" /> {editingId ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-light/50" />
        </div>
        <input
          type="text"
          placeholder="Search study groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div 
              key={group.id}
              className="glass-light p-4 rounded-lg cursor-pointer transition-all hover:border-blue-500/30 border border-transparent"
              onClick={(e) => handleCardClick(group, e)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-bold">{group.name}</h3>
                    {group.isAdmin && (
                      <span className="ml-2 text-yellow-400" title="You are an admin">
                        <FaCrown size={12} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-light/70 mt-1">{group.description}</p>
                  
                  <div className="flex items-center text-xs text-light/70 mt-2">
                    <span className="mr-3">{group.members} member{group.members !== 1 ? 's' : ''}</span>
                    {group.course && <span>{group.course}</span>}
                  </div>
                </div>
                
                <div className="flex items-center">
                  {group.isAdmin && (
                    <div className="flex mr-2">
                      <button 
                        onClick={() => handleEdit(group)}
                        className="text-blue-400 hover:text-blue-300 mr-2"
                        title="Edit group"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(group.id, group.isAdmin)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete group"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                  <FaChevronRight className="text-light/50" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-light p-6 rounded-lg text-center">
            <p className="text-light/70 mb-4">
              {searchQuery ? 
                'No study groups match your search' : 
                'You are not part of any study groups yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
              >
                <FaPlus className="mr-2" /> Create Your First Study Group
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups; 