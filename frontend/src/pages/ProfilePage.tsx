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
import { FaEdit, FaPlus } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import SocialTab from '../components/social/SocialTab';
import EditProfileForm from '../components/profile/EditProfileForm';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

// Stub components with proper props
interface AcademicPortfolioProps {
  user: User;
  isEditable?: boolean;
  onUpdate?: (portfolio: Record<string, any>) => void;
}

const AcademicPortfolio = (_props: AcademicPortfolioProps) => (
  <div className="glass rounded-lg p-6 mb-6">
    <h2 className="gradient-text text-xl font-bold mb-4">Academic Portfolio</h2>
    <p className="text-accent">Portfolio component will be implemented here.</p>
  </div>
);

interface StudyGroupsProps {
  user: User;
  onCreateGroup?: () => void;
}

const StudyGroups = (_props: StudyGroupsProps) => (
  <div className="glass rounded-lg p-6 mb-6">
    <h2 className="gradient-text text-xl font-bold mb-4">Study Groups</h2>
    <p className="text-accent">Study groups component will be implemented here.</p>
  </div>
);

interface ResourceCollectionsProps {
  user: User;
  onCreateCollection?: () => void;
}

const ResourceCollections = (_props: ResourceCollectionsProps) => (
  <div>
    <h2 className="gradient-text text-xl font-bold mb-4">Your Collections</h2>
    <p className="text-accent">Collections component will be implemented here.</p>
  </div>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const { fetchNotes, notes, isLoading } = useNotesStore();
  const { fetchConnectionRequests } = useNetworkStore();
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'collections' | 'groups' | 'network'>('notes');
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
          <div className="relative">
            <ProfileHeader 
              id={user.id}
              name={user.name}
              email={user.email}
              bio={user.bio}
              profileImage={user.profileImage}
              isCurrentUser={true}
              _count={{
                notes: user._count?.notes || 0,
                followers: user._count?.followers || 0,
                following: user._count?.following || 0
              }}
              onProfileUpdate={(userData) => setUser({...user, ...userData})}
            />
            
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 p-2 bg-dark-medium hover:bg-dark-light rounded-full transition-colors"
              title="Edit Profile"
            >
              <FaEdit size={18} className="text-blue-400" />
            </button>
          </div>
          
          <div className="glass rounded-lg p-4">
            <Tab.Group>
              <Tab.List className="flex p-1 space-x-2 bg-dark-light/30 rounded-lg mb-4">
                <Tab className={({ selected }: { selected: boolean }) => 
                  `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
                   ${selected 
                    ? 'bg-dark-medium font-medium text-white shadow' 
                    : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
                }>
                  <span>My Notes</span>
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => 
                  `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
                   ${selected 
                    ? 'bg-dark-medium font-medium text-white shadow' 
                    : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
                }>
                  <span>Bookmarks</span>
                </Tab>
                <Tab className={({ selected }: { selected: boolean }) => 
                  `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
                   ${selected 
                    ? 'bg-dark-medium font-medium text-white shadow' 
                    : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
                }>
                  <span>Network</span>
                </Tab>
              </Tab.List>
              
              <Tab.Panels className="mt-4">
                <Tab.Panel>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Your Notes</h2>
                    <Link 
                      to="/notes/create" 
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                    >
                      <FaPlus size={14} /> 
                      <span>New Note</span>
                    </Link>
                  </div>
                  
                  {userNotes.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                      <p className="text-accent mb-4">Create your first note to share your knowledge with others!</p>
                      <Link 
                        to="/notes/create" 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md inline-flex items-center gap-2 transition-colors"
                      >
                        <FaPlus size={14} /> Create Note
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userNotes.map(note => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  )}
                </Tab.Panel>
                
                <Tab.Panel>
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">Bookmarks</h3>
                    <p className="text-accent">This feature is coming soon!</p>
                  </div>
                </Tab.Panel>
                
                <Tab.Panel>
                  <SocialTab userId={user.id} onProfileUpdate={refreshUserProfile} />
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