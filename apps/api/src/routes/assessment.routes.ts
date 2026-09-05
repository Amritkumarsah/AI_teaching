import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { AssessmentEngineService } from '../services/assessment_engine';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const assessmentRouter = Router();

// Middleware: extract token if provided, fallback to demo student
assessmentRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  (req as any).user = { userId: 'demo_student_2026', role: 'STUDENT' };
  next();
});

/**
 * 1. POST /api/assessment/generate
 * Generates an adaptive assessment with all 6 question types
 */
assessmentRouter.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { lessonId, topic, difficulty, weakConcepts } = req.body;

    const result = await AssessmentEngineService.generateAssessment({
      lessonId: lessonId || 'lesson_default_001',
      userId,
      topic,
      difficulty,
      weakConcepts,
    });

    return sendSuccess(res, result, 'Adaptive assessment generated successfully.', 201);
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 2. POST /api/assessment/submit
 * Evaluates actual student answers dynamically (calculates score, accuracy, concept mastery, weak/strong areas)
 */
assessmentRouter.post('/submit', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { assessmentId, lessonId, answers, userAnswers } = req.body;

    // Accept answers or userAnswers
    const submittedAnswers = answers || userAnswers || [];

    if (!Array.isArray(submittedAnswers) || submittedAnswers.length === 0) {
      return sendError(
        res,
        new AppError('At least one submitted answer is required for assessment evaluation.', 400, 'ANSWERS_REQUIRED')
      );
    }

    const normalizedAnswers = submittedAnswers.map((ans: any, idx: number) => ({
      questionId: ans.questionId || ans.id || `q_${idx}`,
      submittedAnswer: ans.submittedAnswer || ans.studentAnswer || ans.answer || ans.text || '',
      concept: ans.concept,
    }));

    const result = await AssessmentEngineService.submitAssessment({
      assessmentId,
      lessonId: lessonId || 'lesson_default_001',
      userId,
      answers: normalizedAnswers,
    });

    return sendSuccess(res, result, 'Assessment graded successfully.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 3. GET /api/assessment/:id/results
 * Fetches stored assessment result and comprehensive learning report
 */
assessmentRouter.get('/:id/results', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const resultId = req.params.id;

    const result = await AssessmentEngineService.getAssessmentResult(resultId, userId);
    return sendSuccess(res, { result });
  } catch (err: any) {
    return sendError(res, err);
  }
});
