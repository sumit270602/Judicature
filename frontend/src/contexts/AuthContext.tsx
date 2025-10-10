import React, { createContext, useContext, useEffect, useState } from 'react';
import { register as apiRegister, login as apiLogin, getMe } from '@/api';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '@/hooks/use-toast';
import type { User, AuthError, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      getMe()
        .then((res) => {
          setUser(res.data.user || res.data);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    name: string, 
    email: string, 
    password: string, 
    role: string, 
    lawyerProfile?: {
      barCouncilId: string;
      practiceAreas: string[];
      experience: number;
      hourlyRate: number;
      bio: string;
      phone: string;
      address: string;
    }
  ) => {
    try {
      const registrationData = { 
        name, 
        email, 
        password, 
        role,
        ...(role === 'lawyer' && lawyerProfile ? lawyerProfile : {})
      };
      
      const res = await apiRegister(registrationData);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      const successMessage = role === 'lawyer' 
        ? 'Registration successful! Please wait for admin verification to access all features.'
        : 'Welcome to Judicature!';
        
      toast({ title: 'Registration Successful', description: successMessage });
      
      return { error: null };
    } catch (error: unknown) {
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Registration failed',
        code: 'REGISTRATION_ERROR'
      };
      toast({ title: 'Registration Error', description: authError.message, variant: 'destructive' });
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string, redirectFeature?: string) => {
    try {
      const res = await apiLogin({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      
      // Store redirect feature for dashboard navigation
      if (redirectFeature) {
        localStorage.setItem('redirectFeature', redirectFeature);
      }
      
      // Role-based redirection
      setTimeout(() => {
        if (user.role === 'client') {
          window.location.href = '/dashboard/client';
        } else if (user.role === 'lawyer') {
          window.location.href = '/dashboard/lawyer';
        } else if (user.role === 'admin') {
          window.location.href = '/dashboard/admin';
        }
      }, 1000);
      
      return { error: null };
    } catch (error: unknown) {
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Login failed',
        code: 'LOGIN_ERROR'
      };
      toast({ title: 'Login Error', description: authError.message, variant: 'destructive' });
      return { error: authError };
    }
  };

  const signInWithOAuth = (user: User, authToken: string) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(user);
    toast({ title: 'Login Successful', description: `Welcome back, ${user.name}!` });
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('redirectFeature');
    setToken(null);
    setUser(null);
    toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
    
    // Clear browser history and redirect to landing page
    window.history.replaceState(null, '', '/');
    window.location.href = '/';
  };

  const value = {
    user,
    token,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
