import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { LessonModel, StudentProfileModel } from '../models';
import { LessonPlannerService } from '../services/planner/lesson_planner.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const lessonRouter = Router();

// Middleware to extract user if token present (or fallback for public exploration)
lessonRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  // Allow demo access if not authenticated
  (req as any).user = { userId: 'demo_student_2026', role: 'STUDENT' };
  next();
});

/**
 * Handler for generating / planning a lesson
 */
async function handlePlanLesson(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const {
      topic,
      documentId,
      studentLevel,
      difficulty,
      existingKnowledge,
      learningGoal,
      preferredLanguage,
      language,
      teachingStyle,
      availableTime,
      targetDurationMinutes,
      desiredDepth,
      previousPerformance,
      weakConcepts,
      strongConcepts,
    } = req.body;

    if (!topic && !documentId) {
      return sendError(
        res,
        new AppError('A topic or an uploaded documentId must be provided to plan a lesson.', 400, 'TOPIC_REQUIRED')
      );
    }

    // Check student profile for defaults if available
    const profile = await StudentProfileModel.findOne({ userId }).lean().catch(() => null);

    const result = await LessonPlannerService.planLesson({
      userId,
      topic,
      documentId,
      studentLevel: studentLevel || difficulty || (profile as any)?.educationLevel || 'beginner',
      existingKnowledge,
      learningGoal: learningGoal || (profile as any)?.learningGoal || 'concept_mastery',
      preferredLanguage: preferredLanguage || language || (profile as any)?.preferredLanguage || 'en',
      teachingStyle: teachingStyle || (profile as any)?.teachingStyle || 'intuitive',
      availableTime: availableTime || targetDurationMinutes || (profile as any)?.availableStudyTimeMinutes || 20,
      desiredDepth,
      previousPerformance,
      weakConcepts: weakConcepts || (profile as any)?.weakConcepts || [],
      strongConcepts: strongConcepts || (profile as any)?.strongConcepts || [],
    });

    return sendSuccess(
      res,
      {
        lessonId: result.lessonId,
        lesson: result.lesson,
      },
      'Personalized lesson plan generated successfully.',
      201
    );
  } catch (err: any) {
    return sendError(res, err);
  }
}

/**
 * POST /api/lessons/plan (Phase 5 Canonical)
 */
lessonRouter.post('/plan', (req: AuthRequest, res: Response) => handlePlanLesson(req, res));

/**
 * POST /api/lessons/generate (Backwards compatibility)
 */
lessonRouter.post('/generate', (req: AuthRequest, res: Response) => handlePlanLesson(req, res));

/**
 * GET /api/lessons/:id
 * Fetches stored lesson plan by ID
 */
lessonRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = req.params.id;

    // Search by _id or custom ID
    let lesson = await LessonModel.findById(lessonId).lean().catch(() => null);
    if (!lesson) {
      lesson = await LessonModel.findOne({ _id: lessonId }).lean().catch(() => null);
    }

    if (!lesson) {
      return sendError(res, new AppError(`Lesson with ID '${lessonId}' was not found.`, 404, 'NOT_FOUND'));
    }

    const userId = req.user?.userId;
    if (userId && lesson.userId && lesson.userId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, new AppError('Forbidden: You do not have permission to view this lesson.', 403, 'FORBIDDEN'));
    }

    return sendSuccess(res, { lesson });
  } catch (err: any) {
    return sendError(res, err);
  }
});
