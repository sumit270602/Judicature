import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import OAuthProviders from '@/components/auth/OAuthProviders';
import { toast } from 'sonner';
import Header from '@/components/Header';

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
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-blue-800">
      <Header />
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-legal-navy to-blue-800 p-4 rounded-2xl shadow-lg">
                <Scale className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-playfair font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sign in to your Judicature account to continue
            </CardDescription>
          </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 focus:ring-legal-navy focus:border-legal-navy transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-legal-navy hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12 focus:ring-legal-navy focus:border-legal-navy transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-legal-navy to-blue-800 hover:from-legal-navy/90 hover:to-blue-800/90 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In to Judicature'
              )}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              {/* <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div> */}
            </div>
            
            <OAuthProviders className="mt-4" disabled={loading} />
          </div>
          
          <div className="mt-8 text-center space-y-3">
            <div className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-legal-navy hover:underline font-medium transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Login;
