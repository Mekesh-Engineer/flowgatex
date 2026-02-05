// Mock authentication service types are defined inline

// ============================================================================
// MOCK AUTHENTICATION SERVICE
// ============================================================================
// This service provides mock authentication for frontend-only development
// Replace with real Firebase auth when backend is ready

// Mock user data
const MOCK_USERS: Record<string, any> = {
  'demo@flowgatex.com': {
    uid: 'mock-user-001',
    email: 'demo@flowgatex.com',
    displayName: 'Demo User',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    phoneNumber: '+1234567890',
    role: 'user',
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  'organizer@flowgatex.com': {
    uid: 'mock-organizer-001',
    email: 'organizer@flowgatex.com',
    displayName: 'Event Organizer',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=organizer',
    phoneNumber: '+1234567891',
    role: 'organizer',
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  'admin@flowgatex.com': {
    uid: 'mock-admin-001',
    email: 'admin@flowgatex.com',
    displayName: 'Admin User',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phoneNumber: '+1234567892',
    role: 'admin',
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
};

// Current mock user (stored in localStorage)
const STORAGE_KEY = 'flowgatex_mock_user';

class MockAuthService {
  private currentUser: any | null = null;
  private listeners: ((user: any | null) => void)[] = [];

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

  // Sign in with email/password (mock)
  async signIn(email: string, _password: string): Promise<any> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];
    if (!user) {
      throw new Error('Invalid credentials. Try: demo@flowgatex.com, organizer@flowgatex.com, or admin@flowgatex.com');
    }

    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.notifyListeners();
    return user;
  }

  // Sign up (mock)
  async signUp(email: string, _password: string, displayName: string): Promise<any> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newUser: any = {
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
    return newUser;
  }

  // Sign in with Google (mock)
  async signInWithGoogle(): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.signIn('demo@flowgatex.com', 'password');
  }

  // Sign in with Facebook (mock)
  async signInWithFacebook(): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.signIn('demo@flowgatex.com', 'password');
  }

  // Sign out
  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  // Get current user
  getCurrentUser(): any | null {
    return this.currentUser;
  }

  // Password reset (mock)
  async resetPassword(email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`📧 Mock password reset email sent to: ${email}`);
  }

  // Update profile (mock)
  async updateProfile(updates: Partial<any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
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
  onAuthStateChanged(callback: (user: any | null) => void): () => void {
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
