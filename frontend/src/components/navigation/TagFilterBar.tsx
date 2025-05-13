import { useState } from 'react';
import type { Tag, ResourceType } from '../../types';
import { RESOURCE_COLORS } from '../../types';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTags: string[];
  resourceTypes: ResourceType[];
  onTagSelect: (tagName: string) => void;
  onResourceTypeSelect: (type: ResourceType) => void;
}

const TagFilterBar = ({ 
  tags, 
  selectedTags, 
  resourceTypes, 
  onTagSelect, 
  onResourceTypeSelect 
}: TagFilterBarProps) => {
  const [activeCategory, setActiveCategory] = useState<'tags' | 'types'>('tags');
  
  return (
    <div className="glass-light mb-6 p-4 rounded-lg">
      <div className="flex mb-4 border-b border-dark-accent">
        <button
          className={`px-4 py-2 mr-2 ${activeCategory === 'tags' ? 'border-b-2 border-blue-400 text-blue-400' : ''}`}
          onClick={() => setActiveCategory('tags')}
        >
          Subject Tags
        </button>
        <button
          className={`px-4 py-2 ${activeCategory === 'types' ? 'border-b-2 border-blue-400 text-blue-400' : ''}`}
          onClick={() => setActiveCategory('types')}
        >
          Resource Types
        </button>
      </div>
      
      {activeCategory === 'tags' && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagSelect(tag.name)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag.name)
                  ? 'bg-blue-400 text-dark font-medium'
                  : 'bg-dark-light hover:bg-dark-lighter'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      
      {activeCategory === 'types' && (
        <div className="flex flex-wrap gap-2">
          {resourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => onResourceTypeSelect(type)}
              className="px-3 py-1 rounded-full text-sm flex items-center"
              style={{ 
                backgroundColor: RESOURCE_COLORS[type],
                color: '#1a1a2e',
                fontWeight: 500
              }}
            >
              <div className="w-2 h-2 rounded-full bg-dark mr-2" />
              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilterBar; 