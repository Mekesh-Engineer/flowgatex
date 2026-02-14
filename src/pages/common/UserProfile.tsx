import { useState, ChangeEvent, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  CheckCircle2,
  Bell,
  Lock,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone
} from 'lucide-react';

import { useAuthStore } from '@/store/zustand/stores';
import { UserRole } from '@/lib/constants';
import { updateUserProfile, changePassword, deleteUserAccount } from '@/features/auth/services/authService';
import { logger } from '@/lib/logger';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

// =============================================================================
// TYPES
// =============================================================================

type TabType = 'personal' | 'preferences' | 'security' | 'privacy';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case UserRole.ORGANIZER:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function UserProfile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isLoading, setIsLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State (Initialized with auth data)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    bio: '',
    theme: (localStorage.getItem('theme') || 'system') as 'light' | 'dark' | 'system',
    language: 'en',
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    twoFactor: false
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        dob: user.dob || '',
        gender: user.gender || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (category: 'notifications', key: keyof typeof formData.notifications) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Apply theme changes immediately
      if (formData.theme) {
        localStorage.setItem('theme', formData.theme);
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (formData.theme === 'dark') {
          root.classList.add('dark');
        } else if (formData.theme === 'light') {
          root.classList.add('light');
        } else {
          // Auto - respect OS preference
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          }
        }
      }

      // Call actual API to update user profile
      const displayName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.displayName;
      await updateUserProfile(user!.uid, {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        displayName,
        phoneNumber: formData.phone || null,
        dob: formData.dob || null,
        gender: formData.gender || null,
      });

      setIsLoading(false);
      // Show success toast notification
      Swal.fire({
        title: 'Success',
        text: 'Profile updated successfully!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      logger.error('Failed to update profile:', error);
      setIsLoading(false);
      // Show error toast notification
      Swal.fire({
        title: 'Error',
        text: 'Failed to update profile. Please try again.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 dark:text-neutral-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-neutral-400 text-lg">
          Manage your personal information, preferences, and security settings.
        </p>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="border-b border-gray-200 dark:border-neutral-700 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Globe },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'privacy', label: 'Privacy', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              <tab.icon className={cn(
                "mr-2 h-5 w-5",
                activeTab === tab.id ? "text-blue-500 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-500 dark:text-neutral-500"
              )} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Content Area ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Quick Profile (Visible on all tabs) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>

            <div className="relative mt-4 mb-4 inline-block group cursor-pointer">
              <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-neutral-800 ring-2 ring-gray-100 dark:ring-neutral-700 mx-auto">
                <img
                  className="w-full h-full rounded-full object-cover"
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0D8ABC&color=fff&size=128`}
                  alt={user.displayName || 'Profile'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0D8ABC&color=fff&size=128`;
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full m-1">
                <Camera className="text-white h-8 w-8" />
              </div>
              <button
                type="button"
                className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                aria-label="Change profile picture"
              >
                <Camera size={16} />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.displayName || 'User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">{user.email}</p>

            <div className="flex justify-center gap-2 mb-6">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                getRoleBadgeColor(user.role)
              )}>
                {user.role}
              </span>
              {user.emailVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle2 size={12} className="mr-1" />
                  Verified
                </span>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
              <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-neutral-700">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">12</span>
                  <span className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Events</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">5</span>
                  <span className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Tickets</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">4.8</span>
                  <span className="text-xs text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">Upgrade to Pro</h3>
            <p className="text-blue-100 text-sm mb-4">Get access to advanced analytics and unlimited events.</p>
            <Button variant="secondary" className="w-full bg-white text-blue-600 border-none hover:bg-blue-50">
              View Plans
            </Button>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700">

            {/* ─── Personal Info Tab ─── */}
            {activeTab === 'personal' && (
              <div className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                  />

                  {/* Last Name */}
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                  />

                  {/* Display Name */}
                  <Input
                    label="Full Name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                  />

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-500 dark:text-neutral-500 cursor-not-allowed"
                      />
                      {user.emailVerified && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs font-medium">
                          <CheckCircle2 size={12} /> Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      <Button type="button" variant="secondary" className="whitespace-nowrap">
                        Verify
                      </Button>
                    </div>
                  </div>

                  {/* DOB */}
                  <Input
                    label="Date of Birth"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                  />

                  {/* Gender */}
                  <Select
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'non-binary', label: 'Non-binary' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                    ]}
                    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                  />

                  {/* Role (Read only) */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Account Role</label>
                    <div className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-500 dark:text-neutral-500 capitalize flex items-center justify-between">
                      <span>{user.role}</span>
                      <Shield size={16} />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Bio</label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Tell us a little bit about yourself..."
                    />
                    <div className="text-right text-xs text-gray-500 dark:text-neutral-400">
                      {formData.bio.length}/500 characters
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Preferences Tab ─── */}
            {activeTab === 'preferences' && (
              <div className="p-6 md:p-8 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-700 pb-2">
                    Appearance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['light', 'dark', 'system'].map((theme) => (
                      <div
                        key={theme}
                        onClick={() => setFormData(p => ({ ...p, theme: theme as 'light' | 'dark' | 'system' }))}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-neutral-700/50",
                          formData.theme === theme
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                            : "border-gray-200 dark:border-neutral-700"
                        )}
                      >
                        {theme === 'light' && <Sun className="h-6 w-6 text-orange-500" />}
                        {theme === 'dark' && <Moon className="h-6 w-6 text-blue-500" />}
                        {theme === 'system' && <Monitor className="h-6 w-6 text-gray-500" />}
                        <span className="font-medium capitalize text-gray-700 dark:text-neutral-200">{theme} Theme</span>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-700 pb-2 pt-4">
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <Mail size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Receive updates about your account and events.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                          <Bell size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Receive real-time alerts on your device.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">Receive booking confirmations via SMS.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.notifications.sms} onChange={() => handleToggle('notifications', 'sms')} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Security Tab ─── */}
            {activeTab === 'security' && (
              <div className="p-6 md:p-8 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-700 pb-2">
                    Change Password
                  </h3>
                  <div className="grid gap-6">
                    <Input
                      type="password"
                      label="Current Password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        type="password"
                        label="New Password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                      />
                      <Input
                        type="password"
                        label="Confirm New Password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="primary"
                        isLoading={passwordLoading}
                        disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                        onClick={async () => {
                          if (passwordData.newPassword.length < 8) {
                            Swal.fire({ title: 'Error', text: 'New password must be at least 8 characters.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
                            return;
                          }
                          setPasswordLoading(true);
                          try {
                            await changePassword(passwordData.currentPassword, passwordData.newPassword);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            Swal.fire({ title: 'Success', text: 'Password changed successfully!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
                          } catch (error: any) {
                            logger.error('Password change failed:', error);
                            Swal.fire({ title: 'Error', text: error?.message || 'Failed to change password.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
                          } finally {
                            setPasswordLoading(false);
                          }
                        }}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-700 pb-2 pt-4">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <div className="flex gap-4">
                      <div className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                        <Shield className="text-blue-600 h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Secure your account</p>
                        <p className="text-sm text-gray-600 dark:text-neutral-400 max-w-md">
                          Two-factor authentication adds an extra layer of security to your account.
                        </p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm">Enable 2FA</Button>
                  </div>

                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-900/30 pb-2 pt-4">
                    Danger Zone
                  </h3>
                  <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-red-700 dark:text-red-300">Delete Account</p>
                        <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 whitespace-nowrap"
                        isLoading={deleteLoading}
                        disabled={deleteLoading}
                        onClick={async () => {
                          const { value: password } = await Swal.fire({
                            title: 'Delete Account',
                            text: 'This is irreversible. Enter your password to confirm.',
                            input: 'password',
                            inputPlaceholder: 'Enter your password',
                            showCancelButton: true,
                            confirmButtonText: 'Delete My Account',
                            confirmButtonColor: '#dc2626',
                            inputValidator: (value) => !value ? 'Password is required' : null,
                          });
                          if (!password) return;
                          setDeleteLoading(true);
                          try {
                            await deleteUserAccount(password);
                            Swal.fire({ title: 'Account Deleted', text: 'Your account has been permanently deleted.', icon: 'info', timer: 3000, showConfirmButton: false });
                            window.location.href = '/';
                          } catch (error: any) {
                            logger.error('Account deletion failed:', error);
                            Swal.fire({ title: 'Error', text: error?.message || 'Failed to delete account.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
                          } finally {
                            setDeleteLoading(false);
                          }
                        }}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Footer Actions ─── */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-200 dark:border-neutral-700 rounded-b-2xl flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}