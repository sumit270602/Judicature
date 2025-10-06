import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithOAuth } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = () => {
      const token = searchParams.get('oauth_token');
      const success = searchParams.get('oauth_success');
      const error = searchParams.get('error');

      if (error) {
        let errorMessage = 'OAuth authentication failed';
        switch (error) {
          case 'oauth_error':
            errorMessage = 'Authentication error occurred';
            break;
          case 'oauth_failed':
            errorMessage = 'OAuth authentication was cancelled or failed';
            break;
          case 'token_error':
            errorMessage = 'Token generation error';
            break;
          default:
            errorMessage = 'OAuth authentication failed';
        }
        
        toast.error(errorMessage);
        navigate('/login');
        return;
      }

      if (success === 'true' && token) {
        try {
          // Decode the JWT to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Create user object from JWT payload
          const user = {
            id: payload.id,
            role: payload.role,
            name: '', // Will be fetched by AuthContext
            email: '' // Will be fetched by AuthContext
          };

          // Use the OAuth sign-in method
          signInWithOAuth(user, token);
          
          toast.success('Successfully signed in with Google!');
          
          // Navigate based on role
          if (payload.role === 'client') {
            navigate('/dashboard/client');
          } else if (payload.role === 'lawyer') {
            navigate('/dashboard/lawyer');
          } else if (payload.role === 'admin') {
            navigate('/dashboard/admin');
          } else {
            navigate('/dashboard');
          }
          
        } catch (error) {
          console.error('Token decode error:', error);
          toast.error('Invalid authentication token');
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, signInWithOAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;