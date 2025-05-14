import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNotesStore } from '../store/notesStore';
import { useNetworkStore } from '../store/networkStore';
import NoteCard from '../components/notes/NoteCard';
import ProfileForm from '../components/profile/ProfileForm';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileHeader from '../components/profile/ProfileHeader';
import UserSuggestions from '../components/social/UserSuggestions';
import ConnectionRequests from '../components/social/ConnectionRequests';
import type { Note, User } from '../types';
import { FaEdit, FaPlus, FaBookmark, FaUserFriends, FaGraduationCap, FaMapMarkerAlt, FaLink, FaHistory, FaUsers } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import SocialTab from '../components/social/SocialTab';
import EditProfileForm from '../components/profile/EditProfileForm';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import AcademicPortfolio from '../components/profile/AcademicPortfolio';
import StudyGroups from '../components/profile/StudyGroups';
import ResourceCollections from '../components/profile/ResourceCollections';

// Extended User type with additional properties
interface ExtendedUser extends User {
  location?: string;
  website?: string;
  createdAt: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout, setUser } = useAuthStore();
  const { fetchNotes, notes, isLoading } = useNotesStore();
  const { fetchConnectionRequests } = useNetworkStore();
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'collections' | 'groups' | 'network'>('notes');
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cast the user to ExtendedUser with default values for the new fields
  const user = authUser as ExtendedUser;
  if (user) {
    user.location = user.location || '';
    user.website = user.website || '';
    user.createdAt = user.createdAt || new Date().toISOString();
  }
  
  useEffect(() => {
    // Fetch all user's notes
    fetchNotes();
    // Fetch connection requests
    fetchConnectionRequests();
  }, [fetchNotes, fetchConnectionRequests]);
  
  useEffect(() => {
    // Filter notes by current user
    if (notes.length > 0 && user) {
      const filteredNotes = notes.filter(note => note.userId === user.id);
      setUserNotes(filteredNotes);
    }
  }, [notes, user]);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchUserNotes = async () => {
      setIsLoadingNotes(true);
      try {
        const response = await apiClient.get(`/api/users/${user.id}/notes`);
        setUserNotes(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user notes:', err);
        setError(err.response?.data?.message || 'Failed to load notes');
      } finally {
        setIsLoadingNotes(false);
      }
    };
    
    fetchUserNotes();
  }, [user]);
  
  // Add an effect to periodically refresh the user profile data
  useEffect(() => {
    if (!user) return;
    
    // Refresh the user profile data immediately when the component mounts
    refreshUserProfile();
    
    // Set up an interval to refresh the profile data every 3 minutes instead of 30 seconds
    const intervalId = setInterval(() => {
      refreshUserProfile();
    }, 180000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [user?.id]);
  
  // Add an effect to listen for the custom event
  useEffect(() => {
    const handleProfileUpdate = (event: any) => {
      if (event.detail && user) {
        setUser({
          ...user,
          ...event.detail,
          _count: {
            notes: event.detail._count?.notes || user._count?.notes || 0,
            followers: event.detail._count?.followers || user._count?.followers || 0,
            following: event.detail._count?.following || user._count?.following || 0
          }
        });
        console.log("Profile updated from event:", event.detail);
      }
    };
    
    // Add event listener
    window.addEventListener('current-user-profile-updated', handleProfileUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('current-user-profile-updated', handleProfileUpdate);
    };
  }, [user, setUser]);
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleCreateCollection = () => {
    // In a real app, this would open a modal or navigate to a create collection page
    toast.success('Create collection feature coming soon!');
  };

  const handleCreateGroup = () => {
    // In a real app, this would open a modal or navigate to a create group page
    toast.success('Create study group feature coming soon!');
  };
  
  // Modify the refreshUserProfile function to be more robust
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const response = await apiClient.get(`/api/users/${user.id}`);
      // Make sure the response includes the _count field
      if (response.data && response.data._count) {
        // Only update if there are actual changes
        if (JSON.stringify(user) !== JSON.stringify(response.data)) {
          // Update the user in the auth store
          setUser({
            ...user, 
            ...response.data,
            _count: {
              notes: response.data._count.notes || 0,
              followers: response.data._count.followers || 0,
              following: response.data._count.following || 0
            }
          });
          console.log("Profile refreshed with changes:", response.data);
        } else {
          console.log("Profile refresh: no changes detected");
        }
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      // Stop further periodic refreshes on auth errors
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log("Auth error detected, stopping periodic profile refreshes");
        // Navigate to login if token is invalid
        navigate('/login');
      }
    }
  };
  
  if (isLoadingNotes) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton type="profile" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          title="Error Loading Profile"
          message={error || 'Could not load your profile'}
        />
      </div>
    );
  }
  
  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {isEditing ? (
        <EditProfileForm 
          onCancel={() => setIsEditing(false)} 
          onSuccess={handleEditSuccess} 
        />
      ) : (
        <>
          <div className="glass relative overflow-hidden rounded-xl mb-6">
            {/* Cover Photo Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 h-32 w-full"></div>
            
            <div className="relative pt-36 px-6 pb-6">
              {/* Profile Image - Positioned to overlap the cover photo */}
              <div className="absolute top-16 left-6">
                <div className="relative">
                  <img 
                    src={user.profileImage || '/default-avatar.png'} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-dark shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-dark"></div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-light/70">{user.email}</p>
                  
                  {/* User metadata */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {user.education && (
                      <div className="flex items-center text-sm text-light/70">
                        <FaGraduationCap className="mr-1 text-blue-400" />
                        <span>{user.education}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center text-sm text-light/70">
                        <FaMapMarkerAlt className="mr-1 text-red-400" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center text-sm text-light/70">
                        <FaLink className="mr-1 text-green-400" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                          Personal Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-light/70">
                      <FaHistory className="mr-1 text-purple-400" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-start justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <FaEdit className="mr-2" /> Edit Profile
                  </button>
                </div>
              </div>
              
              {/* Bio section */}
              {user.bio && (
                <div className="mt-4 glass-light p-4 rounded-lg">
                  <p className="italic text-light/90">{user.bio}</p>
                </div>
              )}
              
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="glass-light p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{user._count?.notes || 0}</div>
                  <div className="text-sm">Notes</div>
                </div>
                <div className="glass-light p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">{user._count?.followers || 0}</div>
                  <div className="text-sm">Followers</div>
                </div>
                <div className="glass-light p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{user._count?.following || 0}</div>
                  <div className="text-sm">Following</div>
                </div>
              </div>
            </div>
          </div>
          
          <AcademicPortfolio 
            user={user} 
            isEditable={true} 
            onUpdate={(data) => {
              // Update user data with the updated portfolio
              if (user) {
                setUser({
                  ...user,
                  ...data
                });
              }
            }}
          />
          
          <div className="glass rounded-lg p-4 mb-6">
            <Tab.Group>
              <Tab.List className="flex p-1 space-x-2 bg-dark-light/30 rounded-lg mb-4">
                <Tab className={({ selected }: { selected: boolean }) => 
                  `w-full py-2.5 text-sm font-medium rounded-md transition-all ${
                    selected
                      ? 'bg-dark-light text-blue-400 shadow'
                      : 'text-light/70 hover:text-blue-400/70 hover:bg-dark-light/70'
                  }`
                } onClick={() => setActiveTab('notes')}>
                  <div className="flex items-center justify-center">
                    <FaBookmark className="mr-2" /> 
                    <span>Notes</span>
                  </div>
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => 
                  `w-full py-2.5 text-sm font-medium rounded-md transition-all ${
                    selected
                      ? 'bg-dark-light text-blue-400 shadow'
                      : 'text-light/70 hover:text-blue-400/70 hover:bg-dark-light/70'
                  }`
                } onClick={() => setActiveTab('collections')}>
                  <div className="flex items-center justify-center">
                    <FaPlus className="mr-2" /> 
                    <span>Collections</span>
                  </div>
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => 
                  `w-full py-2.5 text-sm font-medium rounded-md transition-all ${
                    selected
                      ? 'bg-dark-light text-blue-400 shadow'
                      : 'text-light/70 hover:text-blue-400/70 hover:bg-dark-light/70'
                  }`
                } onClick={() => setActiveTab('groups')}>
                  <div className="flex items-center justify-center">
                    <FaUsers className="mr-2" /> 
                    <span>Study Groups</span>
                  </div>
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => 
                  `w-full py-2.5 text-sm font-medium rounded-md transition-all ${
                    selected
                      ? 'bg-dark-light text-blue-400 shadow'
                      : 'text-light/70 hover:text-blue-400/70 hover:bg-dark-light/70'
                  }`
                } onClick={() => setActiveTab('network')}>
                  <div className="flex items-center justify-center">
                    <FaUserFriends className="mr-2" /> 
                    <span>Network</span>
                  </div>
                </Tab>
              </Tab.List>
              
              <Tab.Panels>
                <Tab.Panel>
                  {userNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userNotes.map(note => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                      
                      <Link
                        to="/notes/create"
                        className="glass-light p-4 rounded-lg border border-blue-500/20 opacity-70 hover:opacity-100 transition-opacity flex justify-center items-center h-full"
                      >
                        <div className="text-blue-400 flex flex-col items-center justify-center py-6">
                          <FaPlus size={24} className="mb-2" />
                          <span>Upload a New Note</span>
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div className="glass-light p-6 rounded-lg text-center">
                      <p className="text-light/70 mb-4">You haven't uploaded any notes yet.</p>
                      <Link
                        to="/notes/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
                      >
                        <FaPlus className="mr-2" /> Upload Your First Note
                      </Link>
                    </div>
                  )}
                </Tab.Panel>
                
                <Tab.Panel>
                  <ResourceCollections user={user} onCreateCollection={handleCreateCollection} />
                </Tab.Panel>
                
                <Tab.Panel>
                  <StudyGroups user={user} onCreateGroup={handleCreateGroup} />
                </Tab.Panel>
                
                <Tab.Panel>
                  <SocialTab userId={user.id} />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage; 