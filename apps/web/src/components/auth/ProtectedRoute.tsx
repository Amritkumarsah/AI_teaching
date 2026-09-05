import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingPage } from '../ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  useEffect(() => {
    // Verify or refresh session in background
    checkAuth();

    // Safety timeout: never block UI for more than 2 seconds
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkAuth]);

  if (isLoading && !hasTimedOut) {
    return <LoadingPage message="Verifying secure session..." />;
  }

  // Unauthenticated: redirect to login and preserve destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authorization check: required role
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-md space-y-2">
          <h3 className="text-base font-bold">Access Restricted</h3>
          <p className="text-xs text-slate-300">
            This administrative area requires elevated role privileges. You are signed in as a {user.role}.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
