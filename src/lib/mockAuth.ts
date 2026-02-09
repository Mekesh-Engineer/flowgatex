// =============================================================================
// MOCK AUTHENTICATION SERVICE — Development Fallback Only
// =============================================================================
// This service is ONLY used when Firebase is not configured (VITE_MOCK_MODE=true).
// In production, Firebase Authentication handles all auth operations.
// =============================================================================

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

  constructor() {
    // Load user from localStorage on init
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }

  // Sign in with email/password (mock disabled - use Firebase)
  async signIn(_email: string, _password: string): Promise<MockUserData> {
    // In mock mode, prompt user to configure Firebase
    throw new Error(
      'Mock authentication is disabled. Please configure Firebase with valid credentials in .env.local and set VITE_MOCK_MODE=false.',
    );
  }

  // Sign up (mock disabled - use Firebase)
  async signUp(email: string, _password: string, displayName: string): Promise<MockUserData> {
    // Allow creating demo users for development purposes only
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
    
    console.warn('⚠️ Mock user created. For production, configure Firebase Authentication.');
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
    console.log(`📧 Mock: Password reset would be sent to: ${email}`);
    console.warn('⚠️ For real password reset, configure Firebase Authentication.');
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
