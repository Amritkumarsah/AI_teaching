import { Request, Response } from 'express';
import mongoose from 'mongoose';

export function getHealth(req: Request, res: Response): void {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    message: 'AI Teacher Production API is operational',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'ai_teacher',
    },
    system: {
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
    version: '1.0.0',
  });
}
