import { useState, useEffect } from 'react';
import { API_BASE_URL, DEFAULT_AVATAR } from '../../config';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar = ({ src, alt, size = 'md', className = '' }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Map size to dimensions
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  useEffect(() => {
    // Reset error state when src changes
    setImageError(false);
    
    // Process the image URL
    if (src) {
      console.log('Avatar processing image:', src);
      
      if (src.startsWith('/')) {
        // If it's a relative path, prepend API base URL
        setImageSrc(`${API_BASE_URL}${src}`);
      } else if (src.startsWith('http')) {
        // If it's already a full URL, use as is
        setImageSrc(src);
      } else if (src.startsWith('data:')) {
        // If it's a data URL, use as is
        setImageSrc(src);
      } else {
        // Try with API base URL as a fallback
        setImageSrc(`${API_BASE_URL}/uploads/${src}`);
      }
    } else {
      setImageSrc(null);
    }
  }, [src]);
  
  // Get initials from name
  const getInitials = () => {
    if (!alt || typeof alt !== 'string') {
      return '?';
    }
    return alt.trim().charAt(0).toUpperCase();
  };

  return (
    <div className={`relative rounded-full bg-dark-light overflow-hidden flex-shrink-0 flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {imageSrc && !imageError ? (
        <img 
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            console.error('Image failed to load:', imageSrc);
            setImageError(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          <span className={`${size === 'sm' ? 'text-sm' : 'text-xl'} text-white font-bold`}>{getInitials()}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar; 