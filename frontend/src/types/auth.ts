
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Lawyer-specific fields
  phone?: string;
  address?: string;
  barCouncilId?: string;
  practiceAreas?: string[];
  experience?: number;
  hourlyRate?: number;
  bio?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface LawyerProfile {
  barCouncilId: string;
  practiceAreas: string[];
  experience: number;
  hourlyRate: number;
  bio: string;
  phone: string;
  address: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string, role: string, lawyerProfile?: LawyerProfile) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string, redirectFeature?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (user: User, token: string) => void;
  signOut: () => void;
}