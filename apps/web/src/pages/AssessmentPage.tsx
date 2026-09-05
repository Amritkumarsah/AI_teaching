import React, { useState, useEffect } from 'react';
import { IQuestion, IAssessmentResult } from '@ai-teacher/types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Send,
  Zap,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const AssessmentPage: React.FC = () => {
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<IAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  // 1. Fetch generated assessment with all 6 question types on mount
  useEffect(() => {
    async function loadAssessment() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/assessment/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: 'lesson_newton_mastery',
            topic: "Newton's Laws of Motion",
            difficulty,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setAssessmentId(json.data.assessmentId);
          setQuestions(json.data.questions);
        }
      } catch (err) {
        console.error('Failed to load assessment:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAssessment();
  }, [difficulty]);

  const handleAnswerChange = (qId: string, val: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  // 2. Submit assessment
  const handleSubmit = async () => {
    if (isSubmitting || questions.length === 0) return;
    setIsSubmitting(true);

    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        submittedAnswer: selectedAnswers[q.id] || '',
      }));

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          lessonId: 'lesson_newton_mastery',
          answers,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.result) {
        setResult(json.data.result);
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      }
    } catch (err) {
      console.error('Failed to submit assessment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.values(selectedAnswers).filter((a) => a && a.trim().length > 0).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Phase 7 — Mastery Evaluation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Final Concept Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Questions span MCQs, Short Answers, Conceptual, Applications, Problem Solving, and Explain-in-your-own-words.
          </p>
        </div>

        {/* Difficulty Selector */}
        {!result && (
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
            <span className="text-slate-400 font-medium">Difficulty:</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="beginner" className="bg-slate-900">Beginner</option>
              <option value="intermediate" className="bg-slate-900">Intermediate</option>
              <option value="advanced" className="bg-slate-900">Advanced</option>
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400" />
          <p className="text-sm">Synthesizing personalized assessment questions...</p>
        </div>
      ) : !result ? (
        /* Questions Form */
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-300 font-medium">
              Answered: {answeredCount} of {questions.length} questions
            </span>
            <div className="w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
              />
            </div>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Question {idx + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {q.type.replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                {q.prompt}
              </h3>

              {/* MCQ Options Display */}
              {q.options && q.options.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswerChange(q.id, opt)}
                      className={`w-full text-left p-3.5 rounded-xl text-xs sm:text-sm border transition-all ${
                        selectedAnswers[q.id] === opt
                          ? 'bg-sky-500/20 border-sky-400 text-white font-medium shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="font-bold mr-2.5 text-slate-400">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                /* Free Text Input for SHORT_ANSWER, PROBLEM_SOLVING, APPLICATION, EXPLAIN_IN_OWN_WORDS */
                <div className="pt-2">
                  <textarea
                    rows={q.type === 'EXPLAIN_IN_OWN_WORDS' ? 4 : 2}
                    value={selectedAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={
                      q.type === 'PROBLEM_SOLVING'
                        ? 'State your derivation formula and final numerical calculation...'
                        : q.type === 'EXPLAIN_IN_OWN_WORDS'
                        ? 'Explain clearly in your own intuitive words...'
                        : 'Type your concise answer here...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSubmitting || answeredCount === 0}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Grading Responses...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Assessment ({answeredCount}/{questions.length})
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* COMPREHENSIVE LEARNING REPORT                                             */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          {/* Main Score Banner */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Official Learning Report
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">Concept Assessment Summary</h2>
                </div>
              </div>

              <div className="flex items-center gap-8 text-center sm:text-right">
                <div>
                  <div className="text-4xl font-extrabold text-emerald-400 font-mono">
                    {result.percentage}%
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Score: {result.totalScore} / {result.maxScore}
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-sky-400 font-mono">
                    {result.accuracy}%
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Accuracy Rate</div>
                </div>
              </div>
            </div>

            {/* Strengths & Weak Areas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Strong Areas */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Strong Areas
                </h3>
                <div className="space-y-1.5">
                  {result.strongConcepts && result.strongConcepts.length > 0 ? (
                    result.strongConcepts.map((sc, i) => (
                      <div key={i} className="text-xs text-slate-200 flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span> {sc}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">None demonstrated yet. Practice will solidify these!</div>
                  )}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Weak Areas
                </h3>
                <div className="space-y-1.5">
                  {result.weakConcepts && result.weakConcepts.length > 0 ? (
                    result.weakConcepts.map((wc, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="text-amber-400 font-bold">•</span> {wc}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> No critical weak areas flagged!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Misconceptions Diagnosis */}
            {result.misconceptionsFound && result.misconceptionsFound.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Diagnosed Misconceptions
                </div>
                {result.misconceptionsFound.map((m, i) => (
                  <p key={i} className="text-slate-300 leading-relaxed">
                    • {m}
                  </p>
                ))}
              </div>
            )}

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Recommended Revision */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Recommended Revision
                </h3>
                <div className="space-y-1.5">
                  {result.recommendedRevisionTopics?.map((rt, i) => (
                    <div key={i} className="text-xs text-slate-300">
                      • {rt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Practice */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Recommended Practice
                </h3>
                <div className="space-y-1.5">
                  {result.recommendedPractice?.map((rp, i) => (
                    <div key={i} className="text-xs text-slate-300">
                      • {rp}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Topic Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-950 to-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Next Step In Learning Path
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">{result.nextSuggestedTopic}</h4>
              </div>
              <Link
                to="/classroom"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition-colors shrink-0 shadow-md shadow-indigo-500/25"
              >
                Start Next Lesson <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Detailed Question-by-Question Graded Breakdown */}
          {result.gradedAnswers && result.gradedAnswers.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Question Graded Breakdown
              </h3>
              <div className="space-y-3">
                {result.gradedAnswers.map((ga, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      ga.isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : ga.isPartial
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        {idx + 1}. [{ga.type.replace(/_/g, ' ')}] {ga.prompt}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          ga.isCorrect
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : ga.isPartial
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {ga.score} / 10 pts {ga.isPartial ? '(Partial Credit)' : ''}
                      </span>
                    </div>

                    <div className="text-slate-400">
                      <strong className="text-slate-300">Your Answer:</strong> {ga.submittedAnswer || '(Blank)'}
                    </div>
                    {!ga.isCorrect && (
                      <div className="text-slate-400">
                        <strong className="text-slate-300">Correct Principle:</strong> {ga.correctAnswer}
                      </div>
                    )}
                    <div className="text-slate-400 italic">
                      {ga.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
