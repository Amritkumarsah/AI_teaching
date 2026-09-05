import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import {
  LearningProgressModel,
  ConceptMasteryModel,
  WeakConceptModel,
  StrongConceptModel,
  AssessmentResultModel,
} from '../models';
import { LearningIntelligenceService } from '../services/analytics/learning_intelligence.service';

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
  console.log('   RUNNING PHASE 10 LEARNING PATH & ANALYTICS TEST SUITE     ');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'analytics_student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);

  try {
    // 1. Initial Dashboard State (Real DB Query)
    let initialStudyTime = 0;
    let initialLessonsCount = 0;

    await runTest(1, 'GET /api/analytics/dashboard fetches real database metrics', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Failed to fetch dashboard: ${JSON.stringify(json)}`);

      const d = json.data;
      if (d.totalStudyTimeMinutes === undefined || d.lessonsCompletedCount === undefined) {
        throw new Error('Missing core study time metrics');
      }
      if (!Array.isArray(d.topicMastery) || !Array.isArray(d.recommendations)) {
        throw new Error('Missing topicMastery or recommendations array');
      }

      initialStudyTime = d.totalStudyTimeMinutes;
      initialLessonsCount = d.lessonsCompletedCount;
    });

    // 2. Hierarchical Learning Path Generation (Course -> Module -> Lesson -> Practice -> Assessment)
    await runTest(2, 'POST /api/analytics/learning-path generates Machine Learning 7-module curriculum', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/learning-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          broadTopic: 'Machine Learning',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Learning path failed: ${JSON.stringify(json)}`);

      const path = json.data;
      if (!path.modules || path.modules.length < 7) {
        throw new Error(`Expected at least 7 modules for Machine Learning, got ${path.modules?.length}`);
      }

      // Verify specific modules
      const modTitles = path.modules.map((m: any) => m.title);
      if (!modTitles.some((t: string) => t.includes('Python'))) throw new Error('Missing Python module');
      if (!modTitles.some((t: string) => t.includes('Mathematics'))) throw new Error('Missing Mathematics module');
      if (!modTitles.some((t: string) => t.includes('Supervised'))) throw new Error('Missing Supervised Learning module');
      if (!modTitles.some((t: string) => t.includes('Neural Networks'))) throw new Error('Missing Neural Networks module');

      // Check lesson structure (lessons have practice problems count & duration)
      const firstMod = path.modules[0];
      if (!firstMod.lessons || firstMod.lessons.length === 0 || !firstMod.lessons[0].practiceProblemsCount) {
        throw new Error('Lesson missing practice problems count or steps');
      }
    });

    // 3. Intelligent Recommendation Engine
    await runTest(3, 'GET /api/analytics/recommendations generates Revise, Practice, Next Topic items', async () => {
      // Seed a weak concept into DB
      await WeakConceptModel.create({
        userId: testUserId,
        conceptName: "Ohm's Law & Internal Resistance",
        failureCount: 3,
        lastEncountered: new Date(),
        resolved: false,
      });

      const res = await fetch(`${baseUrl}/api/analytics/recommendations`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Recommendations failed: ${JSON.stringify(json)}`);

      const recs = json.data.recommendations;
      if (!recs || recs.length < 3) throw new Error(`Expected at least 3 recommendations, got ${recs?.length}`);

      const reviseRec = recs.find((r: any) => r.type === 'REVISE');
      const practiceRec = recs.find((r: any) => r.type === 'PRACTICE');
      const nextRec = recs.find((r: any) => r.type === 'NEXT_TOPIC');

      if (!reviseRec || !practiceRec || !nextRec) {
        throw new Error('Missing required recommendation types (REVISE, PRACTICE, NEXT_TOPIC)');
      }
      if (!reviseRec.conceptTarget.includes("Ohm's Law")) {
        throw new Error(`Expected revise recommendation to target weak concept, got ${reviseRec.conceptTarget}`);
      }
    });

    // 4. Record Lesson Completion & Verify Long-Term Learning Profile Tracking
    await runTest(4, 'POST /api/analytics/complete-lesson updates database records and mastery scores', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/complete-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          topic: "Newton's First Law (Inertia)",
          studyDurationMinutes: 30,
          score: 95,
          demonstratedConcepts: [
            { concept: "Newton's First Law (Inertia)", isCorrect: true },
            { concept: "Free-Body Force Vectors", isCorrect: true },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Complete lesson failed: ${JSON.stringify(json)}`);

      const updatedProgress = json.data.progress;
      if (updatedProgress.totalStudyTimeMinutes !== initialStudyTime + 30) {
        throw new Error(`Expected study time ${initialStudyTime + 30}, got ${updatedProgress.totalStudyTimeMinutes}`);
      }
      if (updatedProgress.lessonsCompletedCount !== initialLessonsCount + 1) {
        throw new Error(`Expected lessons count ${initialLessonsCount + 1}, got ${updatedProgress.lessonsCompletedCount}`);
      }

      // Check that concept mastery record was written in MongoDB
      const mastery = await ConceptMasteryModel.findOne({ userId: testUserId, concept: "Newton's First Law (Inertia)" });
      if (!mastery || mastery.masteryScore < 80) {
        throw new Error(`Expected mastery score >= 80, got ${mastery?.masteryScore}`);
      }
    });

    // 5. Verify Completing an Actual Lesson Changes Dashboard Analytics
    await runTest(5, 'VERIFY: Dashboard reflects changed analytics dynamically from database', async () => {
      const res = await fetch(`${baseUrl}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Dashboard re-fetch failed: ${JSON.stringify(json)}`);

      const d = json.data;
      if (d.totalStudyTimeMinutes <= initialStudyTime) {
        throw new Error(`Dashboard totalStudyTimeMinutes did not increase! Was ${initialStudyTime}, now ${d.totalStudyTimeMinutes}`);
      }
      if (d.lessonsCompletedCount <= initialLessonsCount) {
        throw new Error(`Dashboard lessonsCompletedCount did not increment! Was ${initialLessonsCount}, now ${d.lessonsCompletedCount}`);
      }

      // Verify topic mastery contains the newly updated concept
      const hasConcept = d.topicMastery.some((tm: any) => tm.topic.includes("Newton's First Law"));
      if (!hasConcept) {
        throw new Error('Dashboard topicMastery does not reflect newly updated concept');
      }

      console.log(`     -> Verified Dashboard Delta: Time (+30 min), Lessons (+1), Mastery reflected.`);
    });

  } finally {
    server.close();
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n=============================================================');
  console.log('                 PHASE 10 TEST RESULTS SUMMARY               ');
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
  console.error('Fatal error in analytics test runner:', err);
  process.exit(1);
});
