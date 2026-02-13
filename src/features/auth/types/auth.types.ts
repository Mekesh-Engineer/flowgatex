import { UserRole } from '@/lib/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  dob?: string | null;
  gender?: string | null;
  consents?: {
    terms?: boolean;
    marketing?: boolean;
    whatsapp?: boolean;
    liveLocation?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type UpdatableUserFields = Partial<
  Pick<
    AuthUser,
    | 'displayName'
    | 'firstName'
    | 'lastName'
    | 'phoneNumber'
    | 'dob'
    | 'gender'
    | 'photoURL'
  >
>;

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  oobCode: string;
  newPassword: string;
}
