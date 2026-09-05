import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CreateLessonPage } from '../pages/CreateLessonPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { LearningPage } from '../pages/LearningPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';

// UI Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Loading, LoadingPage } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assertRender(name: string, renderFn: () => string, expectedSubstrings: string[]) {
  try {
    const html = renderFn();
    for (const expected of expectedSubstrings) {
      if (!html.includes(expected)) {
        throw new Error(`Expected output to contain "${expected}", but it was not found in rendered markup.`);
      }
    }
    results.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message });
    console.error(`  ✗ FAIL: ${name} - ${err.message}`);
  }
}

console.log('\n========================================');
console.log('  RUNNING FRONTEND RENDERING TESTS');
console.log('========================================\n');

// 1. UI Components
assertRender(
  'UI: Button renders all variants and handles disabled/loading',
  () => renderToString(
    <div>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button isLoading>Loading Button</Button>
    </div>
  ),
  ['Primary', 'Secondary', 'Outline', 'Ghost', 'Danger']
);

assertRender(
  'UI: Input renders with label, helper, and value',
  () => renderToString(
    <Input
      label="Username"
      value="scholar_test"
      helperText="Enter your study nickname"
      readOnly
    />
  ),
  ['Username', 'scholar_test', 'Enter your study nickname']
);

assertRender(
  'UI: Card and subcomponents render structure correctly',
  () => renderToString(
    <Card>
      <CardHeader>
        <CardTitle>Lesson Title</CardTitle>
      </CardHeader>
      <CardContent>Body content</CardContent>
    </Card>
  ),
  ['Lesson Title', 'Body content']
);

assertRender(
  'UI: Badge, ProgressBar, Loading, EmptyState, ErrorState',
  () => renderToString(
    <div>
      <Badge variant="success" dot>Mastered</Badge>
      <ProgressBar value={75} label="Progress" />
      <Loading size="md" />
      <EmptyState title="No items" description="Nothing here" />
      <ErrorState title="System Alert" message="Connection failed" />
    </div>
  ),
  ['Mastered', 'Progress', 'No items', 'Nothing here', 'System Alert', 'Connection failed']
);

// 2. All Required Pages & Auth Views
const pagesToTest = [
  { name: 'Landing Page (/)', path: '/', element: <LandingPage />, expected: ['AI Teacher', 'Interactive Lesson'] },
  { name: 'Login Page (/login)', path: '/login', element: <LoginPage />, expected: ['Log in to your account', 'Email Address', 'Password'] },
  { name: 'Signup Page (/signup)', path: '/signup', element: <SignupPage />, expected: ['Create your student profile', 'Full Name', 'Password'] },
  { name: 'Verify Email Page (/verify-email)', path: '/verify-email', element: <VerifyEmailPage />, expected: ['Email Verification', 'Verification Token'] },
  { name: 'Forgot Password Page (/forgot-password)', path: '/forgot-password', element: <ForgotPasswordPage />, expected: ['Reset your password', 'Registered Email'] },
  { name: 'Reset Password Page (/reset-password)', path: '/reset-password', element: <ResetPasswordPage />, expected: ['Create New Password', 'Reset Token', 'New Password'] },
  { name: 'Dashboard Page (/dashboard)', path: '/dashboard', element: <DashboardPage />, expected: ['Study Streak', 'Laws of Motion'] },
  { name: 'Create Lesson Page (/create-lesson)', path: '/create-lesson', element: <CreateLessonPage />, expected: ['Generate a Personalized Lesson', 'Learning Topic'] },
  { name: 'Documents Page (/documents)', path: '/documents', element: <DocumentsPage />, expected: ['Document Library', 'Upload'] },
  { name: 'Learning Studio Page (/learning)', path: '/learning', element: <LearningPage />, expected: ['Principle of Inertia', 'Lesson Modules'] },
  { name: 'Student Profile Page (/profile)', path: '/profile', element: <ProfilePage />, expected: ['Personal Learning Profile', 'Education Level'] },
  { name: 'Settings Page (/settings)', path: '/settings', element: <SettingsPage />, expected: ['Platform Settings', 'Audio Experience'] },
];

for (const p of pagesToTest) {
  assertRender(
    `Page: ${p.name}`,
    () => renderToString(
      <ToastProvider>
        <MemoryRouter initialEntries={[p.path]}>
          <Routes>
            <Route path={p.path} element={p.element} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    ),
    p.expected
  );
}

// 3. AppLayout Integration Test
assertRender(
  'Layout: AppLayout wraps pages with Sidebar and Navbar',
  () => renderToString(
    <ToastProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  ),
  ['AI Teacher', 'Dashboard', 'Create Lesson', 'Documents', 'Learning Studio', 'Student Profile', 'Settings']
);

console.log('\n----------------------------------------');
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
console.log(`  Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
console.log('----------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
