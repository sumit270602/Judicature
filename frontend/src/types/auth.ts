export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string, role: string, redirectFeature?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string, redirectFeature?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (user: User, token: string) => void;
  signOut: () => void;
}