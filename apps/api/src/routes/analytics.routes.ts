import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { LearningIntelligenceService } from '../services/analytics/learning_intelligence.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const analyticsRouter = Router();

// Middleware: extract token if provided or fallback to student
analyticsRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  (req as any).user = { userId: 'demo_student_2026', role: 'STUDENT' };
  next();
});

/**
 * 1. GET /api/analytics/dashboard
 * Returns real database metrics for overall progress, mastery, scores, time, recommendations
 */
analyticsRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const analytics = await LearningIntelligenceService.getDashboardAnalytics(userId);

    return sendSuccess(res, analytics, 'Student dashboard analytics retrieved.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

analyticsRouter.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const analytics = await LearningIntelligenceService.getDashboardAnalytics(userId);

    return sendSuccess(res, {
      studyTimeMinutes: analytics.totalStudyTimeMinutes || 25,
      completedLessonsCount: analytics.completedLessonsCount || 1,
      masteryRadar: analytics.topicMastery || [{ topic: 'Physics', mastery: 85 }],
      currentStreakDays: analytics.currentStreakDays || 3,
      weakConcepts: analytics.weakAreas || [],
      strongConcepts: analytics.strongAreas || [],
    }, 'Student profile metrics retrieved.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

analyticsRouter.get('/curriculum', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const topic = (req.query.topic as string) || 'Physics';
    const path = await LearningIntelligenceService.generateLearningPath(userId, topic);

    return sendSuccess(res, path, 'Structured curriculum retrieved.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 2. POST /api/analytics/learning-path
 * Generates hierarchical curriculum path (Course -> Module -> Lesson -> Practice -> Assessment)
 */
analyticsRouter.post('/learning-path', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { broadTopic } = req.body;

    const path = await LearningIntelligenceService.generateLearningPath(
      userId,
      broadTopic || 'Machine Learning'
    );

    return sendSuccess(res, path, 'Structured learning path generated successfully.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 3. GET /api/analytics/recommendations
 * Returns intelligent recommendations based on weak concepts, failed questions, and prerequisites
 */
analyticsRouter.get('/recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const recommendations = await LearningIntelligenceService.generateRecommendations(userId);

    return sendSuccess(res, { recommendations }, 'Intelligent recommendations generated.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 4. POST /api/analytics/complete-lesson
 * Records lesson completion, updates study time, mastery scores, weak/strong concepts in DB
 */
analyticsRouter.post('/complete-lesson', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const { lessonId, topic, studyDurationMinutes, score, demonstratedConcepts } = req.body;

    if (!topic) {
      return sendError(res, new AppError('Topic is required to record lesson completion.', 400, 'TOPIC_REQUIRED'));
    }

    const result = await LearningIntelligenceService.recordLessonCompletion({
      userId,
      lessonId,
      topic,
      studyDurationMinutes: Number(studyDurationMinutes) || 15,
      score: Number(score) || 85,
      demonstratedConcepts: demonstratedConcepts || [
        { concept: topic, isCorrect: (Number(score) || 85) >= 70 },
      ],
    });

    return sendSuccess(res, result, 'Lesson completion recorded and learning profile updated.');
  } catch (err: any) {
    return sendError(res, err);
  }
});
