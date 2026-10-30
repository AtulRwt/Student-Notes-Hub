import React, { useState, useEffect } from 'react';
import { FaPlus, FaClock, FaShare, FaLock, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import type { User, Collection } from '../../types';
import LoadingSkeleton from '../ui/LoadingSkeleton';

// Extended User type with additional properties
interface ExtendedUser extends User {
  location?: string;
  website?: string;
  createdAt: string;
}

interface ResourceCollectionsProps {
  user: ExtendedUser;
  onCreateCollection?: () => void;
}

const ResourceCollections: React.FC<ResourceCollectionsProps> = ({ user, onCreateCollection }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For creating/editing collections
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [user.id]);

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/api/users/${user.id}/collections`);
      setCollections(response.data || []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.response?.data?.message || 'Failed to load collections');
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setCollectionName('');
    setCollectionDescription('');
    setIsPublic(false);
    setShowForm(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setCollectionName(collection.name);
    setCollectionDescription(collection.description || '');
    setIsPublic(collection.isPublic);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }
    
    try {
      await apiClient.delete(`/api/collections/${id}`);
      toast.success('Collection deleted successfully');
      setCollections(collections.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      toast.error(err.response?.data?.message || 'Failed to delete collection');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingId) {
        // Update existing collection
        const response = await apiClient.put(`/api/collections/${editingId}`, {
          name: collectionName,
          description: collectionDescription,
          isPublic
        });
        
        setCollections(collections.map(c => 
          c.id === editingId ? { ...c, ...response.data } : c
        ));
        
        toast.success('Collection updated successfully');
      } else {
        // Create new collection
        const response = await apiClient.post('/api/collections', {
          name: collectionName,
          description: collectionDescription,
          isPublic
        });
        
        setCollections([...collections, response.data]);
        toast.success('Collection created successfully');
      }
      
      // Reset form
      setShowForm(false);
      setEditingId(null);
      setCollectionName('');
      setCollectionDescription('');
      setIsPublic(false);
    } catch (err: any) {
      console.error('Error saving collection:', err);
      toast.error(err.response?.data?.message || 'Failed to save collection');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="gradient-text text-xl font-bold">Your Collections</h2>
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="gradient-text text-xl font-bold">Your Collections</h2>
        {!showForm && (
          <button 
            onClick={handleCreateNew}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-md text-sm flex items-center"
          >
            <FaPlus className="mr-1" /> Create Collection
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {showForm && (
        <div className="glass-light p-5 rounded-lg mb-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-3">
            {editingId ? 'Edit Collection' : 'Create New Collection'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                placeholder="e.g., Programming Fundamentals"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 text-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe what this collection is about..."
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Make this collection public</span>
              </label>
              <p className="text-xs text-light/60 mt-1">
                Public collections can be viewed by anyone. Private collections are only visible to you.
              </p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.length > 0 ? (
          collections.map(collection => (
            <div 
              key={collection.id} 
              className="glass-light p-4 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{collection.name}</h3>
                <div className="flex items-center">
                  <span className="text-xs text-blue-400 mr-2">
                    {collection.notes?.length || 0} items
                  </span>
                  {collection.isPublic ? (
                    <FaShare className="text-green-400" title="Public collection" />
                  ) : (
                    <FaLock className="text-yellow-400" title="Private collection" />
                  )}
                </div>
              </div>
              
              {collection.description && (
                <p className="text-xs text-light/70 mb-2">{collection.description}</p>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-light/70 flex items-center">
                  <FaClock className="mr-1" /> 
                  Updated {new Date(collection.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(collection)}
                    className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                    title="Edit collection"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(collection.id)}
                    className="text-red-400 text-xs hover:text-red-300 transition-colors"
                    title="Delete collection"
                  >
                    <FaTrash />
                  </button>
                  <Link 
                    to={`/collections/${collection.id}`}
                    className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                    title="View collection"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-full glass-light p-6 rounded-lg text-center">
            <p className="text-light/70 mb-4">You haven't created any collections yet.</p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Create Your First Collection
            </button>
          </div>
        )}
        
        {/* Always show "Create new" card */}
        {collections.length > 0 && !showForm && (
          <div 
            className="glass-light p-4 rounded-lg border border-blue-500/20 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleCreateNew}
          >
            <div className="flex justify-center items-center h-full">
              <div className="text-blue-400 flex flex-col items-center justify-center py-4">
                <FaPlus size={24} className="mb-2" />
                <span>Create a New Collection</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCollections; 