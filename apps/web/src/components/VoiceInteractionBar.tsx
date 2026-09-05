import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { VoiceUIState, SupportedLanguage } from '@ai-teacher/types';

interface VoiceInteractionBarProps {
  sessionId?: string;
  language: SupportedLanguage;
  onTranscriptReceived?: (transcript: string) => void;
  onVoiceResponseReceived?: (speech: string, audioBase64?: string) => void;
  disabled?: boolean;
}

export const VoiceInteractionBar: React.FC<VoiceInteractionBarProps> = ({
  sessionId,
  language,
  onTranscriptReceived,
  onVoiceResponseReceived,
  disabled = false,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceUIState>('Idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [activeVoiceProvider, setActiveVoiceProvider] = useState<string>('real-webspeech');
  const [useVoicePipeline, setUseVoicePipeline] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stop any ongoing speech or recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Map supported languages to browser/provider BCP-47 locale tags
  const getLocaleForLang = (lang: SupportedLanguage): string => {
    switch (lang) {
      case 'hi':
      case 'hinglish':
        return 'hi-IN';
      case 'ta':
        return 'ta-IN';
      case 'ne':
        return 'ne-NP';
      case 'es':
        return 'es-ES';
      default:
        return 'en-US';
    }
  };

  const handleStartSpeaking = () => {
    if (disabled) return;
    setErrorMessage('');
    setVoiceState('Listening');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Browser does not support native Web Speech STT, simulate or use fallback
      fallbackAudioSimulation();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getLocaleForLang(language);

      recognition.onstart = () => {
        setVoiceState('Listening');
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (!transcript.trim()) {
          setVoiceState('Error');
          setErrorMessage('Empty audio: No recognizable speech was detected.');
          return;
        }

        setLastTranscript(transcript);
        if (onTranscriptReceived) {
          onTranscriptReceived(transcript);
        }

        // Send to real-time voice pipeline
        await processVoicePipeline(transcript);
      };

      recognition.onerror = (event: any) => {
        setVoiceState('Error');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone permission denied. Please allow microphone access in browser settings.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('Empty audio: No voice input detected. Please speak clearly into the microphone.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Microphone capture error. Please check your audio input device.');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error || 'Unknown failure'}`);
        }
      };

      recognition.onend = () => {
        // If it ended without transitioning to Processing, Speaking, or Error, go back to Idle
        setVoiceState((prev) => (prev === 'Listening' ? 'Idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setVoiceState('Error');
      setErrorMessage(`Failed to start microphone: ${err?.message || 'Permission denied or unsupported'}`);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setVoiceState('Idle');
  };

  // Fallback simulator for headless browsers or environments without microphone access
  const fallbackAudioSimulation = async () => {
    setVoiceState('Listening');
    setTimeout(async () => {
      setVoiceState('Processing');
      const simulatedText = language === 'hi' 
        ? 'मुझे न्यूटन के नियम के बारे में और समझाइए।'
        : language === 'ne'
        ? 'कृपया मलाई न्यूटनको पहिलो नियम सरल रूपमा सम्झाउनुहोस्।'
        : 'Can you explain Newton’s first law with another real-life example?';
      
      setLastTranscript(simulatedText);
      if (onTranscriptReceived) onTranscriptReceived(simulatedText);

      await processVoicePipeline(simulatedText);
    }, 1200);
  };

  // Call End-to-End Voice Interaction API or TTS
  const processVoicePipeline = async (transcript: string) => {
    setVoiceState('Processing');

    try {
      if (sessionId) {
        // Full Real-Time Pipeline: STT -> AI Teacher -> TTS
        const res = await fetch('/api/voice/interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            textTranscript: transcript,
            language,
            sttProvider: activeVoiceProvider,
            ttsProvider: 'mock', // Fast fallback or mock
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          playTeacherVoice(data.data.teacherSpeech, data.data.teacherAudioBase64);
          if (onVoiceResponseReceived) {
            onVoiceResponseReceived(data.data.teacherSpeech, data.data.teacherAudioBase64);
          }
          return;
        }
      }

      // If no active session ID, synthesize speech directly
      const synthRes = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `I understood: "${transcript}". Let's explore this concept together.`,
          language,
          provider: 'real-edge',
        }),
      });

      const synthData = await synthRes.json();
      if (synthData.success && synthData.data) {
        playTeacherVoice(synthData.data.audioUrl ? '' : `I understood: ${transcript}`, synthData.data.audioBase64);
      } else {
        // Fallback to browser Web Speech API
        speakWithWebSpeech(transcript);
      }
    } catch (err: any) {
      console.warn('Voice API request encountered an issue, falling back to local SpeechSynthesis:', err);
      speakWithWebSpeech(`Understood: ${transcript}`);
    }
  };

  const playTeacherVoice = (text: string, audioBase64?: string) => {
    setVoiceState('Speaking');

    if (audioBase64) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audioPlayerRef.current = audio;
        audio.onended = () => setVoiceState('Idle');
        audio.onerror = () => {
          // If base64 playback fails, fallback to WebSpeech
          speakWithWebSpeech(text);
        };
        audio.play().catch(() => speakWithWebSpeech(text));
        return;
      } catch (_) {
        speakWithWebSpeech(text);
        return;
      }
    }

    speakWithWebSpeech(text);
  };

  const speakWithWebSpeech = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceState('Idle');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLocaleForLang(language);
    utterance.rate = 1.0;

    utterance.onstart = () => setVoiceState('Speaking');
    utterance.onend = () => setVoiceState('Idle');
    utterance.onerror = () => {
      setVoiceState('Error');
      setErrorMessage('Browser Text-to-Speech synthesis failed.');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('Idle');
  };

  const handleRetry = () => {
    setErrorMessage('');
    handleStartSpeaking();
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-3.5 shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* State Badge & Micro-indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                voiceState === 'Idle'
                  ? 'bg-slate-500'
                  : voiceState === 'Listening'
                  ? 'bg-rose-500 animate-ping'
                  : voiceState === 'Processing'
                  ? 'bg-amber-400 animate-pulse'
                  : voiceState === 'Speaking'
                  ? 'bg-emerald-400 animate-bounce'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Voice: <span className={
                voiceState === 'Listening' ? 'text-rose-400' :
                voiceState === 'Processing' ? 'text-amber-300' :
                voiceState === 'Speaking' ? 'text-emerald-400' :
                voiceState === 'Error' ? 'text-red-400' : 'text-slate-400'
              }>{voiceState}</span>
            </span>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            {language.toUpperCase()}
          </span>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {voiceState === 'Idle' && (
            <button
              type="button"
              onClick={handleStartSpeaking}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-xs shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>🎤 Start Speaking</span>
            </button>
          )}

          {voiceState === 'Listening' && (
            <button
              type="button"
              onClick={handleStopListening}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs animate-pulse shadow-lg shadow-rose-600/30 transition-all"
            >
              <Radio className="w-4 h-4 animate-spin" />
              <span>Listening... (Click to Stop)</span>
            </button>
          )}

          {voiceState === 'Processing' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Processing Voice...</span>
            </div>
          )}

          {voiceState === 'Speaking' && (
            <button
              type="button"
              onClick={handleStopPlayback}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <VolumeX className="w-4 h-4" />
              <span>Teacher Speaking (Stop Voice)</span>
            </button>
          )}

          {voiceState === 'Error' && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-semibold text-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner with Retry & Text Alternative Guidance */}
      {voiceState === 'Error' && errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">{errorMessage}</p>
              <p className="text-[11px] text-rose-300/70 mt-0.5">
                Voice is optional. You can continue typing your response directly in the text input below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="text-[11px] font-semibold text-rose-300 underline hover:text-white shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Transcript feedback preview */}
      {lastTranscript && voiceState !== 'Error' && (
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="text-slate-500">Heard:</span>
          <span className="text-slate-300 italic truncate font-medium">"{lastTranscript}"</span>
        </div>
      )}
    </div>
  );
};
