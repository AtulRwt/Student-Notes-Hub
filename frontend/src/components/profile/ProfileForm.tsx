import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { FaCamera, FaTwitter, FaLinkedin, FaGithub, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import type { ProfileUpdateData } from '../../types';
import Avatar from '../shared/Avatar';

interface ProfileFormProps {
  onCancel: () => void;
}

const ProfileForm = ({ onCancel }: ProfileFormProps) => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: user?.name || '',
    bio: user?.bio || '',
    education: user?.education || '',
    interests: user?.interests || [],
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      github: user?.socialLinks?.github || '',
    },
    profileImage: null
  });
  
  const [interestInput, setInterestInput] = useState('');
  
  useEffect(() => {
    if (user?.profileImage) {
      setPreviewImage(user.profileImage);
    }
  }, [user]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSocialLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Profile image selected:', file.name, file.type, file.size);
      
      // Validate image file
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log('Preview image created:', dataUrl.substring(0, 50) + '...');
        setPreviewImage(dataUrl);
      };
      reader.readAsDataURL(file);
      
      // Update form data
      setFormData(prev => ({ ...prev, profileImage: file }));
      console.log('Profile image added to form data');
    }
  };
  
  const addInterest = () => {
    if (interestInput.trim() && !formData.interests?.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), interestInput.trim()]
      }));
      setInterestInput('');
    }
  };
  
  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.filter(i => i !== interest) || []
    }));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      onCancel();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="glass rounded-lg p-6">
      <h2 className="gradient-text text-2xl font-bold mb-6">Edit Profile</h2>
      
      {/* Profile Image */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative group">
          <Avatar 
            src={previewImage || null} 
            alt={user?.name || "User"} 
            size="xl"
          />
          
          <label className="absolute inset-0 bg-dark-lighter bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
            <FaCamera className="text-light text-lg" />
            <input 
              type="file" 
              accept="image/*" 
              className="sr-only"
              onChange={handleImageChange}
            />
          </label>
        </div>
        <span className="text-xs text-accent mt-3">Click to change profile image</span>
      </div>
      
      {/* Basic Info */}
      <div className="mb-4">
        <label htmlFor="name" className="block text-light text-sm font-bold mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
          required
          placeholder="Your full name"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="bio" className="block text-light text-sm font-bold mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent min-h-[100px]"
          placeholder="Tell others about yourself"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="education" className="block text-light text-sm font-bold mb-2">
          Education
        </label>
        <input
          type="text"
          id="education"
          name="education"
          value={formData.education}
          onChange={handleChange}
          className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
          placeholder="Your educational background"
        />
      </div>
      
      {/* Interests */}
      <div className="mb-4">
        <label className="block text-light text-sm font-bold mb-2">
          Interests
        </label>
        <div className="flex flex-wrap mb-2">
          {formData.interests?.map((interest) => (
            <span 
              key={interest}
              className="bg-dark-medium text-blue-400 text-sm rounded-full px-3 py-1 m-1 flex items-center"
            >
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="ml-1 p-1 rounded-full hover:bg-dark-accent"
              >
                <FaTimes size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-dark-lighter border border-dark-accent rounded-l-md px-3 py-2 flex-1 text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            placeholder="Add an interest (e.g., Machine Learning)"
          />
          <button
            type="button"
            onClick={addInterest}
            className="bg-dark-light text-light px-3 py-2 rounded-r-md hover:bg-dark-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Social Links */}
      <div className="mb-6">
        <h3 className="text-light text-sm font-bold mb-2">Social Links</h3>
        
        <div className="mb-2">
          <div className="flex items-center">
            <div className="bg-dark-light w-10 flex items-center justify-center rounded-l-md h-10">
              <FaTwitter className="text-blue-400" />
            </div>
            <input
              type="url"
              name="twitter"
              value={formData.socialLinks?.twitter || ''}
              onChange={handleSocialLinkChange}
              className="bg-dark-lighter border border-dark-accent rounded-r-md px-3 py-2 flex-1 text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              placeholder="Twitter URL"
            />
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex items-center">
            <div className="bg-dark-light w-10 flex items-center justify-center rounded-l-md h-10">
              <FaLinkedin className="text-blue-400" />
            </div>
            <input
              type="url"
              name="linkedin"
              value={formData.socialLinks?.linkedin || ''}
              onChange={handleSocialLinkChange}
              className="bg-dark-lighter border border-dark-accent rounded-r-md px-3 py-2 flex-1 text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              placeholder="LinkedIn URL"
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center">
            <div className="bg-dark-light w-10 flex items-center justify-center rounded-l-md h-10">
              <FaGithub className="text-blue-400" />
            </div>
            <input
              type="url"
              name="github"
              value={formData.socialLinks?.github || ''}
              onChange={handleSocialLinkChange}
              className="bg-dark-lighter border border-dark-accent rounded-r-md px-3 py-2 flex-1 text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              placeholder="GitHub URL"
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="gradient-border bg-dark px-6 py-2 rounded-md font-medium hover:bg-dark-light transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 