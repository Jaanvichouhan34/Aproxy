import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DemoPage } from './pages/DemoPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

// Route Guards
import { TeacherRoute, StudentRoute } from './components/auth/ProtectedRoute';

// Teacher Dashboard
import { TeacherLayout } from './components/dashboard/teacher/TeacherLayout';
import { TeacherOverviewPage } from './pages/teacher/TeacherOverviewPage';
import { TeacherTimetablePage } from './pages/teacher/TeacherTimetablePage';
import { TeacherLiveSessionsPage } from './pages/teacher/TeacherLiveSessionsPage';
import { TeacherHistoryPage } from './pages/teacher/TeacherHistoryPage';
import { TeacherAnalyticsPage } from './pages/teacher/TeacherAnalyticsPage';
import { TeacherRosterPage } from './pages/teacher/TeacherRosterPage';
import { TeacherSettingsPage } from './pages/teacher/TeacherSettingsPage';

// Student Dashboard
import { StudentLayout } from './components/dashboard/student/StudentLayout';
import { StudentOverviewPage } from './pages/student/StudentOverviewPage';
import { StudentScanPage } from './pages/student/StudentScanPage';
import { StudentStatsPage } from './pages/student/StudentStatsPage';
import { StudentFaceIdPage } from './pages/student/StudentFaceIdPage';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check for silent authentication on app boot
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />

        {/* Protected Teacher Dashboard Routes */}
        <Route
          path="/teacher"
          element={
            <TeacherRoute>
              <TeacherLayout />
            </TeacherRoute>
          }
        >
          <Route index element={<TeacherOverviewPage />} />
          <Route path="timetable" element={<TeacherTimetablePage />} />
          <Route path="live-sessions" element={<TeacherLiveSessionsPage />} />
          <Route path="history" element={<TeacherHistoryPage />} />
          <Route path="analytics" element={<TeacherAnalyticsPage />} />
          <Route path="students" element={<TeacherRosterPage />} />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>

        {/* Protected Student Dashboard Routes */}
        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentLayout />
            </StudentRoute>
          }
        >
          <Route index element={<StudentOverviewPage />} />
          <Route path="scan" element={<StudentScanPage />} />
          <Route path="stats" element={<StudentStatsPage />} />
          <Route path="face-id" element={<StudentFaceIdPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
