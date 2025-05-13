import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaUserFriends, FaBook, FaListUl, FaRegStar, FaNetworkWired } from 'react-icons/fa';
import { Tab } from '@headlessui/react';
import apiClient from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import ConnectButton from '../components/social/ConnectButton';
import FollowButton from '../components/social/FollowButton';
import Avatar from '../components/shared/Avatar';
import NoteCard from '../components/notes/NoteCard';
import UserSuggestions from '../components/social/UserSuggestions';
import ProfileHeader from '../components/profile/ProfileHeader';
import SocialTab from '../components/social/SocialTab';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import type { Note } from '../types';

interface UserProfileData {
  id: string;
  name: string;
  bio: string | null;
  email: string;
  profileImage: string | null;
  education: string | null;
  interests: string[];
  socialLinks: Record<string, string> | null;
  createdAt: string;
  _count?: {
    notes: number;
    followers: number;
    following: number;
  };
}

interface UserNote extends Omit<Note, 'user'> {
  user: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  isFavorited?: boolean;
}

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { checkRelationship } = useNetworkStore();
  
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<{
    following: boolean;
    connected: boolean;
    sentRequest: string | null;
    receivedRequest: string | null;
  }>({
    following: false,
    connected: false,
    sentRequest: null,
    receivedRequest: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'about'>('notes');

  // Fetch user data and relationship status
  useEffect(() => {
    if (!userId || userId === currentUser?.id) {
      navigate('/profile');
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profile data
        const userResponse = await apiClient.get(`/api/users/${userId}`);
        setUser(userResponse.data);
        
        // Fetch relationship status
        const relationshipResponse = await checkRelationship(userId);
        setRelationshipStatus(relationshipResponse);
        
        // Fetch user's notes
        const notesResponse = await apiClient.get(`/api/users/${userId}/notes`);
        setUserNotes(notesResponse.data);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.error || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser, navigate, checkRelationship]);

  // Handle relationship status changes
  const handleStatusChange = (newStatus: any) => {
    setRelationshipStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  // Handle follow status change
  const handleFollowChange = (isFollowing: boolean) => {
    setRelationshipStatus(prev => ({
      ...prev,
      following: isFollowing
    }));
  };

  if (isLoading) {
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
          message={error || 'Could not load this user profile'}
        />
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* User Profile Header */}
      <ProfileHeader 
        id={user.id}
        name={user.name}
        email={user.email}
        bio={user.bio}
        profileImage={user.profileImage}
        isCurrentUser={isCurrentUser}
        _count={user._count}
        onProfileUpdate={setUser}
      />
      
      {/* Tabs Section */}
      <div className="glass rounded-lg p-4">
        <Tab.Group>
          <Tab.List className="flex p-1 space-x-2 bg-dark-light/30 rounded-lg mb-4">
            <Tab className={({ selected }: { selected: boolean }) => 
              `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
               ${selected 
                ? 'bg-dark-medium font-medium text-white shadow' 
                : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
            }>
              <FaListUl />
              <span>Notes ({user._count?.notes || 0})</span>
            </Tab>
            <Tab className={({ selected }: { selected: boolean }) => 
              `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
               ${selected 
                ? 'bg-dark-medium font-medium text-white shadow' 
                : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
            }>
              <FaRegStar />
              <span>Starred</span>
            </Tab>
            <Tab className={({ selected }: { selected: boolean }) => 
              `flex-1 py-3 flex items-center justify-center gap-2 text-sm rounded-md
               ${selected 
                ? 'bg-dark-medium font-medium text-white shadow' 
                : 'hover:bg-dark-medium/30 hover:text-white/90 transition-colors'}`
            }>
              <FaNetworkWired />
              <span>Network</span>
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="mt-4">
            {/* Notes Tab */}
            <Tab.Panel>
              {userNotes.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                  <p className="text-accent">
                    {isCurrentUser 
                      ? "You haven't created any notes yet. Create your first note to share with others!" 
                      : "This user hasn't published any notes yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userNotes.map((note) => (
                    <NoteCard key={note.id} note={note as any} />
                  ))}
                </div>
              )}
            </Tab.Panel>
            
            {/* Starred Notes Tab */}
            <Tab.Panel>
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-accent">
                  This feature is currently under development.
                </p>
              </div>
            </Tab.Panel>
            
            {/* Network Tab */}
            <Tab.Panel>
              <SocialTab userId={user.id} onProfileUpdate={setUser} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default UserProfilePage; 