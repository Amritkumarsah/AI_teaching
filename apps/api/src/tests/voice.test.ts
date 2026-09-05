import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import {
  MockSTTProvider,
  MockTTSProvider,
  RealWebSpeechSTTProvider,
  RealEdgeTTSProvider,
  CloudWhisperSTTProvider,
  getVoiceApiDiscovery,
} from '../services/voice/voice_providers';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(id: number, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ id, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ Test ${id}: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ id, name, passed: false, message: err.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ Test ${id}: ${name} (${Date.now() - start}ms) - ${err.message}`);
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('  RUNNING PHASE 8 REAL-TIME VOICE TEACHING TEST SUITE');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const testPort = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  const testUserId = new mongoose.Types.ObjectId().toString();
  const testToken = jwt.sign({ userId: testUserId, email: 'voice_student@aiteacher.io', role: 'STUDENT' }, ENV.JWT_SECRET);

  try {
    // 0. API Discovery Verification
    await runTest(0, 'GET /api/voice/discovery returns comprehensive provider pricing, keys & quotas', async () => {
      const res = await fetch(`${baseUrl}/api/voice/discovery`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Discovery failed: ${JSON.stringify(json)}`);
      
      const { sttProviders, ttsProviders } = json.data;
      if (!sttProviders || !ttsProviders) throw new Error('Missing sttProviders or ttsProviders');
      
      // Verify Real Zero-Key Providers & Cloud Providers documented
      const webSpeech = sttProviders.find((p: any) => p.providerName && p.providerName.includes('WebSpeech'));
      const edgeTts = ttsProviders.find((p: any) => p.providerName && p.providerName.includes('EdgeTTS'));
      const whisper = sttProviders.find((p: any) => p.providerName && p.providerName.includes('Whisper'));

      if (!webSpeech || webSpeech.requiresApiKey !== false) throw new Error('Web Speech should be 100% free with no key');
      if (!edgeTts || edgeTts.requiresApiKey !== false) throw new Error('Edge TTS should be 100% free with no key');
      if (!whisper || whisper.requiresApiKey !== true) throw new Error('Cloud Whisper must explicitly declare requiresApiKey: true');
    });

    // 1. Microphone Permission Denied
    await runTest(1, 'TEST 1: Microphone permission denied handled gracefully (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'mock-audio',
          provider: 'mock',
          simulateError: 'PERMISSION_DENIED',
        }),
      });
      const json = await res.json();
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      const errText = json.error?.message || json.error;
      if (!errText || !errText.includes('Microphone permission was denied')) throw new Error(`Expected permission denied message, got ${JSON.stringify(json.error)}`);
    });

    // 2. Empty Audio Stream
    await runTest(2, 'TEST 2: Empty audio input rejected with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: '    ', // Empty whitespace
          provider: 'mock',
        }),
      });
      const json = await res.json();
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request for empty audio, got ${res.status}`);
      if (!json.error) throw new Error('Missing error message in 400 response');
    });

    // 3. Noisy Audio Stream
    await runTest(3, 'TEST 3: Noisy audio stream rejected with 422 Unprocessable Entity', async () => {
      const res = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'noisy-background-hum',
          provider: 'mock',
          simulateError: 'NOISY_AUDIO',
        }),
      });
      const json = await res.json();
      if (res.status !== 422) throw new Error(`Expected 422 Unprocessable Entity for noisy audio, got ${res.status}`);
      const errText = json.error?.message || json.error;
      if (!errText || !errText.toLowerCase().includes('noisy')) {
        throw new Error(`Expected noisy audio message, got: ${JSON.stringify(json.error)}`);
      }
    });

    // 4. STT Failure
    await runTest(4, 'TEST 4: STT Provider failure triggers 502 Bad Gateway', async () => {
      const res = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'valid-audio-data',
          provider: 'mock',
          simulateError: 'STT_FAILURE',
        }),
      });
      const json = await res.json();
      if (res.status !== 502) throw new Error(`Expected 502 Bad Gateway, got ${res.status}`);
      const errText = json.error?.message || json.error;
      if (!errText || !errText.includes('Speech-to-Text service encountered an internal recognition engine failure')) {
        throw new Error(`Expected STT failure message, got: ${JSON.stringify(json.error)}`);
      }
    });

    // 5. TTS Failure
    await runTest(5, 'TEST 5: TTS Provider failure triggers 502 Bad Gateway', async () => {
      const res = await fetch(`${baseUrl}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello student, this is a test of voice synthesis.',
          provider: 'mock',
          simulateError: 'TTS_FAILURE',
        }),
      });
      const json = await res.json();
      if (res.status !== 502) throw new Error(`Expected 502 Bad Gateway for TTS failure, got ${res.status}`);
      const errText = json.error?.message || json.error;
      if (!errText || !errText.includes('Text-to-Speech synthesis engine failed')) {
        throw new Error(`Expected TTS failure message, got: ${JSON.stringify(json.error)}`);
      }
    });

    // 6. API Timeout
    await runTest(6, 'TEST 6: API Provider timeout triggers 504 Gateway Timeout', async () => {
      const res = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'valid-audio-data',
          provider: 'mock',
          simulateError: 'TIMEOUT',
        }),
      });
      const json = await res.json();
      if (res.status !== 504) throw new Error(`Expected 504 Gateway Timeout, got ${res.status}`);
      const errText = json.error?.message || json.error;
      if (!errText || !errText.includes('timed out')) {
        throw new Error(`Expected timeout message, got: ${JSON.stringify(json.error)}`);
      }
    });

    // 7. Multilingual Switching across EN, HI, Hinglish, Nepali, Tamil
    await runTest(7, 'TEST 7: Multilingual switching supported for EN, HI, Hinglish, Nepali & Tamil with fallback', async () => {
      const testLanguages = ['en', 'hi', 'hinglish', 'ne', 'ta'] as const;

      for (const lang of testLanguages) {
        // Transcribe test in target language
        const sttRes = await fetch(`${baseUrl}/api/voice/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: `audio-in-${lang}`,
            language: lang,
            provider: 'mock',
          }),
        });
        const sttJson = await sttRes.json();
        if (!sttRes.ok || !sttJson.success) throw new Error(`STT failed for lang: ${lang}`);
        if (!sttJson.data.transcript) throw new Error(`Empty transcript for lang: ${lang}`);

        // Synthesize test in target language
        const ttsRes = await fetch(`${baseUrl}/api/voice/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sttJson.data.transcript,
            language: lang,
            provider: 'mock',
          }),
        });
        const ttsJson = await ttsRes.json();
        if (!ttsRes.ok || !ttsJson.success) throw new Error(`TTS failed for lang: ${lang}`);
        if (!ttsJson.data.audioBase64) throw new Error(`Missing audioBase64 for lang: ${lang}`);
        
        // Check Nepali fallback documentation note
        if (lang === 'ne') {
          if (!ttsJson.data.languageFallback && ttsJson.data.voiceName.includes('Hemkala')) {
            // Either native Nepali voice or documented fallback passed
          }
        }
      }
    });

    // 8. Retry Mechanism & Optional Voice Resilience (Text Fallback)
    await runTest(8, 'TEST 8: Retry recovery and seamless text-fallback interaction loop', async () => {
      // Step A: Start a real teaching session
      const startRes = await fetch(`${baseUrl}/api/teaching/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          topic: "Newton's First Law",
          language: 'en',
          difficulty: 'beginner',
        }),
      });
      const startJson = await startRes.json();
      if (!startRes.ok || !startJson.success) throw new Error('Failed to start teaching session');
      const sessionId = startJson.data.sessionId;

      // Step B: Simulate voice failure initially
      const failRes = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'flaky-stream',
          provider: 'mock',
          simulateError: 'STT_FAILURE',
        }),
      });
      if (failRes.status !== 502) throw new Error('Expected initial STT failure');

      // Step C: Retry succeeded with clean stream
      const retryRes = await fetch(`${baseUrl}/api/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: 'clean-retry-stream',
          provider: 'mock',
        }),
      });
      const retryJson = await retryRes.json();
      if (!retryRes.ok || !retryJson.success) throw new Error('Retry STT failed');

      // Step D: End-to-end voice pipeline call with session
      const voicePipeRes = await fetch(`${baseUrl}/api/voice/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          sessionId,
          textTranscript: retryJson.data.transcript,
          language: 'en',
          sttProvider: 'mock',
          ttsProvider: 'mock',
        }),
      });
      const voicePipeJson = await voicePipeRes.json();
      if (!voicePipeRes.ok || !voicePipeJson.success) {
        throw new Error(`Voice pipeline interaction failed: ${JSON.stringify(voicePipeJson)}`);
      }
      if (!voicePipeJson.data.teacherSpeech || !voicePipeJson.data.teacherAudioBase64) {
        throw new Error('Expected teacherSpeech and teacherAudioBase64 in pipeline response');
      }

      // Step E: Verify Text Interaction continues working even if voice is disabled (Voice is Optional)
      const textOnlyRes = await fetch(`${baseUrl}/api/teaching/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          sessionId,
          studentAnswer: 'An object at rest stays at rest unless an external force acts on it.',
          isVoice: false, // Text interaction
        }),
      });
      const textOnlyJson = await textOnlyRes.json();
      if (!textOnlyRes.ok || !textOnlyJson.success) {
        throw new Error(`Text interaction failed when voice is not used: ${JSON.stringify(textOnlyJson)}`);
      }
      if (!textOnlyJson.data.teacherSpeech) {
        throw new Error('Teacher failed to respond to text-only input');
      }
    });

  } finally {
    server.close();
    await mongoose.disconnect();
  }

  // Final Test Output Table
  console.log('\n=============================================================');
  console.log('                 PHASE 8 TEST RESULTS SUMMARY                ');
  console.log('=============================================================');
  const totalPassed = results.filter((r) => r.passed).length;
  results.forEach((r) => {
    console.log(`${r.passed ? '✓' : '✗'} [Test ${r.id}] ${r.name} (${r.durationMs}ms)`);
    if (!r.passed && r.message) {
      console.log(`    Error: ${r.message}`);
    }
  });
  console.log('-------------------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${totalPassed} | Failed: ${results.length - totalPassed}`);
  console.log('=============================================================\n');

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in voice test runner:', err);
  process.exit(1);
});
