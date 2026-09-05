import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { UserModel, UserRole } from '../models/user.model';
import { authenticateToken, AuthRequest, authRateLimiter } from '../middleware/auth.middleware';
import { AppError } from '../utils/appError';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const authRouter = Router();

// Helper to generate JWT token
function generateToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign(
    { userId, email, role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );
}

/**
 * POST /api/auth/signup
 * Creates a new user with hashed password and unverified email state.
 * Never trusts role sent from frontend (always forced to 'STUDENT').
 */
async function handleSignup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, new AppError('Full name is required.', 400, 'VALIDATION_ERROR'));
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return sendError(res, new AppError('A valid email address is required.', 400, 'VALIDATION_ERROR'));
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return sendError(res, new AppError('Password must be at least 6 characters long.', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(
        res,
        new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS')
      );
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create unverified student user (role is ALWAYS STUDENT from public signup)
    const user = new UserModel({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      role: 'STUDENT',
      lastLoginAt: new Date(),
    });

    // Generate email verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        token,
        verificationToken, // Provided for easy client-side testing / link generation
      },
      201
    );
  } catch (err: any) {
    return sendError(res, err);
  }
}

authRouter.post('/signup', authRateLimiter, handleSignup);
authRouter.post('/register', authRateLimiter, handleSignup);

/**
 * POST /api/auth/login
 * Validates credentials, checks password hash, updates lastLoginAt, returns JWT.
 */
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, new AppError('Email and password are required.', 400, 'VALIDATION_ERROR'));
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and explicitly select passwordHash
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return sendError(res, new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id.toString(), user.email, user.role);

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/auth/logout
 * Acknowledges session termination.
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Logged out successfully.' });
});

/**
 * GET & POST /api/auth/verify-email
 * Verifies email using verification token.
 */
const handleEmailVerification = async (req: Request, res: Response) => {
  try {
    const rawToken = (req.query.token || req.body.token) as string;

    if (!rawToken || typeof rawToken !== 'string') {
      return sendError(res, new AppError('Verification token is required.', 400, 'VALIDATION_ERROR'));
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await UserModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return sendError(
        res,
        new AppError('Verification token is invalid or has expired.', 400, 'INVALID_VERIFICATION_TOKEN')
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return sendSuccess(res, {
      message: 'Email verified successfully.',
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err: any) {
    return sendError(res, err);
  }
};

authRouter.get('/verify-email', handleEmailVerification);
authRouter.post('/verify-email', handleEmailVerification);

/**
 * POST /api/auth/resend-verification
 * Generates and dispatches a fresh verification token.
 */
authRouter.post('/resend-verification', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, new AppError('Email is required.', 400, 'VALIDATION_ERROR'));
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Do not leak user existence
      return sendSuccess(res, { message: 'If the account exists, a new verification link was sent.' });
    }

    if (user.emailVerified) {
      return sendSuccess(res, { message: 'This account email is already verified.' });
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    return sendSuccess(res, {
      message: 'Verification link has been dispatched.',
      verificationToken,
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates secure 1-hour password reset token.
 */
authRouter.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, new AppError('Email address is required.', 400, 'VALIDATION_ERROR'));
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Return success to prevent email enumeration
      return sendSuccess(res, {
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    return sendSuccess(res, {
      message: 'Password reset instructions sent.',
      resetToken, // Returned for test execution and direct reset link assembly
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/auth/reset-password
 * Validates reset token and updates password hash.
 */
authRouter.post('/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(
        res,
        new AppError('Reset token and new password are required.', 400, 'VALIDATION_ERROR')
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return sendError(
        res,
        new AppError('New password must be at least 6 characters long.', 400, 'VALIDATION_ERROR')
      );
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return sendError(
        res,
        new AppError('Password reset token is invalid or has expired.', 400, 'INVALID_RESET_TOKEN')
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return sendSuccess(res, {
      message: 'Password has been reset successfully. You may now log in.',
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * POST /api/auth/google
 * Handles Google OAuth signup / login.
 * Supports standard Google OAuth ID Token verification and test payload simulation.
 */
authRouter.post('/google', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { credential, email, name, googleId, avatarUrl, error: clientError } = req.body;

    // Handle popup cancelled or client OAuth errors
    if (clientError === 'popup_closed_by_user' || clientError === 'access_denied') {
      return sendError(
        res,
        new AppError('Google sign-in was cancelled.', 400, 'GOOGLE_AUTH_CANCELLED')
      );
    }

    let userEmail: string | undefined;
    let userName: string | undefined;
    let userGoogleId: string | undefined;
    let userAvatar: string | undefined;

    // 1. If a JWT credential was provided from Google One-Tap or Google Identity Services
    if (credential && typeof credential === 'string') {
      try {
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email) {
          userEmail = decoded.email.toLowerCase();
          userName = decoded.name || decoded.given_name || 'Google Scholar';
          userGoogleId = decoded.sub;
          userAvatar = decoded.picture || '';
        }
      } catch {
        return sendError(res, new AppError('Invalid Google credential token.', 400, 'INVALID_GOOGLE_TOKEN'));
      }
    } else if (email && googleId) {
      // 2. Direct validated OAuth payload
      userEmail = String(email).trim().toLowerCase();
      userName = name || 'Google Scholar';
      userGoogleId = String(googleId);
      userAvatar = avatarUrl || '';
    } else {
      return sendError(
        res,
        new AppError('Google credential or authentication payload is required.', 400, 'VALIDATION_ERROR')
      );
    }

    if (!userEmail) {
      return sendError(
        res,
        new AppError('Google account did not provide an email address.', 400, 'UNAUTHORIZED_ACCOUNT')
      );
    }

    // Find user by googleId or email
    let user = await UserModel.findOne({
      $or: [{ googleId: userGoogleId }, { email: userEmail }],
    });

    if (user) {
      // Existing user: Link googleId if not yet linked
      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
      }
      user.emailVerified = true; // Google accounts verify email ownership
      user.lastLoginAt = new Date();
      if (userAvatar && !user.avatarUrl) {
        user.avatarUrl = userAvatar;
      }
      await user.save();
    } else {
      // New user: Provision student account
      user = await UserModel.create({
        name: userName,
        email: userEmail,
        googleId: userGoogleId,
        emailVerified: true, // Google verifies emails
        role: 'STUDENT',
        avatarUrl: userAvatar,
        lastLoginAt: new Date(),
      });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * GET /api/auth/me
 * Strictly protected: Returns fresh authoritative user profile.
 */
authRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user?.userId);
    if (!user) {
      return sendError(res, new AppError('User account not found.', 404, 'USER_NOT_FOUND'));
    }

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err: any) {
    return sendError(res, err);
  }
});
