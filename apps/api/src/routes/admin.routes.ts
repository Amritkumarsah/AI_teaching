import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { UserModel } from '../models/user.model';
import { sendSuccess } from '../utils/apiResponse';

export const adminRouter = Router();

// Apply authentication AND admin role authorization
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/metrics
 * Protected resource: strictly requires ADMIN role.
 * Demonstrates separation of Authentication (401) and Authorization (403).
 */
adminRouter.get('/metrics', async (_req: AuthRequest, res: Response) => {
  const totalUsers = await UserModel.countDocuments();
  const verifiedUsers = await UserModel.countDocuments({ emailVerified: true });
  const studentCount = await UserModel.countDocuments({ role: 'STUDENT' });
  const adminCount = await UserModel.countDocuments({ role: 'ADMIN' });

  return sendSuccess(res, {
    system: 'AI Teacher Platform Core',
    totalUsers,
    verifiedUsers,
    studentCount,
    adminCount,
    timestamp: new Date(),
  });
});
