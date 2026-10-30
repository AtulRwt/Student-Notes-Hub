import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { FaSave, FaPalette, FaUserCircle, FaSpinner, FaCheck, FaTimes, FaEye, FaEyeSlash, FaCog, FaMoon, FaSun } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '../services/api';
import type { AppearanceSettings } from '../types';

type SettingsTab = 'account' | 'appearance';

const SettingsPage: React.FC = () => {
  const { user, setUser, retriggerOnboarding } = useAuthStore();
  const {
    appearance,
    isLoading: isSettingsLoading,
    isLoaded,
    fetchSettings,
    updateAppearance
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isAccountLoading, setIsAccountLoading] = useState(false);

  // Account settings
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Additional password-related state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Inside the component, add a state for specific error messages
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch user settings on component mount
  useEffect(() => {
    if (!isLoaded) {
      fetchSettings();
    }
  }, [isLoaded, fetchSettings]);

  // Update email when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  // Calculate password strength
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' | null => {
    if (!password) return null;

    // Basic password strength check
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < 8) return 'weak';
    if (hasLetter && hasNumber && hasSpecial && password.length >= 10) return 'strong';
    return 'medium';
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setPasswordError(null);

    // Enhanced password validation
    if (newPassword || oldPassword || confirmPassword) {
      // Check if all required password fields are filled
      if (!oldPassword) {
        toast.error('Please enter your current password');
        return;
      }

      if (!newPassword) {
        toast.error('Please enter a new password');
        return;
      }

      if (!confirmPassword) {
        toast.error('Please confirm your new password');
        return;
      }

      // Validate new password
      if (!validatePassword(newPassword)) {
        toast.error('New password must be at least 8 characters long');
        return;
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      // Check if new password is different from old password
      if (newPassword === oldPassword) {
        toast.error('New password must be different from current password');
        return;
      }
    }

    setIsAccountLoading(true);
    try {
      // Prepare data for API call
      const updateData: {
        email?: string;
        password?: { oldPassword: string; newPassword: string };
      } = {};

      // Only include email if it's different from current user email
      if (email !== user?.email) {
        updateData.email = email;
      }

      // Only include password if fields are filled
      if (oldPassword && newPassword && confirmPassword) {
        updateData.password = {
          oldPassword,
          newPassword
        };
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await settingsAPI.updateAccount(updateData);

        // Update user in auth store if email was changed
        if (updateData.email && user) {
          setUser({
            ...user,
            email: updateData.email
          });
        }

        toast.success(response.message || 'Account settings updated successfully');

        // Reset password fields on success
        if (updateData.password) {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError(null);
        }
      } else {
        toast.success('No changes to save');
      }
    } catch (error: any) {
      console.error('Password update error:', error);

      // Handle specific error messages from the backend
      const errorMessage = error.response?.data?.error || 'Failed to update account settings';

      // Set specific error for password validation failures
      if (errorMessage === 'Current password is incorrect') {
        setPasswordError('The current password you entered is incorrect');
        // Focus on the current password field
        const currentPasswordField = document.getElementById('currentPassword');
        if (currentPasswordField) {
          currentPasswordField.focus();
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await updateAppearance(appearance);
      toast.success('Appearance settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update appearance settings');
    }
  };

  if (!isLoaded && isSettingsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
          <p className="text-light">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="glass rounded-xl p-6 mb-8">
        <h1 className="text-2xl font-bold gradient-text mb-6">Account Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <div className="glass-light rounded-lg p-1">
              <button
                onClick={() => handleTabChange('account')}
                className={`w-full text-left py-3 px-4 rounded-md flex items-center transition-colors ${activeTab === 'account'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-dark-light/50'
                  }`}
              >
                <FaUserCircle className="mr-3" />
                <span>Account</span>
              </button>

              <button
                onClick={() => handleTabChange('appearance')}
                className={`w-full text-left py-3 px-4 rounded-md flex items-center transition-colors ${activeTab === 'appearance'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-dark-light/50'
                  }`}
              >
                <FaPalette className="mr-3" />
                <span>Appearance</span>
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 glass-light rounded-lg p-6">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Account Information</h2>

                <form onSubmit={handleSaveAccount}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <h3 className="text-lg font-semibold mt-8 mb-1">Change Password</h3>
                  <p className="text-sm text-light/70 mb-4">
                    Passwords are securely stored with encryption. Make sure your current password is correct and your new password is at least 8 characters long.
                  </p>

                  <div className="mb-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        id="currentPassword"
                        value={oldPassword}
                        onChange={(e) => {
                          setOldPassword(e.target.value);
                          // Clear error when user starts typing
                          if (passwordError) setPasswordError(null);
                        }}
                        className={`w-full bg-dark-lighter border ${passwordError ? 'border-red-500' : 'border-dark-accent'
                          } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="glass p-3 rounded-md bg-red-900/20 border border-red-500/30 text-red-400 text-sm mb-4">
                        <p className="flex items-center">
                          <FaTimes className="mr-2 flex-shrink-0" /> {passwordError}
                        </p>
                        <p className="mt-1 text-xs">
                          Note: This could happen if your current password is incorrect or if there was a problem with the password update process.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full bg-dark-lighter border ${newPassword && !validatePassword(newPassword)
                            ? 'border-red-500'
                            : 'border-dark-accent'
                          } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center text-xs mb-1">
                          {passwordStrength === 'weak' && (
                            <span className="text-red-400 flex items-center">
                              <FaTimes className="mr-1" /> Weak
                            </span>
                          )}
                          {passwordStrength === 'medium' && (
                            <span className="text-yellow-400 flex items-center">
                              <FaCheck className="mr-1" /> Medium
                            </span>
                          )}
                          {passwordStrength === 'strong' && (
                            <span className="text-green-400 flex items-center">
                              <FaCheck className="mr-1" /> Strong
                            </span>
                          )}
                        </div>
                        <ul className="text-xs space-y-1 text-gray-400">
                          <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                            {newPassword.length >= 8 ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                            At least 8 characters
                          </li>
                          <li className={`flex items-center ${/[0-9]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            {/[0-9]/.test(newPassword) ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                            Contains a number
                          </li>
                          <li className={`flex items-center ${/[a-zA-Z]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            {/[a-zA-Z]/.test(newPassword) ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                            Contains a letter
                          </li>
                          <li className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-400' : 'text-gray-400'}`}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                            Contains a special character
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-dark-lighter border ${confirmPassword && newPassword !== confirmPassword
                            ? 'border-red-500'
                            : 'border-dark-accent'
                          } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword && (
                      <p className="text-green-400 text-xs mt-1 flex items-center">
                        <FaCheck className="mr-1" /> Passwords match
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                      disabled={isAccountLoading}
                    >
                      {isAccountLoading ? (
                        <><FaSpinner className="animate-spin mr-2" /> Saving...</>
                      ) : (
                        <>
                          <FaSave className="mr-2" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Personalization Settings — inside account tab */}
            {activeTab === 'account' && (
              <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="text-xl font-bold mb-2">Personalization</h2>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Your feed is personalized based on the interests you selected during setup.
                  You can redo the onboarding quiz anytime to update your preferences.
                </p>
                {user?.interests && user.interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Current interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map(interest => (
                        <span
                          key={interest}
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={retriggerOnboarding}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                >
                  🤖 Redo Onboarding Quiz
                </button>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Appearance Preferences</h2>

                <div className="mb-6">
                  <h3 className="text-base font-medium mb-3">Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 transition-all ${appearance.theme === 'dark'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-dark-accent bg-dark-light hover:border-blue-500/50'
                        }`}
                      onClick={() => updateAppearance({ theme: 'dark' })}
                      aria-pressed={appearance.theme === 'dark'}
                    >
                      <FaMoon size={24} className="mb-2 text-blue-400" />
                      <span className="font-medium">Dark Theme</span>
                      {appearance.theme === 'dark' && (
                        <span className="mt-2 flex items-center text-xs text-blue-400">
                          <FaCheck className="mr-1" /> Active
                        </span>
                      )}
                    </button>

                    <button
                      className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 transition-all ${appearance.theme === 'light'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-dark-accent bg-dark-light hover:border-blue-500/50'
                        }`}
                      onClick={() => updateAppearance({ theme: 'light' })}
                      aria-pressed={appearance.theme === 'light'}
                    >
                      <FaSun size={24} className="mb-2 text-yellow-400" />
                      <span className="font-medium">Light Theme</span>
                      {appearance.theme === 'light' && (
                        <span className="mt-2 flex items-center text-xs text-blue-400">
                          <FaCheck className="mr-1" /> Active
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-medium mb-3">Font Size</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      className={`p-3 rounded-lg flex items-center justify-center border-2 transition-all ${appearance.fontSize === 'small'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-dark-accent bg-dark-light hover:border-blue-500/50'
                        }`}
                      onClick={() => updateAppearance({ fontSize: 'small' })}
                      aria-pressed={appearance.fontSize === 'small'}
                    >
                      <span className="font-medium text-sm">Small</span>
                      {appearance.fontSize === 'small' && (
                        <FaCheck className="ml-2 text-blue-400" />
                      )}
                    </button>

                    <button
                      className={`p-3 rounded-lg flex items-center justify-center border-2 transition-all ${appearance.fontSize === 'medium'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-dark-accent bg-dark-light hover:border-blue-500/50'
                        }`}
                      onClick={() => updateAppearance({ fontSize: 'medium' })}
                      aria-pressed={appearance.fontSize === 'medium'}
                    >
                      <span className="font-medium">Medium</span>
                      {appearance.fontSize === 'medium' && (
                        <FaCheck className="ml-2 text-blue-400" />
                      )}
                    </button>

                    <button
                      className={`p-3 rounded-lg flex items-center justify-center border-2 transition-all ${appearance.fontSize === 'large'
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-dark-accent bg-dark-light hover:border-blue-500/50'
                        }`}
                      onClick={() => updateAppearance({ fontSize: 'large' })}
                      aria-pressed={appearance.fontSize === 'large'}
                    >
                      <span className="font-medium text-lg">Large</span>
                      {appearance.fontSize === 'large' && (
                        <FaCheck className="ml-2 text-blue-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-light/60 mt-2">
                    Changes font size throughout the application for better readability.
                  </p>
                </div>

                <div className="glass p-4 mb-6 rounded-md">
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <FaCog className="mr-2" /> Preview
                  </h3>
                  <p className="text-sm text-light/70 mb-3">
                    Changes to appearance settings are applied immediately so you can preview them before saving.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-md">Button</div>
                    <div className="bg-dark-lighter border border-dark-accent px-3 py-1 rounded-md">Secondary</div>
                    <span className="text-light">Text sample</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAppearance}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                    disabled={isSettingsLoading}
                  >
                    {isSettingsLoading ? (
                      <><FaSpinner className="animate-spin mr-2" /> Saving...</>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 