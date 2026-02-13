// =============================================================================
// MOCK AUTHENTICATION SERVICE — Development Fallback Only
// =============================================================================
// This service is ONLY used when Firebase is not configured (VITE_MOCK_MODE=true).
// In production, Firebase Authentication handles all auth operations.
// =============================================================================

import { logger } from '@/lib/logger';

// Mock user data - no hardcoded credentials
interface MockUserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phoneNumber: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Current mock user (stored in localStorage)
const STORAGE_KEY = 'flowgatex_mock_user';

class MockAuthService {
  private currentUser: MockUserData | null = null;
  private listeners: ((user: MockUserData | null) => void)[] = [];

  // Hardcoded test users (from TEST_CREDENTIALS_GUIDE.md)
  private static TEST_USERS: Array<MockUserData & { password: string; dob: string; location: string }> = [
    {
      uid: 'mock-admin',
      email: 'mekeshkumar1236@gmail.com',
      displayName: 'Mekesh Admin',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mekeshkumar1236@gmail.com',
      phoneNumber: null,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      password: 'Mekesh@admin1236',
      dob: '1990-01-01',
      location: 'Chennai',
    },
    {
      uid: 'mock-superadmin',
      email: 'mekesh.engineer@gmail.com',
      displayName: 'Mekesh SuperAdmin',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mekesh.engineer@gmail.com',
      phoneNumber: null,
      role: 'superadmin',
      emailVerified: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      password: 'Mekesh@superadmin1236',
      dob: '1985-05-05',
      location: 'Bangalore',
    },
    // You can add attendee/organizer here as well if needed
  ];

  constructor() {
    // Load user from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        logger.error('Failed to parse stored user:', e);
      }
    }
  }

  // Sign in with email/password (mock mode)
  async signIn(email: string, password: string): Promise<MockUserData> {
    // Check against hardcoded test users
    const user = MockAuthService.TEST_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      // Omit password, dob, location from returned user
      // Omit password, dob, location from returned user
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, dob, location, ...userData } = user;
      this.currentUser = userData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      this.notifyListeners();
      return userData;
    }
    throw new Error('Invalid email or password for mock login.');
  }

  // Sign up (mock mode, only allows user role)
  async signUp(email: string, _password: string, displayName: string): Promise<MockUserData> {
    // Allow creating demo users for development purposes only (role: user)
    const newUser: MockUserData = {
      uid: `mock-user-${Date.now()}`,
      email,
      displayName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      phoneNumber: null,
      role: 'user',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.currentUser = newUser;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    this.notifyListeners();
    logger.warn('⚠️ Mock user created. For production, configure Firebase Authentication.');
    return newUser;
  }

  // Sign in with Google (mock)
  async signInWithGoogle(): Promise<MockUserData> {
    throw new Error(
      'Google sign-in requires Firebase configuration. Please set up Firebase in .env.local.',
    );
  }

  // Sign in with Facebook (mock)
  async signInWithFacebook(): Promise<MockUserData> {
    throw new Error(
      'Facebook sign-in requires Firebase configuration. Please set up Firebase in .env.local.',
    );
  }

  // Sign out
  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  // Get current user
  getCurrentUser(): MockUserData | null {
    return this.currentUser;
  }

  // Password reset (mock)
  async resetPassword(email: string): Promise<void> {
    logger.log(`📧 Mock: Password reset would be sent to: ${email}`);
    logger.warn('⚠️ For real password reset, configure Firebase Authentication.');
  }

  // Update profile (mock)
  async updateProfile(updates: Partial<MockUserData>): Promise<MockUserData> {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    this.currentUser = {
      ...this.currentUser,
      ...updates,
      updatedAt: new Date(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notifyListeners();
    return this.currentUser;
  }

  // Auth state listener
  onAuthStateChanged(callback: (user: MockUserData | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();

// Helper to check if we're in mock mode
export const isMockMode = () => import.meta.env.VITE_MOCK_MODE === 'true';
