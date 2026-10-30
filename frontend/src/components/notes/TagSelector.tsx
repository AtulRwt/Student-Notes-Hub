import { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (selectedTags: string[]) => void;
}

const TagSelector = ({ availableTags, selectedTags, onChange }: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Filter available tags based on input and already selected tags
  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !selectedTags.includes(tag)
  );
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };
  
  const handleInputFocus = () => {
    setShowSuggestions(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove the last tag on backspace when input is empty
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };
  
  const addTag = (tag: string) => {
    const normalizedTag = tag.trim();
    
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      onChange([...selectedTags, normalizedTag]);
    }
    
    setInputValue('');
    inputRef.current?.focus();
  };
  
  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
    inputRef.current?.focus();
  };
  
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center p-2 bg-dark-lighter border border-dark-accent rounded-md focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-transparent">
        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="bg-dark-medium text-blue-400 text-sm rounded-full px-3 py-1 m-1 flex items-center"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 p-1 rounded-full hover:bg-dark-accent"
            >
              <FaTimes size={10} />
            </button>
          </span>
        ))}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="flex-grow p-1 m-1 outline-none text-sm bg-transparent text-light"
          placeholder={selectedTags.length === 0 ? "Type to add tags..." : ""}
        />
      </div>
      
      {/* Tag suggestions */}
      {showSuggestions && filteredTags.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto glass-light shadow-lg rounded-md border border-dark-accent/30"
        >
          {filteredTags.map((tag) => (
            <div
              key={tag}
              onClick={() => addTag(tag)}
              className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-light"
            >
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector; 