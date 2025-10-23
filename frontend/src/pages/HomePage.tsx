import { Link } from 'react-router-dom';
import { FaBook, FaUpload, FaSearch, FaTag, FaUsers, FaGraduationCap, FaMedal, FaClock, FaComments, FaUserGraduate, FaChartLine } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { useTagsStore } from '../store/tagsStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import UserEngagementChart from '../components/dashboard/UserEngagementChart';
import OnlineUsersCounter from '../components/dashboard/OnlineUsersCounter';

const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { notes, fetchNotes } = useNotesStore();
  const { tags, fetchTags } = useTagsStore();
  const { engagement, fetchEngagementData, trackUserAction } = useAnalyticsStore();
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    resources: 0,
    users: 0,
    subjects: 0
  });
  
  useEffect(() => {
    setIsVisible(true);
    fetchNotes();
    fetchTags();
    fetchEngagementData();
    
    // Track page view if user is logged in
    if (user) {
      trackUserAction('Viewing home page');
    }
  }, [fetchNotes, fetchTags, fetchEngagementData, trackUserAction, user]);

  // Update statistics when data is loaded
  useEffect(() => {
    if (engagement) {
      // Use real-time data from analytics API
      setStats({
        resources: engagement.totalNotes,
        users: engagement.totalUsers,
        subjects: Object.keys(engagement.resourceTypeDistribution).length
      });
    } else if (notes.length > 0) {
      // Fall back to local data if analytics not available
      const uniqueUsers = new Set(notes.map(note => note.userId)).size;
      const subjectCount = tags.length;
      
      setStats({
        resources: notes.length,
        users: uniqueUsers,
        subjects: subjectCount
      });
    }
  }, [notes, tags, engagement]);

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
      {/* Hero Section with animation */}
      <div className={`transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} glass gradient-bg rounded-lg shadow-lg p-6 sm:p-8 mb-12`}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="gradient-text text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Student Notes & Resource Sharing Hub</h1>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 text-light-darker">
            A platform for students to share and discover academic resources, notes, and study materials
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/notes" className="gradient-border btn btn-secondary py-3 px-6 text-base sm:text-lg flex items-center justify-center hover:scale-105 transition-transform rounded-lg">
              <FaSearch className="mr-2 text-blue-400" /> Browse Notes
            </Link>
            
            {isAuthenticated ? (
              <Link to="/notes/create" className="gradient-border bg-dark py-3 px-6 text-base sm:text-lg flex items-center justify-center hover:scale-105 transition-transform rounded-lg">
                <FaUpload className="mr-2 text-blue-400" /> Upload Notes
              </Link>
            ) : (
              <Link to="/register" className="gradient-border bg-dark py-3 px-6 text-base sm:text-lg flex items-center justify-center hover:scale-105 transition-transform rounded-lg">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Real-time Dashboard and Analytics Section */}
      <div className={`transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} mb-12`}>
        <div className="flex items-center justify-center mb-8">
          <FaChartLine className="text-blue-400 mr-2 text-2xl" />
          <h2 className="text-3xl font-bold text-center gradient-text">Platform Analytics</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UserEngagementChart />
          </div>
          <div>
            <OnlineUsersCounter />
          </div>
        </div>
      </div>
      
      {/* Features Section with staggered animations */}
      <div className={`transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} mb-12`}>
        <h2 className="text-3xl font-bold text-center mb-8 gradient-text">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow hover:-translate-y-1 transform transition-transform duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUpload className="text-2xl text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Upload Notes</h3>
            <p className="text-light-darker">
              Share your notes, assignments, or useful resources with fellow students
            </p>
            <div className="mt-4 text-sm text-blue-400/70">
              • Upload PDF documents<br />
              • Add external resource links<br />
              • Share with your entire class
            </div>
          </div>
          
          <div className="glass p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow hover:-translate-y-1 transform transition-transform duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTag className="text-2xl text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tag & Organize</h3>
            <p className="text-light-darker">
              Categorize content by semester, subject, or custom tags for easy discovery
            </p>
            <div className="mt-4 text-sm text-blue-400/70">
              • Create custom tags<br />
              • Filter by semester<br />
              • Sort by subject or topic
            </div>
          </div>
          
          <div className="glass p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow hover:-translate-y-1 transform transition-transform duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBook className="text-2xl text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Learn & Grow</h3>
            <p className="text-light-darker">
              Access quality study materials, collaborate with peers, and excel in your studies
            </p>
            <div className="mt-4 text-sm text-blue-400/70">
              • Download for offline access<br />
              • Comment and discuss<br />
              • Favorite for later reference
            </div>
          </div>
        </div>
      </div>
      
      {/* New Benefits Section */}
      <div className={`transition-all duration-1000 delay-500 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} mb-12`}>
        <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Benefits for Students</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-light p-6 rounded-lg text-center hover:bg-white/15 transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaClock className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Save Time</h3>
            <p className="text-light-darker text-sm">
              Access organized materials quickly instead of searching through emails or messages
            </p>
          </div>
          
          <div className="glass-light p-6 rounded-lg text-center hover:bg-white/15 transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Collaborate</h3>
            <p className="text-light-darker text-sm">
              Work together with classmates by sharing resources and discussing materials
            </p>
          </div>
          
          <div className="glass-light p-6 rounded-lg text-center hover:bg-white/15 transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGraduationCap className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Improve Grades</h3>
            <p className="text-light-darker text-sm">
              Access comprehensive materials to better understand course content
            </p>
          </div>
          
          <div className="glass-light p-6 rounded-lg text-center hover:bg-white/15 transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMedal className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Recognition</h3>
            <p className="text-light-darker text-sm">
              Build your reputation by sharing quality resources with peers
            </p>
          </div>
        </div>
      </div>
      
      {/* Statistics Section - Now smaller and below the analytics */}
      <div className={`transition-all duration-1000 delay-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} mb-12`}>
        <div className="glass gradient-bg rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6 gradient-text">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="transform transition-all duration-1000 hover:scale-105">
              <div className="text-4xl font-bold mb-2 text-blue-400">{stats.resources}</div>
              <div className="text-white/70">Study Resources</div>
            </div>
            <div className="transform transition-all duration-1000 hover:scale-105">
              <div className="text-4xl font-bold mb-2 text-blue-400">{stats.users}</div>
              <div className="text-white/70">Active Students</div>
            </div>
            <div className="transform transition-all duration-1000 hover:scale-105">
              <div className="text-4xl font-bold mb-2 text-blue-400">{stats.subjects}</div>
              <div className="text-white/70">Subject Areas</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className={`transition-all duration-1000 delay-800 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} glass-light rounded-lg p-8 text-center transform`}>
        <h2 className="text-2xl font-bold mb-4 gradient-text">Ready to get started?</h2>
        <p className="text-light-darker mb-6 max-w-2xl mx-auto">
          Join our community of students sharing knowledge and resources. Upload your notes or browse what others have shared.
        </p>
        
        <Link to={isAuthenticated ? "/notes/create" : "/register"} className="inline-block gradient-border bg-dark py-3 px-8 text-lg rounded-lg hover:scale-105 transition-transform">
          {isAuthenticated ? "Upload Your First Note" : "Create an Account"}
        </Link>
      </div>
      
      {/* New FAQ Section */}
      <div className={`transition-all duration-1000 delay-900 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} mt-12`}>
        <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Frequently Asked Questions</h2>
        
        <div className="glass p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">What type of resources can I share?</h3>
              <p className="text-light-darker">
                You can share lecture notes, study guides, assignment samples, article summaries, and external resource links.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Is my content private?</h3>
              <p className="text-light-darker">
                You can choose to make your notes public or available only to registered users. Private sharing is coming soon.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">How do I organize my materials?</h3>
              <p className="text-light-darker">
                You can add tags, categorize by subject, and include a descriptive title and description to help others find your notes.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Can I update or remove my notes?</h3>
              <p className="text-light-darker">
                Yes, you can edit or delete your uploads at any time from your profile dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HomePage; 