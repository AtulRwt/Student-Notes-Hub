import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../shared/Avatar';

interface EditProfileFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  bio: string;
  education: string;
  interests: string;
  profileImage: File | null;
  socialLinks: {
    twitter: string;
    linkedin: string;
    github: string;
  };
}

const EditProfileForm = ({ onCancel, onSuccess }: EditProfileFormProps) => {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    education: user?.education || '',
    interests: (user?.interests || []).join(', '),
    profileImage: null,
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      github: user?.socialLinks?.github || '',
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social-')) {
      const socialPlatform = name.replace('social-', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialPlatform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Format data for API
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('bio', formData.bio);
      
      if (formData.education) {
        formDataToSubmit.append('education', formData.education);
      }
      
      // Convert interests string to array
      if (formData.interests) {
        const interestsArray = formData.interests
          .split(',')
          .map(interest => interest.trim())
          .filter(interest => interest.length > 0);
        
        formDataToSubmit.append('interests', JSON.stringify(interestsArray));
      }
      
      // Add social links
      if (Object.values(formData.socialLinks).some(link => link.trim().length > 0)) {
        formDataToSubmit.append('socialLinks', JSON.stringify(formData.socialLinks));
      }
      
      // Add profile image if exists
      if (formData.profileImage) {
        formDataToSubmit.append('profileImage', formData.profileImage);
      }
      
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        education: formData.education || undefined,
        interests: formData.interests ? formData.interests.split(',').map(i => i.trim()) : [],
        socialLinks: formData.socialLinks,
        profileImage: formData.profileImage
      });
      
      onSuccess();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
      
      {error && (
        <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 mb-6">
            <div className="relative group">
              <Avatar 
                src={imagePreview || user?.profileImage || undefined} 
                alt={user?.name || 'Profile'} 
                size="xl"
                className="border-2 border-dark-medium"
              />
              
              <label className="absolute inset-0 flex items-center justify-center bg-dark-medium/70 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <FaUpload className="text-blue-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            
            <div className="text-center sm:text-left text-sm text-accent">
              <p className="mb-1">Profile Picture</p>
              <p>Click on the image to upload a new profile picture</p>
              <p>Maximum size: 5MB</p>
            </div>
          </div>
          
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-accent mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-accent mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed opacity-70"
                disabled
              />
              <p className="text-xs text-accent mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-accent mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell others about yourself..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-accent mb-1">
                Education
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your educational background"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-accent mb-1">
                Interests (comma separated)
              </label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Programming, AI, Web Development, etc."
              />
            </div>
          </div>
          
          {/* Social Links */}
          <div className="pt-4 border-t border-dark-medium/30">
            <h3 className="text-lg font-medium mb-3">Social Links</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-accent mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  name="social-twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleInputChange}
                  className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://twitter.com/yourusername"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-accent mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="social-linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleInputChange}
                  className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-accent mb-1">
                  GitHub
                </label>
                <input
                  type="url"
                  name="social-github"
                  value={formData.socialLinks.github}
                  onChange={handleInputChange}
                  className="w-full bg-dark-light rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://github.com/yourusername"
                />
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md bg-dark-medium hover:bg-dark-light transition-colors flex items-center"
              disabled={isLoading}
            >
              <FaTimes className="mr-2" /> Cancel
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm; 