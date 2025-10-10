import { useNavigate } from 'react-router-dom';
import { FaFolderOpen, FaPlus, FaLock, FaGlobeAmericas, FaEllipsisH } from 'react-icons/fa';
import type { Collection, User } from '../../types';

interface ResourceCollectionsProps {
  user: User;
  onCreateCollection?: () => void;
}

const ResourceCollections = ({ user, onCreateCollection }: ResourceCollectionsProps) => {
  const navigate = useNavigate();
  
  // Mock collections for demo purposes
  const collections: Collection[] = [
    {
      id: '1',
      name: 'Machine Learning Resources',
      description: 'Resources and notes for ML courses',
      isPublic: true,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name
      },
      notes: [
        { id: '1', note: { id: '1', title: 'Introduction to Neural networks', description: 'Basics of neural networks and deep learning', fileUrl: null, externalUrl: null, semester: 'Sem 3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } },
        { id: '2', note: { id: '2', title: 'Reinforcement Learning', description: 'Introduction to reinforcement learning algorithms', fileUrl: null, externalUrl: null, semester: 'Sem 3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Database Systems',
      description: 'SQL, NoSQL, and database design resources',
      isPublic: false,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name
      },
      notes: [
        { id: '3', note: { id: '3', title: 'SQL Basics', description: 'Introduction to SQL queries', fileUrl: null, externalUrl: null, semester: 'Sem 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Exam Preparation',
      description: 'Past papers and study guides for final exams',
      isPublic: true,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name
      },
      notes: [
        { id: '4', note: { id: '4', title: 'Data Structures Final 2022', description: 'Past exam with solutions', fileUrl: null, externalUrl: null, semester: 'Sem 2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } },
        { id: '5', note: { id: '5', title: 'Algorithms Midterm', description: 'Practice problems for algorithms', fileUrl: null, externalUrl: null, semester: 'Sem 3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } },
        { id: '6', note: { id: '6', title: 'Network Security Cheat Sheet', description: 'Key concepts for the exam', fileUrl: null, externalUrl: null, semester: 'Sem 4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), userId: user.id, user: { id: user.id, name: user.name }, tags: [] } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="gradient-text text-2xl font-bold">Your Collections</h2>
        
        {onCreateCollection && (
          <button
            onClick={onCreateCollection}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <FaPlus />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create New Collection Card */}
        {onCreateCollection && (
          <div 
            className="glass rounded-lg p-6 flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-dark-lighter transition-colors border-2 border-dashed border-dark-accent"
            onClick={onCreateCollection}
          >
            <FaPlus className="text-4xl text-accent mb-4" />
            <p className="text-center text-accent">Create New Collection</p>
          </div>
        )}
        
        {/* Collection Cards */}
        {collections.map((collection) => (
          <div 
            key={collection.id}
            className="glass rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
            onClick={() => navigate(`/collections/${collection.id}`)}
          >
            {/* Collection Preview (Pinterest-style collage) */}
            <div className="relative h-40 bg-dark-light">
              {collection.notes.length > 0 ? (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                  {collection.notes.slice(0, 4).map((item, index) => (
                    <div 
                      key={item.id}
                      className={`bg-dark-lighter rounded-md ${index === 0 && collection.notes.length === 1 ? 'col-span-2 row-span-2' : index === 0 && collection.notes.length < 4 ? 'col-span-2' : ''}`}
                    >
                      {/* Note preview (could be thumbnail of the PDF or a colored background) */}
                      <div className="h-full flex items-center justify-center overflow-hidden">
                        <span className="text-xs text-accent truncate px-2">
                          {item.note.title.slice(0, 15)}...
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <FaFolderOpen className="text-4xl text-accent opacity-50" />
                </div>
              )}
              
              {/* Visibility badge */}
              <div 
                className="absolute top-2 right-2 bg-dark bg-opacity-80 rounded-full p-1"
                title={collection.isPublic ? 'Public Collection' : 'Private Collection'}
              >
                {collection.isPublic ? (
                  <FaGlobeAmericas className="text-green-400" size={14} />
                ) : (
                  <FaLock className="text-yellow-400" size={14} />
                )}
              </div>
            </div>
            
            {/* Collection Info */}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{collection.name}</h3>
                  <p className="text-accent text-sm line-clamp-1 mt-1">
                    {collection.description || 'No description'}
                  </p>
                </div>
                
                <button 
                  className="text-accent hover:text-blue-400 p-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open menu (in a real app)
                  }}
                >
                  <FaEllipsisH />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-xs text-accent">
                <span>{collection.notes.length} {collection.notes.length === 1 ? 'item' : 'items'}</span>
                <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceCollections; 