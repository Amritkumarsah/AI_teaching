import React, { useState, useEffect } from 'react';
import { IQuestion, IEvaluationResult } from '@ai-teacher/types';
import { HelpCircle, Mic, MicOff, Send, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckpointModalProps {
  isOpen: boolean;
  question: IQuestion;
  onAnswerSubmitted: (evaluation: IEvaluationResult) => void;
  onContinue: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  isOpen,
  question,
  onAnswerSubmitted,
  onContinue,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<IEvaluationResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  // Voice recognition handler
  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    const finalAnswer = selectedOption || textAnswer;
    if (!finalAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/teaching/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          studentAnswer: finalAnswer,
          isVoice: isListening,
        }),
      });

      const json = await response.json();
      if (json.success && json.data?.evaluation) {
        const evalRes: IEvaluationResult = json.data.evaluation;
        setEvaluation(evalRes);
        onAnswerSubmitted(evalRes);

        if (evalRes.isCorrect) {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        }
      }
    } catch {
      // Fallback local evaluation if backend endpoint is unreachable
      const isCorrect = finalAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase());
      const fallbackEval: IEvaluationResult = {
        isCorrect,
        score: isCorrect ? 10 : 3,
        feedback: isCorrect
          ? 'Great job! You grasped the physical mechanism clearly.'
          : 'Notice: Inertia keeps the system moving perpetually without continuous force.',
        hasMisconception: !isCorrect,
        misconceptionDiagnosis: !isCorrect ? 'Continuous Force Trap' : undefined,
        remediationAnalogy: !isCorrect
          ? 'Imagine a curling stone on smooth ice: once released, it glides across the sheet with no continuous pushing required.'
          : undefined,
      };
      setEvaluation(fallbackEval);
      onAnswerSubmitted(fallbackEval);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Checkpoint Question</h2>
              <p className="text-xs text-slate-400">Let's check your understanding before moving on</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {question.type}
          </span>
        </div>

        {/* Question Prompt */}
        <div className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
          {question.prompt}
        </div>

        {/* MCQ Options (if available) */}
        {!evaluation && question.options && question.options.length > 0 && (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedOption(opt); setTextAnswer(opt); }}
                className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm transition-all border ${
                  selectedOption === opt
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-medium'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="font-bold mr-2 text-slate-500">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Free text & Voice input */}
        {!evaluation && (
          <div className="relative">
            <textarea
              rows={3}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your explanation or click the microphone to speak..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title="Speak your answer"
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {/* Evaluation & Adaptive Remediation Display */}
        {evaluation && (
          <div className="space-y-4 animate-fade-in">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                evaluation.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              {evaluation.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  {evaluation.isCorrect ? 'Correct! (+10 Understanding)' : 'Concept Misconception Diagnosed (-5)'}
                </div>
                <div className="text-xs mt-1 text-slate-300 leading-relaxed">
                  {evaluation.feedback}
                </div>
              </div>
            </div>

            {/* Remediation Analogy Box */}
            {evaluation.remediationAnalogy && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Teacher Remediation Analogy
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {evaluation.remediationAnalogy}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {!evaluation ? (
            <button
              type="button"
              disabled={isEvaluating || (!selectedOption && !textAnswer.trim())}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Answer
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEvaluation(null);
                setSelectedOption('');
                setTextAnswer('');
                onContinue();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              Continue Lesson
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
