import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaPlus, FaChevronRight, FaCrown, FaSearch } from 'react-icons/fa';
import type { StudyGroup, User } from '../../types';

interface StudyGroupsProps {
  user: User;
  onCreateGroup?: () => void;
}

const StudyGroups = ({ user, onCreateGroup }: StudyGroupsProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Demo groups if none exist
  const groups = user.studyGroups || [
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
  ];

  const filteredGroups = searchQuery.trim() 
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  return (
    <div className="glass rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaUsers className="text-blue-400 mr-2" />
          <h2 className="gradient-text text-xl font-bold">Study Circles</h2>
        </div>
        
        {onCreateGroup && (
          <button 
            onClick={onCreateGroup}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <FaPlus />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-accent" />
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
              className="bg-dark-light hover:bg-dark-lighter rounded-lg p-4 cursor-pointer transition-colors"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-bold">{group.name}</h3>
                    {group.isAdmin && (
                      <span className="ml-2 text-yellow-400" title="You are an admin">
                        <FaCrown size={12} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-accent mt-1">{group.description}</p>
                  
                  <div className="flex items-center text-xs text-accent mt-2">
                    <span className="mr-3">{group.members} members</span>
                    {group.course && <span>{group.course}</span>}
                  </div>
                </div>
                
                <FaChevronRight className="text-accent" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-accent">No study groups found</p>
            {onCreateGroup && (
              <button
                onClick={onCreateGroup}
                className="mt-2 text-blue-400 hover:text-blue-500 transition-colors text-sm"
              >
                Create your first study group
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroups; 