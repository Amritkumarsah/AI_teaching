import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { AdaptiveTeacherService } from '../services/teaching/adaptive_teacher.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

import { LessonSessionModel } from '../models';

export const teachingRouter = Router();

// Middleware: extract token if provided or fallback to demo student
teachingRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  (req as any).user = { userId: 'demo_student_2026', role: 'STUDENT' };
  next();
});

/**
 * 1. POST /api/teaching/start
 * Initializes a new adaptive teaching session
 */
teachingRouter.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { lessonId, topic, personality, language, difficulty } = req.body;

    const result = await AdaptiveTeacherService.startSession({
      userId,
      lessonId,
      topic,
      personality,
      language,
      difficulty,
    });

    return sendSuccess(res, result, 'Teaching session started successfully.', 201);
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 2. POST /api/teaching/respond
 * Student responds to a checkpoint question (text or voice)
 * Evaluates answer, diagnoses misconceptions, and adapts
 */
teachingRouter.post('/respond', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId, studentAnswer, answer, isVoice } = req.body;
    const effectiveAnswer = studentAnswer !== undefined ? studentAnswer : answer;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required to submit a response.', 400, 'SESSION_ID_REQUIRED'));
    }
    if (effectiveAnswer === undefined || effectiveAnswer === null || String(effectiveAnswer).trim() === '') {
      return sendError(res, new AppError('studentAnswer must not be empty.', 400, 'ANSWER_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.respondToQuestion({
      sessionId,
      userId,
      studentAnswer: String(effectiveAnswer),
      isVoice: Boolean(isVoice),
    });

    return sendSuccess(res, result, 'Student response evaluated and teacher adapted.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
  * POST /api/teaching/ask
  * Allows student to ask a spontaneous question during a lesson
  */
teachingRouter.post('/ask', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId, question } = req.body;

    if (!sessionId || !question) {
      return sendError(res, new AppError('sessionId and question are required.', 400, 'INPUT_REQUIRED'));
    }

    const session = await LessonSessionModel.findById(sessionId);
    const concept = session?.currentConcept || 'current principle';
    const explanation = `Great question about "${question}"! In relation to ${concept}, keep in mind that external forces cause acceleration, whereas inertia keeps an object moving at constant speed.`;

    return sendSuccess(res, { explanation, concept }, 'Teacher answered student question.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 3. POST /api/teaching/explain-again
 * Requests a fresh, alternative explanation/analogy for the current concept
 */
teachingRouter.post('/explain-again', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required to re-explain.', 400, 'SESSION_ID_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.explainAgain(sessionId, userId);
    return sendSuccess(res, result, 'Alternative explanation generated.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 4. POST /api/teaching/simplify
 * Lowers complexity, strips jargon, and explains foundational intuition
 */
teachingRouter.post('/simplify', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required to simplify.', 400, 'SESSION_ID_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.simplifyConcept(sessionId, userId);
    return sendSuccess(res, result, 'Concept simplified to foundational level.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 5. POST /api/teaching/example
 * Delivers a concrete worked practical or real-world example
 */
teachingRouter.post('/example', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required for an example.', 400, 'SESSION_ID_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.provideExample(sessionId, userId);
    return sendSuccess(res, result, 'Worked example provided.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 6. POST /api/teaching/change-language
 * Changes teacher spoken/written language while preserving state & context
 */
teachingRouter.post('/change-language', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId, newLanguage, language } = req.body;
    const targetLanguage = newLanguage || language;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required to change language.', 400, 'SESSION_ID_REQUIRED'));
    }
    if (!targetLanguage) {
      return sendError(res, new AppError('Target language is required.', 400, 'LANGUAGE_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.changeLanguage(sessionId, userId, targetLanguage);
    return sendSuccess(res, result, `Language switched to ${targetLanguage}. Context preserved.`);
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 7. POST /api/teaching/continue
 * Advances state machine to next phase (e.g. INTRODUCTION -> EXPLANATION -> DEMONSTRATION -> CHECK_UNDERSTANDING)
 */
teachingRouter.post('/continue', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required to continue teaching loop.', 400, 'SESSION_ID_REQUIRED'));
    }

    const result = await AdaptiveTeacherService.continueSession(sessionId, userId);
    return sendSuccess(res, result, 'Teaching session advanced to next pedagogical phase.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * Backward compatibility: POST /api/teaching/evaluate
 */
teachingRouter.post('/evaluate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { sessionId, studentAnswer, isVoice } = req.body;
    const result = await AdaptiveTeacherService.respondToQuestion({
      sessionId: sessionId || 'default_session',
      userId,
      studentAnswer: studentAnswer || '',
      isVoice: Boolean(isVoice),
    });
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err);
  }
});
