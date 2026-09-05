import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import {
  AssessmentModel,
  AssessmentResultModel,
  QuestionModel,
  AnswerModel,
  ConceptMasteryModel,
  WeakConceptModel,
} from '../models';
import { AssessmentEngineService } from '../services/assessment_engine';

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
  console.log('  RUNNING PHASE 7 ASSESSMENT & LEARNING FEEDBACK TEST SUITE');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);
  const testLessonId = `lesson_test_${Date.now()}`;

  let generatedAssessmentId = '';
  let generatedQuestions: any[] = [];
  let submittedResultId = '';

  try {
    // 1. Question Types Generation
    await runTest(1, 'POST /api/assessment/generate produces all 6 question types (MCQ, Short answer, Conceptual, Application, Problem solving, Explain in own words)', async () => {
      const res = await fetch(`${baseUrl}/api/assessment/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          lessonId: testLessonId,
          topic: "Newton's Laws of Motion",
          difficulty: 'beginner',
        }),
      });

      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data?.questions) throw new Error('Missing questions in response');

      generatedAssessmentId = json.data.assessmentId;
      generatedQuestions = json.data.questions;

      const types = generatedQuestions.map((q: any) => q.type);
      const requiredTypes = ['MCQ', 'SHORT_ANSWER', 'CONCEPTUAL', 'APPLICATION', 'PROBLEM_SOLVING', 'EXPLAIN_IN_OWN_WORDS'];

      for (const reqType of requiredTypes) {
        if (!types.includes(reqType)) {
          throw new Error(`Generated assessment missing required question type: ${reqType}`);
        }
      }
    });

    // 2. Adaptive Difficulty
    await runTest(2, 'Adaptive Difficulty: Calibrates question formulations and derivations based on difficulty parameter', async () => {
      const advancedRes = await fetch(`${baseUrl}/api/assessment/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify({
          lessonId: testLessonId,
          topic: "Newton's Laws of Motion",
          difficulty: 'advanced',
        }),
      });
      const advancedJson = await advancedRes.json();
      const probSolving = advancedJson.data.questions.find((q: any) => q.type === 'PROBLEM_SOLVING');

      if (!probSolving || !probSolving.prompt.includes('rocket') && !probSolving.prompt.includes('thrust')) {
        throw new Error('Advanced difficulty must generate multi-step problem solving prompt');
      }
    });

    // 3. Question Evaluation Engine: Correct, Incorrect, and Partial Answers
    await runTest(3, 'Evaluation Engine: Accurately scores correct answers (10/10), incorrect answers (0-2/10), and partial answers (4-8/10)', async () => {
      // 3a. MCQ Correct vs Incorrect
      const mcqQ = generatedQuestions.find((q: any) => q.type === 'MCQ');
      const mcqCorrect = AssessmentEngineService.evaluateAnswer(mcqQ, mcqQ.correctAnswer);
      if (!mcqCorrect.isCorrect || mcqCorrect.score !== 10) throw new Error('MCQ correct answer failed to receive 10/10');

      const mcqIncorrect = AssessmentEngineService.evaluateAnswer(mcqQ, 'The exhaustion of internal kinetic momentum');
      if (mcqIncorrect.isCorrect || mcqIncorrect.score > 3 || !mcqIncorrect.hasMisconception) {
        throw new Error('MCQ incorrect answer with trap must be scored <= 3 and flag misconception');
      }

      // 3b. Problem Solving: Full Credit vs Partial Credit
      const probQ = generatedQuestions.find((q: any) => q.type === 'PROBLEM_SOLVING');
      const probFull = AssessmentEngineService.evaluateAnswer(probQ, '3 m/s²');
      if (!probFull.isCorrect || probFull.score !== 10) throw new Error('Problem solving correct value failed to receive 10/10');

      // Partial credit: Formula given without complete number
      const probPartial = AssessmentEngineService.evaluateAnswer(probQ, 'I know that a = F/m, but I forgot the final number');
      if (probPartial.score < 4 || probPartial.score > 7 || probPartial.isCorrect) {
        throw new Error(`Problem solving partial formula must receive 4-7 partial credit, got ${probPartial.score}`);
      }

      // 3c. Application: Partial Credit
      const appQ = generatedQuestions.find((q: any) => q.type === 'APPLICATION');
      const appPartial = AssessmentEngineService.evaluateAnswer(appQ, 'The car has less mass');
      if (appPartial.score < 5) {
        throw new Error(`Application partial answer should receive partial credit >= 5, got ${appPartial.score}`);
      }

      // 3d. Explain in Own Words: Full Credit
      const expQ = generatedQuestions.find((q: any) => q.type === 'EXPLAIN_IN_OWN_WORDS');
      const expFull = AssessmentEngineService.evaluateAnswer(expQ, 'Because of inertia, passengers were already moving forward with the bus, and their bodies continue forward until the seatbelt stops them.');
      if (!expFull.isCorrect || expFull.score !== 10) throw new Error('Explain in own words thorough explanation failed to receive 10/10');
    });

    // 4. Dynamic Final Assessment Scoring (NO hardcoded scores!)
    await runTest(4, 'POST /api/assessment/submit dynamically calculates score, accuracy, and concept mastery from actual student answers', async () => {
      const qMcq = generatedQuestions.find((q: any) => q.type === 'MCQ');
      const qSa = generatedQuestions.find((q: any) => q.type === 'SHORT_ANSWER');
      const qConc = generatedQuestions.find((q: any) => q.type === 'CONCEPTUAL');
      const qProb = generatedQuestions.find((q: any) => q.type === 'PROBLEM_SOLVING');
      const qExp = generatedQuestions.find((q: any) => q.type === 'EXPLAIN_IN_OWN_WORDS');

      // Student submits a realistic mix:
      // - MCQ: Correct (10)
      // - Short Answer: Full (10)
      // - Conceptual: Misconception trap (3)
      // - Problem Solving: Partial (5)
      // - Explain: Full (10)
      const submitPayload = {
        assessmentId: generatedAssessmentId,
        lessonId: testLessonId,
        answers: [
          { questionId: qMcq.id, submittedAnswer: qMcq.correctAnswer, concept: 'The Principle of Inertia' },
          { questionId: qSa.id, submittedAnswer: 'F = m * a', concept: 'Force, Mass & Acceleration' },
          { questionId: qConc.id, submittedAnswer: 'They cancel each other out over time', concept: 'Action-Reaction Interaction' },
          { questionId: qProb.id, submittedAnswer: 'Formula is a = F/m', concept: 'Force, Mass & Acceleration' },
          { questionId: qExp.id, submittedAnswer: 'Inertia causes the passenger bodies already moving forward to keep moving until seatbelts act.', concept: 'The Principle of Inertia' },
        ],
      };

      const res = await fetch(`${baseUrl}/api/assessment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
        body: JSON.stringify(submitPayload),
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data?.result) throw new Error('Missing result in submit response');

      const result = json.data.result;
      submittedResultId = result._id;

      // Expected total: 10 + 10 + 3 + 5 + 10 = 38 out of 50
      if (result.totalScore !== 38) {
        throw new Error(`Expected calculated total score 38, got ${result.totalScore}`);
      }
      if (result.maxScore !== 50) {
        throw new Error(`Expected max score 50, got ${result.maxScore}`);
      }
      if (result.percentage !== 76) {
        throw new Error(`Expected calculated percentage 76%, got ${result.percentage}%`);
      }
      if (result.accuracy !== 60) {
        // 3 out of 5 were fully correct (60%)
        throw new Error(`Expected calculated accuracy 60%, got ${result.accuracy}%`);
      }
    });

    // 5. Learning Report Generation & Recommendations
    await runTest(5, 'GET /api/assessment/:id/results returns complete Learning Report with strengths, weak areas, and revision recommendations', async () => {
      const res = await fetch(`${baseUrl}/api/assessment/${submittedResultId}/results`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });

      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      const json = await res.json();
      if (!json.success || !json.data?.result) throw new Error('Missing result in GET response');

      const result = json.data.result;

      // Report sections
      if (!result.strongConcepts || result.strongConcepts.length === 0) {
        throw new Error('Learning Report missing identified strong concepts');
      }
      if (!result.weakConcepts || result.weakConcepts.length === 0) {
        throw new Error('Learning Report missing identified weak concepts');
      }
      if (!result.recommendedRevisionTopics || result.recommendedRevisionTopics.length === 0) {
        throw new Error('Learning Report missing recommended revision topics');
      }
      if (!result.recommendedPractice || result.recommendedPractice.length === 0) {
        throw new Error('Learning Report missing recommended practice tasks');
      }
      if (!result.nextSuggestedTopic) {
        throw new Error('Learning Report missing next suggested topic');
      }
    });

    // 6. Database Storage Verification
    await runTest(6, 'Database Verification: Questions, answers, assessments, assessment_results, and concept_mastery are persisted in MongoDB', async () => {
      // 1. Questions stored
      const qCount = await QuestionModel.countDocuments({ id: { $in: generatedQuestions.map((q) => q.id) } });
      if (qCount === 0) throw new Error('Questions were not stored in MongoDB');

      // 2. Answers stored
      const aCount = await AnswerModel.countDocuments({ userId: testUserId });
      if (aCount === 0) throw new Error('Submitted answers were not stored in AnswerModel');

      // 3. Assessment stored
      const asmtDoc = await AssessmentModel.findById(generatedAssessmentId);
      if (!asmtDoc) throw new Error('Assessment was not stored in AssessmentModel');

      // 4. AssessmentResult stored
      const resDoc = await AssessmentResultModel.findById(submittedResultId);
      if (!resDoc) throw new Error('AssessmentResult was not stored in AssessmentResultModel');

      // 5. ConceptMastery stored
      const masteryDocs = await ConceptMasteryModel.find({ userId: testUserId });
      if (masteryDocs.length === 0) throw new Error('Concept mastery was not stored in ConceptMasteryModel');
    });

  } finally {
    // Cleanup
    if (generatedAssessmentId) {
      await AssessmentModel.deleteOne({ _id: generatedAssessmentId }).catch(() => null);
    }
    if (submittedResultId) {
      await AssessmentResultModel.deleteOne({ _id: submittedResultId }).catch(() => null);
    }
    await AnswerModel.deleteMany({ userId: testUserId }).catch(() => null);
    await ConceptMasteryModel.deleteMany({ userId: testUserId }).catch(() => null);
    await WeakConceptModel.deleteMany({ userId: testUserId }).catch(() => null);
    if (generatedQuestions.length > 0) {
      await QuestionModel.deleteMany({ id: { $in: generatedQuestions.map((q) => q.id) } }).catch(() => null);
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  // Summary
  console.log('\n-------------------------------------------------------------');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  Assessment & Feedback Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log('-------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal assessment test error:', err);
  process.exit(1);
});
