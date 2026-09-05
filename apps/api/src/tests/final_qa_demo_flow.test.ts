import http from 'http';
import mongoose from 'mongoose';
import { app } from '../server';
import { connectDB } from '../config/database';
import {
  UserModel,
  StudentProfileModel,
  DocumentModel,
  DocumentChunkModel,
  LessonModel,
  LessonSessionModel,
  AssessmentModel,
  ConceptMasteryModel,
  VideoJobModel,
} from '../models';

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const steps: StepResult[] = [];

async function runStep(step: number, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    steps.push({ step, name, passed: true, durationMs: duration });
    console.log(`  ✓ [Step ${step}] ${name} (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    steps.push({ step, name, passed: false, durationMs: duration, error: err.message || String(err) });
    console.error(`  ✗ [Step ${step}] ${name} (${duration}ms): ${err.message}`);
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('    PHASE 13: FINAL COMPREHENSIVE QA & DEMO FLOW AUDIT      ');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const timestamp = Date.now();
  const studentEmail = `qa_fresh_${timestamp}@aiteacher.io`;
  const studentPassword = 'SecurePassword123!';
  
  let authToken = '';
  let studentId = '';
  let documentId = '';
  let lessonId = '';
  let sessionId = '';
  let assessmentId = '';
  let videoJobId = '';

  try {
    // Step 1: Landing Page & Health Diagnostic
    await runStep(1, 'Landing Page & Diagnostic Health API (/api/health)', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (!json.success || json.database?.status !== 'connected') {
        throw new Error('Database is not connected in health response');
      }
    });

    // Step 2: Fresh Account Signup
    await runStep(2, 'Fresh Student Account Registration (/api/auth/register)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: studentEmail,
          password: studentPassword,
          role: 'STUDENT',
        }),
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data.token) throw new Error('Token missing in registration');
      studentId = json.data.user._id || json.data.user.id;
    });

    // Step 3: Login
    await runStep(3, 'Student Authentication & JWT Issuance (/api/auth/login)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      authToken = json.data.token;
      if (!authToken) throw new Error('Auth token missing from login');
    });

    // Step 4: Student Onboarding Preferences
    await runStep(4, 'Student Onboarding & Cognitive Profile Setup (/api/user/onboarding)', async () => {
      const res = await fetch(`${baseUrl}/api/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          educationLevel: 'undergraduate',
          preferredLanguage: 'en',
          learningGoal: 'concept_mastery',
          teachingStyle: 'intuitive',
          availableStudyTimeMinutes: 20,
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      const profile = json.data.profile || json.data;
      if (profile.teachingStyle !== 'intuitive') throw new Error('Profile preferences mismatch');
    });

    // Step 5 & 6: Upload Educational Material & Document Processing
    await runStep(5, 'Upload Educational Study Material (/api/documents/upload)', async () => {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const fileContent = [
        'Chapter 1: Newton\'s Laws of Motion',
        'Section 1.1: The Law of Inertia',
        'An object at rest stays at rest, and an object in motion continues in motion with the same speed and direction unless acted upon by an unbalanced external force.',
        'Common misconception: Sliding objects stop because continuous force is required to sustain velocity. In reality, contact friction is an external opposing force.',
      ].join('\n');

      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="newton_physics.txt"',
        'Content-Type: text/plain',
        '',
        fileContent,
        `--${boundary}--`,
      ].join('\r\n');

      const res = await fetch(`${baseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (res.status !== 201 && res.status !== 202) throw new Error(`Expected 201/202, got ${res.status}`);
      const json = await res.json();
      documentId = json.data.documentId || json.data.document?._id;
      if (!documentId) throw new Error('Document ID missing');
    });

    await runStep(6, 'Document Processing & RAG Grounded Retrieval (/api/documents/query)', async () => {
      // Allow background worker to complete extraction & indexing
      for (let attempt = 0; attempt < 15; attempt++) {
        const statusRes = await fetch(`${baseUrl}/api/documents/${documentId}/status`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const statusJson = await statusRes.json();
        if (statusJson.data?.status === 'COMPLETED' || (statusJson.data?.chunksCount && statusJson.data.chunksCount > 0)) {
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      const res = await fetch(`${baseUrl}/api/documents/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: 'What stops sliding objects according to Newton?',
          documentId,
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (!json.data.chunks || json.data.chunks.length === 0) {
        throw new Error('RAG chunks were not extracted');
      }
    });

    // Step 7: Select Learning Preferences & Generate Lesson
    await runStep(7, 'Generate Pedagogical Lesson Plan (/api/lessons/generate)', async () => {
      const res = await fetch(`${baseUrl}/api/lessons/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: "Newton's First Law & The Concept of Inertia",
          documentId,
          targetDurationMinutes: 20,
          difficulty: 'beginner',
          language: 'en',
          teachingStyle: 'intuitive',
        }),
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      const json = await res.json();
      lessonId = json.data.lessonId || json.data.lesson?._id || json.data.lesson?.id;
      if (!lessonId) throw new Error('Lesson ID missing');
    });

    // Step 8: AI Teaching Video Generation
    await runStep(8, 'Queue AI Teaching Video & Poll Job (/api/video/render)', async () => {
      const res = await fetch(`${baseUrl}/api/video/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ lessonId }),
      });
      if (res.status !== 202 && res.status !== 201) throw new Error(`Expected 202/201, got ${res.status}`);
      const json = await res.json();
      videoJobId = json.data.jobId;
      if (!videoJobId) throw new Error('Video Job ID missing');

      const pollRes = await fetch(`${baseUrl}/api/video/jobs/${videoJobId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (pollRes.status !== 200) throw new Error(`Expected 200, got ${pollRes.status}`);
    });

    // Step 9: Initialize AI Teacher Interaction Session
    await runStep(9, 'Initialize AI Teacher Interactive State Machine (/api/teaching/start)', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ lessonId }),
      });
      if (res.status !== 200 && res.status !== 201) throw new Error(`Expected 200/201, got ${res.status}`);
      const json = await res.json();
      sessionId = json.data.sessionId || json.data.session?._id || json.data.session?.id;
      if (!sessionId) throw new Error('Teaching session ID missing');
      const state = json.data.state || json.data.session?.state;
      if (state !== 'INTRODUCTION' && state !== 'EXPLANATION') {
        throw new Error(`Expected state INTRODUCTION/EXPLANATION, got ${state}`);
      }
    });

    // Step 10: Student Spontaneous Question
    await runStep(10, 'Student Spontaneous Question in Classroom (/api/teaching/ask)', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          question: 'Why do objects need an unbalanced force to change motion?',
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (!json.data.explanation) throw new Error('Teacher explanation missing');
    });

    // Step 11, 12, 13: Student Checkpoint Answer, Misconception Detection & Adaptive Remediation
    await runStep(11, 'Student Answer: Aristotelian Misconception (/api/teaching/respond)', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          studentAnswer: 'The box stops because when you stop pushing it, there is no force left to sustain the velocity.',
          isVoice: false,
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      
      // Verify Step 12 & 13: Misconception Detection or Remediation State
      const state = json.data.state || json.data.session?.state;
      const evaluation = json.data.evaluation || json.data;
      if (!evaluation.diagnosedMisconception && state !== 'REMEDIATION') {
        throw new Error(`Expected misconception or REMEDIATION state, got ${state}`);
      }
    });

    // Step 14 & 15: Second Question & Adaptive Transition
    await runStep(14, 'Second Question: Correct Answer & Advance Concept (/api/teaching/respond)', async () => {
      const res = await fetch(`${baseUrl}/api/teaching/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          sessionId,
          studentAnswer: 'Friction is the external opposing force that slows it down. Without friction it would keep moving with constant speed forever.',
          isVoice: false,
        }),
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      const nextState = json.data.state || json.data.session?.state;
      if (!['NEXT_CONCEPT', 'EXPLANATION', 'FINAL_REVIEW', 'DEMONSTRATION', 'CHECK_UNDERSTANDING'].includes(nextState)) {
        throw new Error(`Expected advance to a forward state, got ${nextState}`);
      }
    });

    // Step 16 & 17: Final Assessment Generation & Multi-Dimensional Grading
    await runStep(15, 'Generate Comprehensive Final Assessment (/api/assessment/generate)', async () => {
      const res = await fetch(`${baseUrl}/api/assessment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ lessonId }),
      });
      if (res.status !== 201 && res.status !== 200) throw new Error(`Expected 201, got ${res.status}`);
      const json = await res.json();
      assessmentId = json.data.assessmentId || json.data.assessment?._id || json.data._id;
      if (!assessmentId) throw new Error('Assessment ID missing');
    });

    let resultId = '';
    await runStep(16, 'Submit Assessment & Multi-Dimensional Grading (/api/assessment/submit)', async () => {
      const submitRes = await fetch(`${baseUrl}/api/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          lessonId,
          answers: [
            { questionId: 'q1', studentAnswer: 'Inertia maintains uniform motion.' },
            { questionId: 'q2', studentAnswer: 'Friction is the opposing contact force.' },
          ],
        }),
      });
      if (submitRes.status !== 200) throw new Error(`Expected 200, got ${submitRes.status}`);
      const json = await submitRes.json();
      resultId = json.data._id || json.data.result?._id || json.data.id;
      if (!resultId) throw new Error('Result ID missing from assessment submit');
    });

    // Step 18: Learning Report & Weak Concepts
    await runStep(17, 'Generate Learning Report & Extract Weak Concepts (/api/assessment/:id/results)', async () => {
      const res = await fetch(`${baseUrl}/api/assessment/${resultId}/results`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      const report = json.data.result || json.data;
      if (report.accuracy === undefined && report.percentage === undefined) {
        throw new Error('Accuracy/percentage missing from report');
      }
    });

    // Step 19: Recommended Revision & Curriculum Intelligence
    await runStep(18, 'Generate Personalized Recommendations & Curriculum Tree', async () => {
      const recRes = await fetch(`${baseUrl}/api/analytics/recommendations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (recRes.status !== 200) throw new Error(`Expected 200, got ${recRes.status}`);
      
      const currRes = await fetch(`${baseUrl}/api/analytics/curriculum?topic=Physics`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (currRes.status !== 200) throw new Error(`Expected 200, got ${currRes.status}`);
    });

    // Step 20: Learning Dashboard Telemetry
    await runStep(19, 'Fetch Student Dashboard Telemetry & Mastery Radar (/api/analytics/profile)', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (!json.data.masteryRadar) throw new Error('Mastery radar missing');
    });

  } finally {
    // Teardown server
    await new Promise<void>((resolve) => server.close(() => resolve()));

    // Allow background jobs (like mock video rendering) to complete before deleting records
    await new Promise((r) => setTimeout(r, 600));

    // Cleanup test artifacts from database
    if (studentId) {
      await UserModel.deleteOne({ _id: studentId });
      await StudentProfileModel.deleteOne({ userId: studentId });
      await DocumentModel.deleteMany({ userId: studentId });
      await DocumentChunkModel.deleteMany({ documentId });
      await LessonModel.deleteMany({ userId: studentId });
      await LessonSessionModel.deleteMany({ userId: studentId });
      await AssessmentModel.deleteMany({ userId: studentId });
      await ConceptMasteryModel.deleteMany({ userId: studentId });
      await VideoJobModel.deleteMany({ userId: studentId });
    }

    await mongoose.disconnect();
  }

  console.log('\n=============================================================');
  const failed = steps.filter((s) => !s.passed);
  if (failed.length === 0) {
    console.log(`✓ ALL ${steps.length} DEMO & QA WORKFLOW STEPS PASSED SUCCESSFULLY!`);
  } else {
    console.error(`✗ ${failed.length} OF ${steps.length} STEPS FAILED:`);
    failed.forEach((f) => console.error(`  - Step ${f.step} (${f.name}): ${f.error}`));
    process.exit(1);
  }
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
