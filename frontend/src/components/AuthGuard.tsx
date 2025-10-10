import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isPageVisible = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPageVisible) {
        // When page becomes visible again, check auth status
        if (!loading && !user) {
          navigate('/', { replace: true });
        }
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // Prevent back button access when not authenticated
      if (!loading && !user) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', location.pathname);
        navigate('/', { replace: true });
      }
    };

    const handleBeforeUnload = () => {
      isPageVisible = false;
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial check
    if (!loading && !user) {
      navigate('/', { replace: true });
    }

    // Push initial state to prevent back button issues
    if (!user) {
      window.history.pushState(null, '', location.pathname);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, loading, navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthGuard;