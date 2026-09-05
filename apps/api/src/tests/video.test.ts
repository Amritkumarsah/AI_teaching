import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import { VideoJobModel, LessonModel } from '../models';
import { VideoRenderer } from '../services/video/video_renderer';
import { ScenePlanner } from '../services/video/scene_planner';
import { SubjectAwareVisualGenerator } from '../services/video/visual_generator';
import { FallbackAvatarProvider, PremiumAvatarProvider } from '../services/video/avatar_provider';

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
  console.log('    RUNNING PHASE 9 AI TEACHING VIDEO & AVATAR TEST SUITE    ');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'video_student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);

  try {
    // 0. API Discovery & Exact Keys Verification
    await runTest(0, 'GET /api/video/discovery discloses required keys, pricing & free alternatives', async () => {
      const res = await fetch(`${baseUrl}/api/video/discovery`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Discovery failed: ${JSON.stringify(json)}`);
      
      const { avatarApi, ttsApi, visualApi, videoApi } = json.data;
      if (!avatarApi || !ttsApi || !visualApi || !videoApi) {
        throw new Error('Incomplete discovery metadata returned');
      }

      if (!avatarApi.requiredKey.includes('HEYGEN_API_KEY') && !avatarApi.requiredKey.includes('DID_API_KEY')) {
        throw new Error('Avatar API must explicitly declare HEYGEN_API_KEY / DID_API_KEY');
      }
      if (!avatarApi.freeAlternative) throw new Error('Missing free alternative for avatar');
      if (!ttsApi.freeAlternative) throw new Error('Missing free alternative for TTS');
      if (!visualApi.freeAlternative) throw new Error('Missing free alternative for visuals');
    });

    // 1. Scene Planner Decomposition Test
    await runTest(1, 'ScenePlanner breaks lesson into 8 rich pedagogical scenes with scripts & visuals', async () => {
      const scenes = await ScenePlanner.planScenes({
        topic: "Newton's First Law of Motion",
        subject: 'physics',
        language: 'en',
      });

      if (!scenes || scenes.length !== 8) {
        throw new Error(`Expected 8 scenes, got ${scenes?.length}`);
      }

      const expectedTypes = ['INTRO', 'EXPLANATION', 'DIAGRAM', 'EQUATION', 'CODE', 'EXAMPLE', 'QUESTION', 'SUMMARY'];
      expectedTypes.forEach((type, idx) => {
        if (scenes[idx].type !== type) {
          throw new Error(`Scene index ${idx} expected ${type}, got ${scenes[idx].type}`);
        }
        if (!scenes[idx].script || scenes[idx].script.length < 15) {
          throw new Error(`Scene ${type} has empty or trivial script`);
        }
        if (!scenes[idx].visual || !scenes[idx].visual.svgData && !scenes[idx].visual.codeSnippet) {
          throw new Error(`Scene ${type} missing educational visual content`);
        }
      });
    });

    // 2. Subject-Aware Visuals: Mathematics, Physics, Biology, History, Programming
    await runTest(2, 'SubjectAwareVisualGenerator produces specialized diagrams across all 5 disciplines', async () => {
      // Mathematics: Equations + Curves
      const mathVis = SubjectAwareVisualGenerator.generateVisualForScene('EQUATION', 'math', 'Differential Calculus', 'Derivatives');
      if (!mathVis.latexFormula || !mathVis.graphPoints || !mathVis.svgData) {
        throw new Error('Math visual missing LaTeX equation or graph');
      }

      // Physics: Force vectors & formulas
      const physVis = SubjectAwareVisualGenerator.generateVisualForScene('DIAGRAM', 'physics', "Newton's Laws", 'Inertia');
      if (!physVis.svgData?.includes('F_N') || !physVis.diagramElements) {
        throw new Error('Physics visual missing force vectors or free body diagram');
      }

      // Biology: Labeled anatomical structures
      const bioVis = SubjectAwareVisualGenerator.generateVisualForScene('DIAGRAM', 'biology', 'Cellular Respiration', 'Organelles');
      if (!bioVis.labeledStructures || bioVis.labeledStructures.length < 3) {
        throw new Error('Biology visual missing labeled cellular structures');
      }

      // History: Timeline & Map
      const histVis = SubjectAwareVisualGenerator.generateVisualForScene('EXPLANATION', 'history', 'Scientific Revolution', 'Milestones');
      if (!histVis.timelineEvents || histVis.timelineEvents.length < 3) {
        throw new Error('History visual missing chronological timeline events');
      }

      // Programming: Code + Execution output
      const progVis = SubjectAwareVisualGenerator.generateVisualForScene('CODE', 'programming', 'Object Oriented Python', 'Simulation');
      if (!progVis.codeSnippet || !progVis.executionOutput) {
        throw new Error('Programming visual missing code snippet or execution output');
      }
    });

    // 3. Fallback Avatar Provider & Viseme-Speaking Animation
    await runTest(3, 'FallbackAvatarProvider generates viseme-synced animated avatar with zero API key', async () => {
      const fallback = new FallbackAvatarProvider();
      const mockScene = {
        sceneId: 'test_sc_1',
        sceneIndex: 1,
        type: 'EXPLANATION' as const,
        duration: 15,
        script: 'Inertia maintains constant velocity.',
        visual: {} as any,
        avatar: {
          provider: 'fallback' as const,
          pose: 'pointing_board' as const,
          facialExpression: 'encouraging' as const,
          speakingAnimation: true,
        },
        voice: {} as any,
        textOverlay: { headline: 'Test', bulletPoints: [] },
      };

      const result = await fallback.generateAvatar(mockScene, { pose: 'pointing_board' });
      if (!result.isFallback || !result.avatarUrl) {
        throw new Error('Fallback avatar failed to render SVG data URL');
      }
      if (!result.avatarUrl.startsWith('data:image/svg+xml')) {
        throw new Error('Avatar should render as high-resolution SVG data URI');
      }
    });

    // 4. Asynchronous Video Generation Job Flow (POST -> QUEUED -> PROCESSING -> COMPLETED)
    let generatedJobId = '';
    await runTest(4, 'POST /api/video/generate enqueues asynchronous video job returning jobId', async () => {
      const res = await fetch(`${baseUrl}/api/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          topic: "Newton's First Law of Motion",
          subject: 'physics',
        }),
      });

      const json = await res.json();
      if (res.status !== 201 || !json.success) {
        throw new Error(`Failed to enqueue video job: ${JSON.stringify(json)}`);
      }

      generatedJobId = json.data.jobId;
      if (!generatedJobId) throw new Error('Missing jobId in response');
      if (json.data.status !== 'QUEUED') {
        throw new Error(`Expected initial status QUEUED, got ${json.data.status}`);
      }
    });

    // 5. Polling Asynchronous Video Job Completion & Stage Progression
    await runTest(5, 'GET /api/video/jobs/:id polls stages and completes video synthesis', async () => {
      if (!generatedJobId) throw new Error('No active generatedJobId to test');

      let completedJob: any = null;
      // Poll until completed or timeout
      for (let attempt = 0; attempt < 30; attempt++) {
        const res = await fetch(`${baseUrl}/api/video/jobs/${generatedJobId}`, {
          headers: { Authorization: `Bearer ${testToken}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(`Polling failed: ${JSON.stringify(json)}`);

        const job = json.data;
        if (job.status === 'COMPLETED') {
          completedJob = job;
          break;
        }

        if (job.status === 'FAILED') {
          throw new Error(`Job failed unexpectedly: ${job.errorMessage}`);
        }

        await new Promise((r) => setTimeout(r, 60));
      }

      if (!completedJob) {
        throw new Error('Video job timed out before reaching COMPLETED status');
      }

      if (!completedJob.outputVideoUrl) throw new Error('Completed job missing outputVideoUrl');
      if (!completedJob.scenes || completedJob.scenes.length !== 8) {
        throw new Error(`Expected 8 rendered scenes in video job, got ${completedJob.scenes?.length}`);
      }
      if (!completedJob.lessonSources || completedJob.lessonSources.length === 0) {
        throw new Error('Missing lesson sources in completed video');
      }
    });

    // 6. Download Video Endpoint
    await runTest(6, 'GET /api/video/jobs/:id/download provides video artifact download stream', async () => {
      const res = await fetch(`${baseUrl}/api/video/jobs/${generatedJobId}/download`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      if (!res.ok) throw new Error(`Download failed with HTTP ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('video/mp4')) {
        throw new Error(`Expected video/mp4 content type, got: ${contentType}`);
      }
    });

  } finally {
    server.close();
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n=============================================================');
  console.log('                 PHASE 9 TEST RESULTS SUMMARY                ');
  console.log('=============================================================');
  const totalPassed = results.filter((r) => r.passed).length;
  results.forEach((r) => {
    console.log(`${r.passed ? '✓' : '✗'} [Test ${r.id}] ${r.name} (${r.durationMs}ms)`);
    if (!r.passed && r.message) {
      console.log(`    Error: ${r.message}`);
    }
  });
  console.log('-------------------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${totalPassed} | Failed: ${results.length - totalPassed}`);
  console.log('=============================================================\n');

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in video test runner:', err);
  process.exit(1);
});
