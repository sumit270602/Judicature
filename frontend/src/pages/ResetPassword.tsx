import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]/)) strength += 20;
    if (password.match(/[A-Z]/)) strength += 20;
    if (password.match(/[0-9]/)) strength += 20;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 20;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    if (strength < 40) return { label: 'Weak', color: 'bg-red-500' };
    if (strength < 60) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 80) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast({
          title: "Password Reset Successfully",
          description: "Your password has been updated. You're now logged in.",
        });

        // Auto-login the user with the new token
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          login(data.user, data.token);
        }

        // Redirect after a short delay
        setTimeout(() => {
          if (data.user?.role === 'lawyer') {
            navigate('/dashboard/lawyer');
          } else if (data.user?.role === 'client') {
            navigate('/dashboard/client');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);
  const strengthInfo = getStrengthLabel(strength);

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-navy via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-1">
            <div className="w-16 h-16 bg-gradient-to-r from-legal-navy to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {isSuccess ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <Lock className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-playfair">
              {isSuccess ? 'Password Reset Complete' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? 'Your password has been successfully updated. Redirecting to dashboard...'
                : 'Enter your new password below'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your password has been successfully reset and you are now logged in.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-legal-navy border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Password Strength</span>
                        <span className={`text-xs font-medium ${
                          strengthInfo.label === 'Weak' ? 'text-red-600' :
                          strengthInfo.label === 'Fair' ? 'text-yellow-600' :
                          strengthInfo.label === 'Good' ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      <Progress value={strength} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Password Requirements:</p>
                      <ul className="space-y-0.5">
                        <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                          • At least 8 characters
                        </li>
                        <li className={formData.password.match(/[A-Z]/) ? 'text-green-600' : ''}>
                          • One uppercase letter
                        </li>
                        <li className={formData.password.match(/[0-9]/) ? 'text-green-600' : ''}>
                          • One number
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-legal-navy to-blue-700" 
                  disabled={isLoading || strength < 60}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {!isSuccess && (
              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-gray-600 hover:text-legal-navy transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;