import React, { useState, useEffect, useRef } from 'react';
import { TeacherAvatar } from '../components/TeacherAvatar';
import { ChalkboardVisual } from '../components/ChalkboardVisual';
import { VoiceInteractionBar } from '../components/VoiceInteractionBar';
import {
  TeachingState,
  TeacherPersonality,
  SupportedLanguage,
  IVisualContent,
  IQuestion,
  IEvaluationResult,
  IConceptMastery,
} from '@ai-teacher/types';
import {
  Play,
  Pause,
  RotateCcw,
  Globe,
  HelpCircle,
  Sparkles,
  Volume2,
  ArrowRight,
  Lightbulb,
  Mic,
  MicOff,
  Send,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClassroomPage: React.FC = () => {
  // Session State
  const [sessionId, setSessionId] = useState<string>('');
  const [state, setState] = useState<TeachingState>('INTRODUCTION');
  const [personality, setPersonality] = useState<TeacherPersonality>('Friendly');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [currentConcept, setCurrentConcept] = useState<string>("Newton's First Law (Inertia)");
  const [masteryScore, setMasteryScore] = useState<number>(0);

  // Teaching Content State
  const [teacherSpeech, setTeacherSpeech] = useState<string>('Welcome to your AI Teaching Session!');
  const [teacherAction, setTeacherAction] = useState<string>('Initializing lesson');
  const [visual, setVisual] = useState<IVisualContent>({
    type: 'simulation' as any,
    title: 'Inertia & Force Vectors',
    description: 'Dynamic vector mechanics in frictionless space',
    data: { forceNet: '0 N', velocity: 'Constant' },
  });
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [evaluation, setEvaluation] = useState<IEvaluationResult | null>(null);

  // Interaction Input State
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // 1. Initialize or load teaching session
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/teaching/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: "Newton's Laws of Motion",
            personality,
            language,
            difficulty,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          applySessionData(json.data);
          speak(json.data.teacherSpeech, language);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, [personality]);

  const applySessionData = (data: any) => {
    if (data.sessionId) setSessionId(data.sessionId);
    if (data.state) setState(data.state);
    if (data.currentSection !== undefined) setCurrentSection(data.currentSection);
    if (data.currentConcept) setCurrentConcept(data.currentConcept);
    if (data.teacherSpeech) setTeacherSpeech(data.teacherSpeech);
    if (data.teacherAction) setTeacherAction(data.teacherAction);
    if (data.visual) setVisual(data.visual);
    if (data.question) setQuestion(data.question);
    if (data.masteryScore !== undefined) setMasteryScore(data.masteryScore);
    if (data.language) setLanguage(data.language);
    if (data.difficulty) setDifficulty(data.difficulty);
    if (data.personality) setPersonality(data.personality);
    if (data.evaluation) setEvaluation(data.evaluation);
  };

  // Speech narration handler
  const speak = (text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;

    if (lang === 'hi' || lang === 'hinglish') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'ta') {
      utterance.lang = 'ta-IN';
    } else if (lang === 'es') {
      utterance.lang = 'es-ES';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice recognition toggle
  const toggleVoiceInput = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceActive(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' || language === 'hinglish' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => setIsVoiceActive(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setStudentAnswer(transcript);
      setIsVoiceActive(false);
    };
    recognition.onerror = () => setIsVoiceActive(false);
    recognition.onend = () => setIsVoiceActive(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 2. Submit student response to checkpoint
  const handleAnswerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentAnswer.trim() || isLoading) return;

    handleStopSpeech();
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentAnswer,
          isVoice: isVoiceActive,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, language);
        setStudentAnswer('');
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Continue teaching loop
  const handleContinue = async () => {
    handleStopSpeech();
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, language);
      }
    } catch (err) {
      console.error('Failed to continue session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Explain Again
  const handleExplainAgain = async () => {
    handleStopSpeech();
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/explain-again', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, language);
      }
    } catch (err) {
      console.error('Failed to explain again:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Simplify
  const handleSimplify = async () => {
    handleStopSpeech();
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, language);
      }
    } catch (err) {
      console.error('Failed to simplify:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Give Example
  const handleExample = async () => {
    handleStopSpeech();
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, language);
      }
    } catch (err) {
      console.error('Failed to get example:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Change Language
  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    handleStopSpeech();
    setLanguage(newLang);
    setIsLoading(true);

    try {
      const res = await fetch('/api/teaching/change-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, newLanguage: newLang }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        applySessionData(json.data);
        speak(json.data.teacherSpeech, newLang);
      }
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. TOP CLASSROOM NAV & PROGRESS BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                AI Teaching Room
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                State: {state}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {difficulty.toUpperCase()}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              {currentConcept}
            </h1>
          </div>

          {/* Quick Config: Personality & Language */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Personality Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value as TeacherPersonality)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="Friendly" className="bg-slate-900">Friendly</option>
                <option value="Strict" className="bg-slate-900">Strict</option>
                <option value="Socratic" className="bg-slate-900">Socratic</option>
                <option value="Exam Coach" className="bg-slate-900">Exam Coach</option>
                <option value="Patient" className="bg-slate-900">Patient</option>
                <option value="Professional" className="bg-slate-900">Professional</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="en" className="bg-slate-900">English</option>
                <option value="hi" className="bg-slate-900">Hindi (हिंदी)</option>
                <option value="hinglish" className="bg-slate-900">Hinglish</option>
                <option value="ne" className="bg-slate-900">Nepali (नेपाली)</option>
                <option value="ta" className="bg-slate-900">Tamil (தமிழ்)</option>
                <option value="es" className="bg-slate-900">Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lesson Progress & Mastery Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:flex-1">
            <div className="flex justify-between text-slate-400 mb-1 font-medium text-[11px]">
              <span>Section {currentSection + 1} Progress</span>
              <span>Concept Mastery: {masteryScore}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.max(15, masteryScore || (currentSection + 1) * 35)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPLIT CLASSROOM: TEACHER AREA (LEFT) & CHALKBOARD VISUAL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Teacher Avatar & Dialogue */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex-1 min-h-[340px]">
            <TeacherAvatar
              isSpeaking={isSpeaking}
              language={language}
              teacherName={`Prof. Maya (${personality})`}
            />
          </div>

          {/* Teacher Speech Bubble Box */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs sm:text-sm leading-relaxed relative overflow-hidden shadow-lg">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
                Teacher Speech ({teacherAction})
              </span>
              <button
                type="button"
                onClick={() => isSpeaking ? handleStopSpeech() : speak(teacherSpeech, language)}
                className="text-slate-400 hover:text-white p-1"
                title="Re-read teacher speech"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-200 leading-relaxed font-normal">
              {teacherSpeech}
            </p>
          </div>
        </div>

        {/* Right Column: Chalkboard Visual Reasoning Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex-1 min-h-[340px]">
            <ChalkboardVisual
              visual={visual}
              conceptTitle={currentConcept}
            />
          </div>

          {/* Remediation or Evaluation Banner */}
          {evaluation && !evaluation.isCorrect && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4" />
                Adaptive Misconception Detected
              </div>
              <p className="text-slate-300 leading-relaxed">
                {evaluation.misconceptionDiagnosis || evaluation.feedback}
              </p>
            </div>
          )}

          {evaluation && evaluation.isCorrect && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Concept Mastered! {evaluation.feedback}
            </div>
          )}
        </div>
      </div>

      {/* 3. QUESTION & INTERACTION WORKSPACE */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {/* Question Area */}
        {question && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Checkpoint Question ({question.type})
              </span>
              <span className="text-[11px] text-slate-400">Type or dictate response</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-white leading-snug">
              {question.prompt}
            </p>

            {/* MCQ Options Display (if available) */}
            {question.options && question.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStudentAnswer(opt)}
                    className={`p-3 rounded-xl text-left text-xs font-medium border transition-all ${
                      studentAnswer === opt
                        ? 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="inline-block w-5 font-bold text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Real-Time Multilingual Voice Interaction Bar */}
        <VoiceInteractionBar
          sessionId={sessionId}
          language={language}
          disabled={isLoading}
          onTranscriptReceived={(transcript) => {
            setStudentAnswer(transcript);
          }}
          onVoiceResponseReceived={(speech) => {
            setTeacherSpeech(speech);
          }}
        />

        {/* Optional Text Answer Input Field (Voice is Optional) */}
        <form onSubmit={handleAnswerSubmit} className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl border transition-all ${
              isVoiceActive
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Dictate with voice"
          >
            {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder={question ? 'Type your answer or select an option above...' : 'Type your question or response to the teacher...'}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
          />

          <button
            type="submit"
            disabled={!studentAnswer.trim() || isLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-sky-500/20 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
        </form>

        {/* Teacher Quick-Action Buttons Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExplainAgain}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
              title="Provide fresh explanation"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Explain Again
            </button>

            <button
              type="button"
              onClick={handleSimplify}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
              title="Lower difficulty to foundational level"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Simplify
            </button>

            <button
              type="button"
              onClick={handleExample}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
              title="Provide concrete worked scenario"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Give Example
            </button>
          </div>

          {/* Continue / Next Concept Button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
          >
            <span>Continue Teaching</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
