import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { ENV } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal server error occurred.';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message || 'Payload validation failed.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid resource identifier: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A resource with that ${field} already exists.`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication token is invalid or has expired.';
  } else if (typeof err.message === 'string' && ENV.NODE_ENV !== 'production') {
    message = err.message;
  }

  if (ENV.NODE_ENV !== 'production') {
    console.error(`[Error] [${req.method} ${req.originalUrl}] ${code}: ${message}`);
  }

  sendError(res, message, code, statusCode);
}
