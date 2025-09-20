import React, { createContext, useContext, useEffect, useState } from 'react';
import { register as apiRegister, login as apiLogin, getMe } from '@/api';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string, role: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithOAuth: (user: User, token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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

  const signUp = async (name: string, email: string, password: string, role: string) => {
    try {
      const res = await apiRegister({ name, email, password, role });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast({ title: 'Registration Successful', description: 'Welcome to Judicature!' });
      
      // Role-based redirection
      // if (user.role === 'client') {
      //   window.location.href = '/client-dashboard';
      // } else if (user.role === 'lawyer') {
      //   window.location.href = '/lawyer-dashboard';
      // }
      
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Registration Error', description: error.response?.data?.message || error.message, variant: 'destructive' });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiLogin({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      
      // // Role-based redirection
      // if (user.role === 'client') {
      //   window.location.href = '/dashboard/client';
      // } else if (user.role === 'lawyer') {
      //   window.location.href = '/dashboard/lawyer';
      // }
      
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Login Error', description: error.response?.data?.message || error.message, variant: 'destructive' });
      return { error };
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
    setToken(null);
    setUser(null);
    toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
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
