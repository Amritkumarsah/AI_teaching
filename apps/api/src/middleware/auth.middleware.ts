import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';
import { UserRole } from '../models/user.model';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Authentication Middleware: Answers "Who is this user?"
 * Strictly verifies JWT signature and expiry.
 * Never auto-authenticates or bypasses missing tokens.
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return sendError(
      res,
      new AppError('Authentication required. Please provide a valid bearer token.', 401, 'UNAUTHORIZED')
    );
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
    };

    if (!decoded.userId || !decoded.role) {
      return sendError(
        res,
        new AppError('Invalid token payload structure.', 401, 'INVALID_TOKEN')
      );
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(
        res,
        new AppError('Session has expired. Please log in again.', 401, 'TOKEN_EXPIRED')
      );
    }
    return sendError(
      res,
      new AppError('Authentication token is invalid.', 401, 'INVALID_TOKEN')
    );
  }
}

/**
 * Authorization Middleware: Answers "Is this user allowed to access this resource?"
 * Enforces Role-Based Access Control (RBAC).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(
        res,
        new AppError('Authentication required before authorization check.', 401, 'UNAUTHORIZED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

/**
 * Rate Limiter for Auth Routes: Protects against credential brute-forcing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
});
