import { useAuth } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute = ({ children, allowedRoles, redirectTo = '/' }: RoleBasedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Clear any cached navigation state when authentication state changes
    if (!loading) {
      // Force navigation state reset to prevent back button access
      if (!user) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [user, loading]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to landing page
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // User doesn't have the required role
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Redirect to appropriate dashboard based on role
                  if (user.role === 'client') {
                    window.location.href = '/dashboard/client';
                  } else if (user.role === 'lawyer') {
                    window.location.href = '/dashboard/lawyer';
                  } else if (user.role === 'admin') {
                    window.location.href = '/dashboard/admin';
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-legal-navy text-white px-4 py-2 rounded-md hover:bg-legal-navy/90 transition-colors"
              >
                Go to My Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;