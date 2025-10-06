import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import OAuthProviders from '@/components/auth/OAuthProviders';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithOAuth, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle OAuth callback
    const oauthToken = searchParams.get('oauth_token');
    const oauthSuccess = searchParams.get('oauth_success');
    
    if (oauthToken && oauthSuccess === 'true') {
      // Extract user data from token (this would normally be done more securely)
      try {
        const payload = JSON.parse(atob(oauthToken.split('.')[1]));
        // Store the token and navigate
        localStorage.setItem('token', oauthToken);
        toast.success('Successfully signed in with Google!');
        
        // Navigate based on role
        if (payload.role === 'admin') {
          navigate('/dashboard/admin');
        } else if (payload.role === 'client') {
          navigate('/dashboard/client');
        } else if (payload.role === 'lawyer') {
          navigate('/dashboard/lawyer');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error processing OAuth token:', error);
        toast.error('Error processing OAuth login');
      }
    }

    // Handle OAuth errors
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'oauth_error':
          toast.error('OAuth authentication failed. Please try again.');
          break;
        case 'oauth_failed':
          toast.error('OAuth login failed. Please try again.');
          break;
        case 'token_error':
          toast.error('Authentication error. Please try again.');
          break;
        default:
          toast.error('Login failed. Please try again.');
      }
    }

    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (user.role === 'client') {
        navigate('/dashboard/client');
      } else if (user.role === 'lawyer') {
        navigate('/dashboard/lawyer');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    // Removed navigation from here since useEffect will handle it
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-legal-navy p-3 rounded-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-playfair">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Judicature account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-legal-navy hover:bg-legal-navy/90"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <OAuthProviders className="mt-6" disabled={loading} />
          
          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-legal-navy hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
