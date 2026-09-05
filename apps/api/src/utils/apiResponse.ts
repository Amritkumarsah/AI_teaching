import { Response } from 'express';
import { AppError } from './appError';

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  statusCodeOrMessage?: number | string,
  explicitStatusCode?: number
): Response {
  let message: string | undefined;
  let statusCode = 200;

  if (typeof statusCodeOrMessage === 'number') {
    statusCode = statusCodeOrMessage;
  } else if (typeof statusCodeOrMessage === 'string') {
    message = statusCodeOrMessage;
    if (explicitStatusCode) statusCode = explicitStatusCode;
  }

  const payload: ApiSuccessResponse<T> = {
    success: true,
  };
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  errorOrMessage: AppError | Error | string,
  code: string = 'ERROR',
  explicitStatusCode?: number
): Response {
  let statusCode = explicitStatusCode || 500;
  let errorCode = code;
  let message = 'An unexpected error occurred';

  if (errorOrMessage instanceof AppError) {
    statusCode = errorOrMessage.statusCode;
    errorCode = errorOrMessage.code;
    message = errorOrMessage.message;
  } else if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message;
  } else if (typeof errorOrMessage === 'string') {
    message = errorOrMessage;
  }

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };
  return res.status(statusCode).json(payload);
}
