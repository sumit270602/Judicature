import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not an admin
  if (user.role !== 'admin') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have administrator privileges to access this area. 
              Please contact your system administrator if you believe this is an error.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-legal-navy text-white px-4 py-2 rounded-md hover:bg-legal-navy/90 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = user.role === 'lawyer' ? '/dashboard/lawyer' : '/dashboard/client'}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin
  return <>{children}</>;
};

export default ProtectedAdminRoute;