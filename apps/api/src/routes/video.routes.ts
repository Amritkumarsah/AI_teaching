import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { VideoRenderer } from '../services/video/video_renderer';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const videoRouter = Router();

// Middleware: extract token if provided or fallback to demo student
videoRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  (req as any).user = { userId: 'demo_student_video', role: 'STUDENT' };
  next();
});

/**
 * 1. GET /api/video/discovery
 * Discloses API keys required for cloud avatars, free open-source alternatives, pricing
 */
videoRouter.get('/discovery', (req: AuthRequest, res: Response) => {
  try {
    const discovery = VideoRenderer.getVideoApiDiscovery();
    return sendSuccess(res, discovery, 'Video API discovery metadata retrieved.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 2. POST /api/video/generate
 * Initiates an asynchronous video generation job, returning a jobId
 */
async function handleGenerateVideo(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId || 'demo_student_video';
    const { lessonId, topic, subject, preference } = req.body;

    if (!lessonId && !topic) {
      return sendError(res, new AppError('Either lessonId or topic is required to generate a video.', 400, 'INPUT_REQUIRED'));
    }

    const job = await VideoRenderer.createVideoJob({
      userId,
      lessonId: lessonId || 'adhoc_lesson',
      topic,
      subject,
      preference,
    });

    return sendSuccess(
      res,
      {
        jobId: job._id.toString(),
        status: job.status,
        progressPercent: job.progressPercent,
        currentStage: job.currentStage,
      },
      'Video generation job created.',
      201
    );
  } catch (err: any) {
    return sendError(res, err);
  }
}

videoRouter.post('/generate', handleGenerateVideo);
videoRouter.post('/render', handleGenerateVideo);

/**
 * 3. GET /api/video/jobs/:id
 * Polls the current status, progress, stage message, and completed scenes/video
 */
videoRouter.get('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const job = await VideoRenderer.getJobStatus(id);

    if (userId && job.userId && job.userId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, new AppError('Forbidden: You do not have permission to view this video job.', 403, 'FORBIDDEN'));
    }

    return sendSuccess(res, job, 'Video job status retrieved.');
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 4. GET /api/video/jobs/:id/download
 * Mock/direct file download for generated MP4 video artifact
 */
videoRouter.get('/jobs/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const job = await VideoRenderer.getJobStatus(id);

    if (userId && job.userId && job.userId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, new AppError('Forbidden: You do not have permission to download this video.', 403, 'FORBIDDEN'));
    }

    if (job.status !== 'COMPLETED') {
      return sendError(res, new AppError('Video is still rendering. Download is available once complete.', 400, 'NOT_READY'));
    }

    // Return mock MP4 stream or download headers
    res.setHeader('Content-Disposition', `attachment; filename="lesson_${job.topic ? job.topic.replace(/\s+/g, '_') : id}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    return res.send(Buffer.from('ftypmp42isommp42', 'utf-8'));
  } catch (err: any) {
    return sendError(res, err);
  }
});
