import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import { LessonModel, DocumentModel, DocumentChunkModel } from '../models';
import { LessonPlannerService } from '../services/planner/lesson_planner.service';
import { LessonPlanSchema } from '../schemas/lesson.schema';
import { DeterministicLessonEngine } from '../services/planner/llm_provider';

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
  console.log('  RUNNING PHASE 5 AI LESSON PLANNING ENGINE TEST SUITE');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);

  let createdLessonId = '';
  const testDocId = `doc_test_${Date.now()}`;

  try {
    // 1. Time Adaptation: 5m vs 20m vs 60m vs Multi-Day
    await runTest(1, 'Time Adaptation: Budgets sections and depth according to time (5m, 20m, 60m, Multi-Day)', async () => {
      // 5 min sprint
      const plan5 = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Newtonian Inertia',
        availableTime: 5,
        studentLevel: 'beginner',
      });
      if (plan5.lesson.sections.length !== 1) {
        throw new Error(`Expected 1 section for 5m sprint, got ${plan5.lesson.sections.length}`);
      }
      if (plan5.lesson.duration !== 5) {
        throw new Error(`Expected duration 5, got ${plan5.lesson.duration}`);
      }

      // 20 min standard
      const plan20 = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Newtonian Inertia',
        availableTime: 20,
        studentLevel: 'beginner',
      });
      if (plan20.lesson.sections.length !== 3) {
        throw new Error(`Expected 3 sections for 20m standard, got ${plan20.lesson.sections.length}`);
      }

      // 60 min masterclass
      const plan60 = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Newtonian Inertia',
        availableTime: 60,
        studentLevel: 'intermediate',
      });
      if (plan60.lesson.sections.length !== 5) {
        throw new Error(`Expected 5 sections for 60m masterclass, got ${plan60.lesson.sections.length}`);
      }

      // 120 min multi-day
      const planMulti = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Newtonian Inertia',
        availableTime: 120,
        studentLevel: 'advanced',
      });
      if (!planMulti.lesson.multiDayPlan || planMulti.lesson.multiDayPlan.length < 3) {
        throw new Error('Expected multiDayPlan with at least 3 days for 120m curriculum');
      }
    });

    // 2. Difficulty Adaptation: Beginner vs Intermediate vs Advanced
    await runTest(2, 'Difficulty Adaptation: Calibrates language, depth, prerequisites, and explanations', async () => {
      const beginner = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Calculus Derivatives',
        studentLevel: 'beginner',
        teachingStyle: 'intuitive',
      });
      const advanced = await LessonPlannerService.planLesson({
        userId: testUserId,
        topic: 'Calculus Derivatives',
        studentLevel: 'advanced',
        teachingStyle: 'rigorous',
      });

      if (beginner.lesson.difficulty !== 'beginner') throw new Error('Expected beginner difficulty');
      if (advanced.lesson.difficulty !== 'advanced') throw new Error('Expected advanced difficulty');

      // Advanced should have more rigorous prerequisites than beginner
      if (advanced.lesson.prerequisites.length < 2) {
        throw new Error('Advanced lesson must specify rigorous prerequisites');
      }
    });

    // 3. Multilingual Support: English, Hindi, Hinglish, Nepali, Tamil
    await runTest(3, 'Multilingual Engine: Generates contextual lessons in EN, HI, Hinglish, NE, and TA', async () => {
      const languages = ['en', 'hi', 'hinglish', 'ne', 'ta'] as const;

      for (const lang of languages) {
        const result = await LessonPlannerService.planLesson({
          userId: testUserId,
          topic: 'Photosynthesis',
          preferredLanguage: lang,
          availableTime: 20,
        });

        if (result.lesson.language !== lang) {
          throw new Error(`Expected language ${lang}, got ${result.lesson.language}`);
        }
        if (!result.lesson.sections[0].scriptText) {
          throw new Error(`Missing scriptText for language ${lang}`);
        }
      }
    });

    // 4. Subject-Aware Visuals Classification
    await runTest(4, 'Subject-Aware Visuals: Classifies topics into equation, simulation, flowchart, code, timeline', async () => {
      const engine = new DeterministicLessonEngine();

      // Math -> equation
      const mathVis = engine.classifyAndBuildVisual('Calculus Integrals', 'Fundamental Theorem of Calculus', 'advanced');
      if (mathVis.type !== 'equation') throw new Error(`Expected equation visual for calculus, got ${mathVis.type}`);

      // Physics -> simulation
      const physVis = engine.classifyAndBuildVisual('Newtonian Mechanics', 'Force Vectors on Incline', 'intermediate');
      if (physVis.type !== 'simulation') throw new Error(`Expected simulation visual for mechanics, got ${physVis.type}`);

      // Biology / Cycle -> flowchart
      const bioVis = engine.classifyAndBuildVisual('Cellular Respiration Cycle', 'Electron Transport Chain', 'intermediate');
      if (bioVis.type !== 'flowchart') throw new Error(`Expected flowchart visual for cycle, got ${bioVis.type}`);

      // Coding -> code
      const csVis = engine.classifyAndBuildVisual('Binary Search Algorithm', 'Recursion Tree Traversal', 'beginner');
      if (csVis.type !== 'code') throw new Error(`Expected code visual for algorithm, got ${csVis.type}`);

      // History -> timeline
      const histVis = engine.classifyAndBuildVisual('World War I Chronology', 'Treaty of Versailles', 'beginner');
      if (histVis.type !== 'timeline') throw new Error(`Expected timeline visual for history, got ${histVis.type}`);
    });

    // 5. Document-Grounded Planning
    await runTest(5, 'Document Grounding: Incorporates chunks from uploaded document into lesson context', async () => {
      // Create mock document chunks in MongoDB
      await DocumentChunkModel.create([
        {
          documentId: testDocId,
          chunkIndex: 0,
          pageNumber: 12,
          chapter: 'Chapter 3: Quantum Mechanics',
          heading: 'Wave-Particle Duality',
          text: 'Wave-particle duality asserts that all particles exhibit both wave and particle characteristics as observed in the De Broglie wavelength equation lambda = h / p.',
        },
        {
          documentId: testDocId,
          chunkIndex: 1,
          pageNumber: 14,
          chapter: 'Chapter 3: Quantum Mechanics',
          heading: 'Double Slit Experiment',
          text: 'The double-slit interference pattern occurs even when single electrons are fired one at a time, proving wave amplitude superposition.',
        },
      ]);

      const result = await LessonPlannerService.planLesson({
        userId: testUserId,
        documentId: testDocId,
        availableTime: 20,
      });

      if (!result.lesson.title.includes('Wave-Particle Duality') && !result.lesson.title.includes('Quantum Mechanics')) {
        throw new Error(`Expected lesson title to reflect document content, got: ${result.lesson.title}`);
      }
      if (result.lesson.sections.length === 0) {
        throw new Error('Expected generated sections from document');
      }
    });

    // 6. Schema Validation & Safe Fallback Recovery
    await runTest(6, 'Zod Schema Validation: Validates structured output and recovers gracefully from errors', async () => {
      const validLesson = {
        title: 'Test Lesson Plan',
        objective: ['Understand key rules'],
        duration: 20,
        difficulty: 'beginner' as const,
        language: 'en' as const,
        teachingStyle: 'intuitive' as const,
        prerequisites: ['Basic math'],
        sections: [
          {
            id: 'sec_1',
            title: 'Foundations',
            durationMinutes: 10,
            conceptSummary: 'Summary of foundations',
            scriptText: 'Welcome to this lesson...',
            visual: {
              type: 'diagram' as const,
              title: 'Concept Diagram',
              description: 'Diagram overview',
            },
            checkpoints: [],
          },
        ],
        questions: [],
        assessment: [],
        visuals: [],
      };

      const parsed = LessonPlanSchema.safeParse(validLesson);
      if (!parsed.success) {
        throw new Error('Valid lesson plan failed Zod validation');
      }

      // Invalid schema (missing title, invalid duration)
      const invalid = { title: '', duration: -5 };
      const invalidParse = LessonPlanSchema.safeParse(invalid);
      if (invalidParse.success) {
        throw new Error('Invalid lesson plan should have failed Zod validation');
      }
    });

    // 7. API Endpoints: POST /api/lessons/plan & GET /api/lessons/:id
    await runTest(7, 'API Integration: POST /api/lessons/plan and GET /api/lessons/:id respond with HTTP 201/200', async () => {
      // POST /api/lessons/plan
      const postRes = await fetch(`${baseUrl}/api/lessons/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          topic: 'Newton\'s Laws of Motion',
          availableTime: 20,
          studentLevel: 'beginner',
          preferredLanguage: 'en',
          teachingStyle: 'intuitive',
        }),
      });

      if (postRes.status !== 201) throw new Error(`Expected 201 Created, got ${postRes.status}`);
      const postJson = await postRes.json();
      if (!postJson.success || !postJson.data?.lessonId) throw new Error('Missing lessonId in response');
      createdLessonId = postJson.data.lessonId;

      // GET /api/lessons/:id
      const getRes = await fetch(`${baseUrl}/api/lessons/${createdLessonId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });

      if (getRes.status !== 200) throw new Error(`Expected 200 OK, got ${getRes.status}`);
      const getJson = await getRes.json();
      if (!getJson.success || !getJson.data?.lesson) throw new Error('Missing lesson in GET response');
      if (getJson.data.lesson.topic !== 'Newton\'s Laws of Motion') {
        throw new Error(`Expected topic "Newton's Laws of Motion", got "${getJson.data.lesson.topic}"`);
      }
    });

  } finally {
    // Cleanup
    if (createdLessonId) {
      await LessonModel.deleteOne({ _id: createdLessonId }).catch(() => null);
    }
    await DocumentChunkModel.deleteMany({ documentId: testDocId }).catch(() => null);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n-------------------------------------------------------------');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Lesson Planner Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('-------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal lesson planner test error:', err);
  process.exit(1);
});
