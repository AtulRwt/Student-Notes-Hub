import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotesStore } from '../store/notesStore';
import PersonalizedFeed from '../components/feed/PersonalizedFeed';
import StudyGroups from '../components/profile/StudyGroups';
import type { Note, User } from '../types';

// Stub component for PersonalizedFeed in case it's not implemented yet
interface PersonalizedFeedProps {
  user: User;
  notes?: Note[];
  isLoading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PersonalizedFeedStub = (_props: PersonalizedFeedProps) => (
  <div className="space-y-4">
    <h2 className="gradient-text text-2xl font-bold">Your Feed</h2>
    <p className="text-accent">Personalized feed will be displayed here.</p>
  </div>
);

// Use the real component if available, otherwise use the stub
const FeedComponent = typeof PersonalizedFeed !== 'undefined' ? PersonalizedFeed : PersonalizedFeedStub;

// Stub component for StudyGroups in case it's not implemented yet
interface StudyGroupsProps {
  user: User;
  onCreateGroup?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StudyGroupsStub = (_props: StudyGroupsProps) => (
  <div className="glass rounded-lg p-6 mb-6">
    <h2 className="gradient-text text-xl font-bold mb-4">Study Groups</h2>
    <p className="text-accent">Study groups will be displayed here.</p>
  </div>
);

// Use the real component if available, otherwise use the stub
const StudyGroupsComponent = typeof StudyGroups !== 'undefined' ? StudyGroups : StudyGroupsStub;

const FeedPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { notes, fetchNotes, isLoading } = useNotesStore();
  const [recommendedNotes, setRecommendedNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);
  
  useEffect(() => {
    if (notes.length > 0) {
      // In a real app, this would be a sophisticated recommendation algorithm
      // For now, we'll just use a random selection of notes
      const shuffled = [...notes].sort(() => 0.5 - Math.random());
      setRecommendedNotes(shuffled.slice(0, 8));
    }
  }, [notes]);
  
  const handleCreateGroup = () => {
    // In a real app, this would open a modal or navigate to a create group page
    alert('Create study group feature coming soon!');
  };
  
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-light text-red-400 p-4 rounded-md">
          <p>Please login to view your personalized feed</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Feed */}
        <div className="lg:col-span-2">
          <FeedComponent 
            user={user} 
            notes={recommendedNotes} 
            isLoading={isLoading} 
          />
        </div>
        
        {/* Right Sidebar - Study Groups & Trending */}
        <div className="lg:col-span-1">
          <StudyGroupsComponent 
            user={user} 
            onCreateGroup={handleCreateGroup} 
          />
          
          <div className="glass rounded-lg p-6">
            <h2 className="gradient-text text-xl font-bold mb-4">Trending Tags</h2>
            <div className="flex flex-wrap gap-2">
              {['Data Structures', 'Machine Learning', 'Calculus', 'Operating Systems', 'Web Development'].map((tag) => (
                <div key={tag} className="bg-dark-light rounded-full px-3 py-1 text-sm">
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPage; 