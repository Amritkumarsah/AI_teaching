import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Protected App Pages
import { DashboardPage } from './pages/DashboardPage';
import { CreateLessonPage } from './pages/CreateLessonPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { LearningPage } from './pages/LearningPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Legacy / Auxiliary Pages
import { ClassroomPage } from './pages/ClassroomPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { VideoTeachingPage } from './pages/VideoTeachingPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        {/* Public Standalone Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated Pages Guarded by ProtectedRoute and AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-lesson" element={<CreateLessonPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/video-teaching" element={<VideoTeachingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Auxiliary routes protected */}
          <Route path="/classroom" element={<ClassroomPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
        </Route>

        {/* Catch-all redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;
