import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/layout/Layout';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotesListPage from './pages/NotesListPage';
import NoteDetailPage from './pages/NoteDetailPage';
import CreateNotePage from './pages/CreateNotePage';
import EditNotePage from './pages/EditNotePage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import FeedPage from './pages/FeedPage';
import NotFoundPage from './pages/NotFoundPage';
import Network from './pages/Network';
import ConnectionsPage from './pages/ConnectionsPage';

// Set up React Query
const queryClient = new QueryClient();

// Auth protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Notes routes - now protected */}
            <Route 
              path="/notes" 
              element={
                <ProtectedRoute>
                  <NotesListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notes/:id" 
              element={
                <ProtectedRoute>
                  <NoteDetailPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes */}
              <Route 
                path="/feed" 
                element={
                  <ProtectedRoute>
                    <FeedPage />
                  </ProtectedRoute>
                } 
              />
            <Route 
              path="/notes/create" 
              element={
                <ProtectedRoute>
                  <CreateNotePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notes/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditNotePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={
                    <div className="container mx-auto py-8 px-4">
                      <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                        <h2 className="text-xl font-bold mb-2">Error displaying profile</h2>
                        <p>There was an error loading your profile. Please try refreshing the page or contact support.</p>
                      </div>
                    </div>
                  }>
                    <ProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={
                    <div className="container mx-auto py-8 px-4">
                      <div className="bg-red-900/20 text-red-400 p-4 rounded-md">
                        <h2 className="text-xl font-bold mb-2">Error displaying user profile</h2>
                        <p>There was an error loading this user's profile. Please try refreshing the page.</p>
                      </div>
                    </div>
                  }>
                    <UserProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
              {/* Network routes */}
              <Route 
                path="/network/*" 
                element={
                  <ProtectedRoute>
                    <Network />
                  </ProtectedRoute>
                } 
              />
              {/* Connections page */}
              <Route 
                path="/connections" 
                element={
                  <ProtectedRoute>
                    <ConnectionsPage />
                  </ProtectedRoute>
                } 
              />
            
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
