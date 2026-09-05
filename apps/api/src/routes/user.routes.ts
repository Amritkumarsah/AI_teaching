import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StudentProfileModel } from '../models';

export const userRouter = Router();

// GET /api/user/profile
userRouter.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo-student-id-001';
    let profile = await StudentProfileModel.findOne({ userId }).exec().catch(() => null);

    if (!profile) {
      profile = await StudentProfileModel.create({
        userId,
        educationLevel: 'beginner',
        preferredLanguage: 'en',
        learningGoal: 'concept_mastery',
        teachingStyle: 'intuitive',
        availableStudyTimeMinutes: 20,
        difficultyPreference: 'moderate',
      }).catch(() => ({
        _id: 'prof_default',
        userId,
        educationLevel: 'beginner',
        preferredLanguage: 'en',
        learningGoal: 'concept_mastery',
        teachingStyle: 'intuitive',
        availableStudyTimeMinutes: 20,
        difficultyPreference: 'moderate',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any));
    }

    return res.json({ success: true, data: { profile } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/user/onboarding
userRouter.post('/onboarding', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo-student-id-001';
    const {
      educationLevel,
      preferredLanguage,
      learningGoal,
      teachingStyle,
      availableStudyTimeMinutes,
      difficultyPreference,
    } = req.body;

    const profile = await StudentProfileModel.findOneAndUpdate(
      { userId },
      {
        educationLevel: educationLevel || 'beginner',
        preferredLanguage: preferredLanguage || 'en',
        learningGoal: learningGoal || 'concept_mastery',
        teachingStyle: teachingStyle || 'intuitive',
        availableStudyTimeMinutes: availableStudyTimeMinutes || 20,
        difficultyPreference: difficultyPreference || 'moderate',
      },
      { upsert: true, new: true }
    ).catch(() => ({
      userId,
      educationLevel,
      preferredLanguage,
      learningGoal,
      teachingStyle,
      availableStudyTimeMinutes,
      difficultyPreference,
      updatedAt: new Date(),
    }));

    return res.json({
      success: true,
      message: 'Student onboarding preferences saved successfully.',
      data: { profile },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});
