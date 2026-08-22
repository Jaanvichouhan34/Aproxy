import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Show loading skeleton during initial session recovery
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
          <ShieldCheck className="w-8 h-8 animate-pulse text-brand-500" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          <span>Verifying cryptographic session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to Auth Page
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check RBAC permissions
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If student attempted teacher route, redirect to student dashboard
    if (user.role === 'student') {
      return <Navigate to="/student" replace />;
    }
    // If teacher attempted student route, redirect to teacher dashboard
    if (user.role === 'teacher') {
      return <Navigate to="/teacher" replace />;
    }
  }

  return <>{children}</>;
};

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['teacher']}>{children}</ProtectedRoute>
);

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>
);
