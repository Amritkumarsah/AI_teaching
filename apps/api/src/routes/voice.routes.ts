import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import {
  getSTTProvider,
  getTTSProvider,
  getVoiceApiDiscovery,
} from '../services/voice/voice_providers';
import { AdaptiveTeacherService } from '../services/teaching/adaptive_teacher.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export const voiceRouter = Router();

// Middleware: extract token if provided or fallback to demo student
voiceRouter.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as AuthRequest, res, next);
  }
  (req as any).user = { userId: 'demo_student_2026', role: 'STUDENT' };
  next();
});

/**
 * 1. GET /api/voice/discovery
 * Discloses all provider tiers, API keys, pricing, and browser support
 */
voiceRouter.get('/discovery', (req: AuthRequest, res: Response) => {
  try {
    const discovery = getVoiceApiDiscovery();
    const sttProviders = discovery.filter((p) => p.category === 'STT');
    const ttsProviders = discovery.filter((p) => p.category === 'TTS');
    return sendSuccess(
      res,
      {
        providers: discovery,
        sttProviders,
        ttsProviders,
      },
      'Voice API discovery catalog retrieved.'
    );
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 2. POST /api/voice/transcribe
 * Speech-to-Text conversion using active or mock provider
 */
voiceRouter.post('/transcribe', async (req: AuthRequest, res: Response) => {
  try {
    const { audio, audioBase64, language, mode, provider: providerName, simulateError, timeoutMs } = req.body;
    const inputAudio = audio || audioBase64;

    const chosenMode = (providerName === 'mock' || mode === 'mock') ? 'mock' : 'real';
    const provider = getSTTProvider(chosenMode);

    const result = await provider.transcribe(inputAudio, {
      language,
      simulateError,
      timeoutMs,
    });

    return sendSuccess(
      res,
      {
        result,
        transcript: result.text,
        confidence: result.confidence,
        language: result.language,
      },
      'Speech transcribed successfully.'
    );
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 3. POST /api/voice/synthesize
 * Text-to-Speech audio generation using active or mock provider
 */
voiceRouter.post('/synthesize', async (req: AuthRequest, res: Response) => {
  try {
    const { text, language, voiceName, speed, pitch, mode, provider: providerName, simulateError, timeoutMs } = req.body;

    if (!text || String(text).trim().length === 0) {
      return sendError(res, new AppError('Text input is required for TTS synthesis.', 400, 'TEXT_REQUIRED'));
    }

    const chosenMode = (providerName === 'mock' || mode === 'mock') ? 'mock' : 'real';
    const provider = getTTSProvider(chosenMode);

    const result = await provider.synthesize(text, {
      language,
      voiceName,
      speed,
      pitch,
      simulateError,
      timeoutMs,
    });

    return sendSuccess(
      res,
      {
        result,
        audioBase64: result.audioBase64,
        audioUrl: result.audioUrl,
        durationSeconds: result.durationSeconds,
        language: result.language,
        voiceName: result.voiceName,
        languageFallback: result.isFallback,
        fallbackNotice: result.fallbackNotice,
      },
      'Speech synthesized successfully.'
    );
  } catch (err: any) {
    return sendError(res, err);
  }
});

/**
 * 4. POST /api/voice/interaction
 * Full voice pipeline: Student voice -> STT -> Adaptive Teacher -> TTS -> Teacher voice
 */
voiceRouter.post('/interaction', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'demo_student_2026';
    const {
      sessionId,
      audio,
      audioBase64,
      textTranscript,
      language,
      mode,
      sttProvider: sttProviderName,
      ttsProvider: ttsProviderName,
    } = req.body;

    if (!sessionId) {
      return sendError(res, new AppError('Session ID is required for voice teaching interaction.', 400, 'SESSION_ID_REQUIRED'));
    }

    const inputAudio = audio || audioBase64;
    let transcribedText = textTranscript;

    const chosenSTTMode = (sttProviderName === 'mock' || mode === 'mock') ? 'mock' : 'real';
    const chosenTTSMode = (ttsProviderName === 'mock' || mode === 'mock') ? 'mock' : 'real';

    // Step 1: STT if transcript wasn't already supplied directly
    if (!transcribedText && inputAudio) {
      const sttProvider = getSTTProvider(chosenSTTMode);
      const sttResult = await sttProvider.transcribe(inputAudio, { language });
      transcribedText = sttResult.text;
    }

    if (!transcribedText || transcribedText.trim().length === 0) {
      return sendError(res, new AppError('Empty audio or speech input received.', 400, 'EMPTY_AUDIO'));
    }

    // Step 2: Adaptive Teacher Engine response
    const teacherResponse = await AdaptiveTeacherService.respondToQuestion({
      sessionId,
      userId,
      studentAnswer: transcribedText,
      isVoice: true,
    });

    // Step 3: TTS Synthesis of teacher response
    const ttsProvider = getTTSProvider(chosenTTSMode);
    const ttsResult = await ttsProvider.synthesize(teacherResponse.teacherSpeech, {
      language: teacherResponse.language,
    });

    return sendSuccess(
      res,
      {
        studentTranscription: transcribedText,
        teacherResponse,
        teacherSpeech: teacherResponse.teacherSpeech,
        teacherAudio: ttsResult,
        teacherAudioBase64: ttsResult.audioBase64,
      },
      'Voice interaction round completed successfully.'
    );
  } catch (err: any) {
    return sendError(res, err);
  }
});
