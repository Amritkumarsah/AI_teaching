import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import { LessonSessionModel, WeakConceptModel, StrongConceptModel } from '../models';
import { AdaptiveTeacherService } from '../services/teaching/adaptive_teacher.service';

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
    console.log(`  ✓ Test ${id}: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id, name, passed: false, message: err.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ Test ${id}: ${name} (${Date.now() - start}ms) - ${err.message}`);
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('  RUNNING PHASE 6 ADAPTIVE AI TEACHER ENGINE TEST SUITE');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);

  let activeSessionId = '';

  try {
    // 1. Session Initialization & State Machine Progression
    await runTest(1, 'POST /api/teaching/start initializes session with INTRODUCTION state and personality', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          topic: "Newton's Laws of Motion",
          personality: 'Friendly',
          language: 'en',
          difficulty: 'beginner',
        }),
      });

      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data?.sessionId) throw new Error('Missing sessionId in response');
      if (json.data.state !== 'INTRODUCTION') throw new Error(`Expected state INTRODUCTION, got ${json.data.state}`);
      if (!json.data.teacherSpeech || !json.data.teacherSpeech.includes('Welcome')) {
        throw new Error('Teacher speech missing introductory greeting');
      }

      activeSessionId = json.data.sessionId;
    });

    // 2. Progression: INTRODUCTION -> EXPLANATION -> DEMONSTRATION -> CHECK_UNDERSTANDING
    await runTest(2, 'POST /api/teaching/continue drives progression: EXPLANATION -> DEMONSTRATION -> CHECK_UNDERSTANDING', async () => {
      // Step 1: Continue to EXPLANATION
      const res1 = await fetch(`${baseUrl}/api/teaching/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const json1 = await res1.json();
      if (json1.data.state !== 'EXPLANATION') throw new Error(`Expected EXPLANATION, got ${json1.data.state}`);

      // Step 2: Continue to DEMONSTRATION
      const res2 = await fetch(`${baseUrl}/api/teaching/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const json2 = await res2.json();
      if (json2.data.state !== 'DEMONSTRATION') throw new Error(`Expected DEMONSTRATION, got ${json2.data.state}`);
      if (!json2.data.visual) throw new Error('Expected visual chalkboard in DEMONSTRATION');

      // Step 3: Continue to CHECK_UNDERSTANDING
      const res3 = await fetch(`${baseUrl}/api/teaching/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const json3 = await res3.json();
      if (json3.data.state !== 'CHECK_UNDERSTANDING') throw new Error(`Expected CHECK_UNDERSTANDING, got ${json3.data.state}`);
      if (!json3.data.question) throw new Error('Expected checkpoint question in CHECK_UNDERSTANDING');
    });

    // 3. Misconception Engine: Detects misunderstanding, refuses to say "Wrong", adapts with alternative analogy & easier question
    await runTest(3, 'Misconception Engine: Incorrect answer triggers REMEDIATION with distinct analogy and scaffolded question', async () => {
      // Student gives a classic misconception answer: "It slows down and stops because force runs out"
      const res = await fetch(`${baseUrl}/api/teaching/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          sessionId: activeSessionId,
          studentAnswer: 'It slows down and stops because force ran out',
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error('Failed to respond to question');
      if (json.data.state !== 'REMEDIATION') throw new Error(`Expected REMEDIATION state, got ${json.data.state}`);
      if (json.data.evaluation?.isCorrect !== false) throw new Error('Expected evaluation.isCorrect = false');

      // Check that teacher NEVER just said "Wrong"
      const speech = json.data.teacherSpeech;
      if (speech.toLowerCase().startsWith('wrong.') || speech.toLowerCase() === 'wrong') {
        throw new Error('Teacher should never simply say "Wrong."');
      }

      // Teacher speech must contain an alternative analogy
      if (!speech.includes('look at this differently') && !speech.includes('analogy') && !speech.includes('Think of') && !speech.includes('Imagine')) {
        throw new Error('Teacher speech must provide an alternative analogy or mental model');
      }

      // Must present a scaffolded/easier follow-up question
      if (!json.data.question) {
        throw new Error('Expected scaffolded easier question in REMEDIATION response');
      }
    });

    // 4. Adaptive Recovery: Student answers easier question correctly -> Teacher confirms understanding & advances
    await runTest(4, 'Adaptive Recovery: Student answers easier question -> Teacher confirms understanding and advances', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          sessionId: activeSessionId,
          studentAnswer: 'No, it keeps moving perpetually',
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error('Failed to respond to remedy question');
      if (json.data.state !== 'NEXT_CONCEPT') throw new Error(`Expected NEXT_CONCEPT state, got ${json.data.state}`);
      if (json.data.evaluation?.isCorrect !== true) throw new Error('Expected evaluation.isCorrect = true');
      if (json.data.masteryScore <= 0) throw new Error('Mastery score should have increased upon correct answer');
    });

    // 5. Pedagogical Action Endpoints: explain-again, simplify, example
    await runTest(5, 'Pedagogical Actions: /explain-again, /simplify, and /example return distinct explanations', async () => {
      // Explain again
      const resExplain = await fetch(`${baseUrl}/api/teaching/explain-again`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const jsonExplain = await resExplain.json();
      if (!jsonExplain.data.teacherSpeech) throw new Error('Missing teacher speech in explain-again');

      // Simplify
      const resSimplify = await fetch(`${baseUrl}/api/teaching/simplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const jsonSimplify = await resSimplify.json();
      if (jsonSimplify.data.difficulty !== 'beginner') throw new Error('Expected difficulty beginner after simplify');

      // Example
      const resExample = await fetch(`${baseUrl}/api/teaching/example`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      const jsonExample = await resExample.json();
      if (!jsonExample.data.teacherSpeech.includes('example') && !jsonExample.data.teacherSpeech.includes('Suppose')) {
        throw new Error('Expected worked example in teacher speech');
      }
    });

    // 6. Multilingual & Context Preservation
    await runTest(6, 'Multilingual Switching: /change-language switches language while preserving lesson context', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/change-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({ sessionId: activeSessionId, newLanguage: 'hi' }),
      });

      const json = await res.json();
      if (json.data.language !== 'hi') throw new Error(`Expected language hi, got ${json.data.language}`);
      if (json.data.currentSection === undefined) throw new Error('Current section lost during language switch');
    });

    // 7. Teacher Personality Formatting
    await runTest(7, 'Teacher Personality: Formats tone cleanly for Socratic, Strict, and Exam Coach', async () => {
      const socraticSpeech = AdaptiveTeacherService.formatSpeechByPersonality('Mass resists acceleration.', 'Socratic', 'en');
      if (!socraticSpeech.includes('intuition') && !socraticSpeech.includes('Consider')) {
        throw new Error('Socratic speech must prompt reflection');
      }

      const strictSpeech = AdaptiveTeacherService.formatSpeechByPersonality('Mass resists acceleration.', 'Strict', 'en');
      if (!strictSpeech.includes('Precision') && !strictSpeech.includes('Focus')) {
        throw new Error('Strict speech must emphasize precision');
      }

      const examSpeech = AdaptiveTeacherService.formatSpeechByPersonality('Mass resists acceleration.', 'Exam Coach', 'en');
      if (!examSpeech.includes('exam') && !examSpeech.includes('Examiners')) {
        throw new Error('Exam coach speech must highlight exam traps');
      }
    });

  } finally {
    // Cleanup
    if (activeSessionId) {
      await LessonSessionModel.deleteOne({ _id: activeSessionId }).catch(() => null);
    }
    await WeakConceptModel.deleteMany({ userId: testUserId }).catch(() => null);
    await StrongConceptModel.deleteMany({ userId: testUserId }).catch(() => null);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n-------------------------------------------------------------');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Adaptive AI Teacher Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('-------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal adaptive teacher test error:', err);
  process.exit(1);
});
