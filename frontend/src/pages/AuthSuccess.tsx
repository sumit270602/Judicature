import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

const AuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithOAuth } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Extract token from URL parameters
        const authToken = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('Authentication error:', error);
          navigate('/login?error=Authentication failed');
          return;
        }

        if (!authToken) {
          console.error('No token received');
          navigate('/login?error=No authentication token received');
          return;
        }

        // Decode the JWT to get user information
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const user = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role
        };

        // Update authentication state using OAuth method
        signInWithOAuth(user, authToken);

        // Redirect based on user role after a short delay
        setTimeout(() => {
          if (user.role === 'lawyer') {
            navigate('/dashboard/lawyer');
          } else if (user.role === 'client') {
            navigate('/dashboard/client');
          } else {
            navigate('/'); // Default redirect
          }
        }, 1500);

      } catch (error) {
        console.error('Error processing authentication:', error);
        navigate('/login?error=Failed to process authentication');
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate, signInWithOAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Processing Authentication</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">
            Please wait while we complete your login...
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>✓ Verifying your Google account</p>
            <p>✓ Setting up your session</p>
            <p>✓ Redirecting to dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSuccess;