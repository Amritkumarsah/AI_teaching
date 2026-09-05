import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../server';
import { connectDB } from '../config/database';
import { UserModel } from '../models/user.model';
import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ PASS: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ FAIL: ${name} (${Date.now() - start}ms) - ${err.message}`);
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  RUNNING PHASE 1 FOUNDATION TEST SUITE');
  console.log('========================================\n');

  // Start test server on random free dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const testPort = address.port;

  try {
    // Test 1: Database Connection Handling
    await runTest('Database: Connects and verifies MongoDB connectivity', async () => {
      await connectDB();
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`MongoDB not in connected state. Current state: ${mongoose.connection.readyState}`);
      }
      // Ping database
      if (mongoose.connection.db) {
        const pingResult = await mongoose.connection.db.admin().ping();
        if (!pingResult.ok) {
          throw new Error('Database admin ping did not return ok: 1');
        }
      }
    });

    // Test 2: User Model Schema and Password Hashing (no secrets leaked)
    await runTest('Database: User model validation, hashing and secret projection', async () => {
      const testEmail = `test_scholar_${Date.now()}@example.com`;
      const rawPassword = 'SecurePassword123!';

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      // Create test user
      const user = await UserModel.create({
        name: 'Test Student',
        email: testEmail,
        passwordHash,
        role: 'STUDENT',
      });

      if (!user._id) throw new Error('User was not assigned an _id');
      if (user.passwordHash === rawPassword) throw new Error('User password was not hashed!');
      if (!user.passwordHash?.startsWith('$2')) throw new Error('User password is not bcrypt hash');

      // Test comparePassword
      const isMatch = await user.comparePassword(rawPassword);
      if (!isMatch) throw new Error('comparePassword failed on valid password');

      const isWrongMatch = await user.comparePassword('WrongPassword');
      if (isWrongMatch) throw new Error('comparePassword returned true for incorrect password');

      // Test querying without secret by default
      const queried = await UserModel.findById(user._id);
      if (queried?.passwordHash) {
        throw new Error('passwordHash field was exposed in default find query (should have select: false)');
      }

      // Cleanup
      await UserModel.deleteOne({ _id: user._id });
    });

    // Test 3: API Health Endpoint
    await runTest('API: GET /api/health returns 200 with standard health payload', async () => {
      const res = await fetch(`http://127.0.0.1:${testPort}/api/health`);
      if (res.status !== 200) {
        throw new Error(`Expected HTTP 200, got ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(`Expected success: true, got ${data.success}`);
      }
      if (data.message !== 'AI Teacher API is running') {
        throw new Error(`Expected "AI Teacher API is running", got "${data.message}"`);
      }
    });

    // Test 4: Centralized Error Handling on Unknown Routes
    await runTest('API: 404 handler returns standardized error JSON structure', async () => {
      const res = await fetch(`http://127.0.0.1:${testPort}/api/non-existent-endpoint-xyz`);
      if (res.status !== 404) {
        throw new Error(`Expected HTTP 404, got ${res.status}`);
      }
      const data = await res.json();
      if (data.success !== false) {
        throw new Error(`Expected success: false, got ${data.success}`);
      }
      if (!data.error || typeof data.error.code !== 'string' || typeof data.error.message !== 'string') {
        throw new Error(`Response does not conform to standardized { error: { code, message } } structure: ${JSON.stringify(data)}`);
      }
    });

  } finally {
    // Teardown
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  // Summary
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
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
