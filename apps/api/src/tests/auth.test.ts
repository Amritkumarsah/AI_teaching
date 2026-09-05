import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import { UserModel } from '../models/user.model';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(id: number, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ Case ${id}: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id, name, passed: false, message: err.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ Case ${id}: ${name} (${Date.now() - start}ms) - ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('  RUNNING PHASE 2 PRODUCTION AUTHENTICATION TEST SUITE');
  console.log('======================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const timestamp = Date.now();
  const testUserEmail = `scholar_${timestamp}@aiteacher.io`;
  const testUserPassword = 'StrongPassword2026!';
  let userToken = '';
  let verificationToken = '';
  let studentId = '';
  const googleId1 = `gid_${Date.now()}`;
  const googleEmail1 = `google_scholar_${Date.now()}@gmail.com`;

  try {
    // 1. New signup
    await runTest(1, 'New signup creates student with unverified status and returns token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Priya Sharma',
          email: testUserEmail,
          password: testUserPassword,
          role: 'ADMIN', // Should be IGNORED; role must always default to STUDENT
        }),
      });

      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data.token) throw new Error('Missing token in signup response');
      if (data.data.user.role !== 'STUDENT') throw new Error(`Role was not forced to STUDENT: ${data.data.user.role}`);
      if (data.data.user.emailVerified !== false) throw new Error('New signup must start with emailVerified: false');
      if (!data.data.verificationToken) throw new Error('Missing verificationToken in response');

      userToken = data.data.token;
      verificationToken = data.data.verificationToken;
      studentId = data.data.user.id;
    });

    // 2. Existing login
    await runTest(2, 'Existing user login returns signed JWT and updates lastLoginAt', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data.token) throw new Error('Missing token in login response');
      if (data.data.user.email !== testUserEmail) throw new Error('Email mismatch');
      if (!data.data.user.lastLoginAt) throw new Error('lastLoginAt was not set');
    });

    // 3. Wrong password
    await runTest(3, 'Wrong password rejected with 401 INVALID_CREDENTIALS', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'IncorrectPassword999',
        }),
      });

      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      const data = await res.json();
      if (data.success !== false || data.error?.code !== 'INVALID_CREDENTIALS') {
        throw new Error(`Expected error code INVALID_CREDENTIALS, got ${JSON.stringify(data)}`);
      }
    });

    // 4. Logout
    await runTest(4, 'Logout endpoint acknowledges session termination', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Logout failed');
    });

    // 5. Unverified user state
    await runTest(5, 'User model correctly reflects unverified status prior to token confirmation', async () => {
      const user = await UserModel.findById(studentId);
      if (!user) throw new Error('User not found');
      if (user.emailVerified !== false) throw new Error('User should have emailVerified = false');
    });

    // 6. Verified user state
    await runTest(6, 'Email verification endpoint validates token and sets emailVerified to true', async () => {
      const res = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Verification failed');

      // Verify database updated
      const updatedUser = await UserModel.findById(studentId);
      if (!updatedUser?.emailVerified) throw new Error('Database emailVerified flag not set to true');
    });

    // 7. Expired session / Invalid token
    await runTest(7, 'Invalid or expired token rejected with 401 UNAUTHORIZED', async () => {
      const expiredToken = jwt.sign(
        { userId: studentId, email: testUserEmail, role: 'STUDENT' },
        ENV.JWT_SECRET,
        { expiresIn: '-10s' } // Expired in past
      );

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });

      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized for expired token, got ${res.status}`);
      const data = await res.json();
      if (data.error?.code !== 'TOKEN_EXPIRED') {
        throw new Error(`Expected code TOKEN_EXPIRED, got ${data.error?.code}`);
      }
    });

    // 8. Google new user
    await runTest(8, 'Google OAuth signup provisions new user with verified email', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleId1,
          email: googleEmail1,
          name: 'Aarav Gupta',
          avatarUrl: 'https://lh3.googleusercontent.com/a/photo123',
        }),
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data.token) throw new Error('Missing token');
      if (data.data.user.emailVerified !== true) throw new Error('Google user must be emailVerified: true');
      if (data.data.user.role !== 'STUDENT') throw new Error('Google user must be STUDENT');
    });

    // 9. Google existing user
    await runTest(9, 'Google OAuth login returns existing user and updates lastLoginAt', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleId1,
          email: googleEmail1,
        }),
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data.token) throw new Error('Missing token');
      if (data.data.user.email !== googleEmail1) throw new Error('Email mismatch');
    });

    // 10. Google popup cancelled
    await runTest(10, 'Google OAuth cancelled error handled with 400 GOOGLE_AUTH_CANCELLED', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'popup_closed_by_user',
        }),
      });

      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      const data = await res.json();
      if (data.error?.code !== 'GOOGLE_AUTH_CANCELLED') {
        throw new Error(`Expected GOOGLE_AUTH_CANCELLED, got ${data.error?.code}`);
      }
    });

    // 11. Authoritative user state refetch (GET /api/auth/me)
    await runTest(11, 'GET /api/auth/me refetches fresh authoritative state for logged-in user', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const data = await res.json();
      if (!data.success || data.data.user.id !== studentId) {
        throw new Error('Failed to retrieve authoritative user state');
      }
      if (data.data.user.emailVerified !== true) {
        throw new Error('Expected emailVerified to be true after verification');
      }
    });

    // 12. Direct API request without authentication
    await runTest(12, 'Direct API request without token rejected with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/admin/metrics`); // No Authorization header
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      const data = await res.json();
      if (data.error?.code !== 'UNAUTHORIZED') {
        throw new Error(`Expected UNAUTHORIZED, got ${data.error?.code}`);
      }
    });

    // 13. Student accessing admin endpoint
    await runTest(13, 'Student accessing admin endpoint rejected with 403 FORBIDDEN', async () => {
      const res = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${userToken}` }, // Student token
      });

      if (res.status !== 403) throw new Error(`Expected 403 Forbidden for Student, got ${res.status}`);
      const data = await res.json();
      if (data.error?.code !== 'FORBIDDEN') {
        throw new Error(`Expected error code FORBIDDEN, got ${data.error?.code}`);
      }
    });

  } finally {
    // Cleanup test users
    await UserModel.deleteMany({ email: { $in: [testUserEmail, googleEmail1] } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n------------------------------------------------------');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Auth Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});
