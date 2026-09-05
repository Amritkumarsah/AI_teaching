"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Lightbulb,
  X,
  Sparkles,
  Loader2,
  BookOpen,
  Award,
  Check,
  Flame
} from "lucide-react";
import { saveAssessmentResult } from "@/lib/firebase";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_idx: number;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  topic: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

type QuizMode = "TEST" | "SUMMARY" | "REVIEW";

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({
  isOpen,
  onClose,
  questions,
  topic,
  isLoading = false,
  onRetry
}) => {
  const [mode, setMode] = useState<QuizMode>("TEST");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "INCORRECT">("ALL");

  // Reset state when modal opens or questions change
  useEffect(() => {
    if (isOpen) {
      setMode("TEST");
      setCurrentIndex(0);
      setUserAnswers({});
      setScore(0);
      setSavedToFirebase(false);
      setReviewFilter("ALL");
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  const totalQuestions = questions?.length || 10;
  const currentQ = questions && questions.length > 0 ? questions[currentIndex] : null;
  const answeredCount = Object.keys(userAnswers).length;

  const handleSelectOption = (optIdx: number) => {
    if (mode !== "TEST") return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx
    }));
  };

  const handleSubmitQuiz = () => {
    // Calculate final score
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_idx) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setMode("SUMMARY");

    const percentage = Math.round((calculatedScore / totalQuestions) * 100);

    // Auto-save quiz attempt to Firebase Firestore
    saveAssessmentResult("student_default", {
      type: "10_question_exam",
      topic: topic || "Lesson Quiz",
      total_questions: totalQuestions,
      score: calculatedScore,
      percentage: percentage,
      user_answers: userAnswers,
      date: new Date().toISOString()
    })
      .then(() => setSavedToFirebase(true))
      .catch((err) => console.warn("Firebase quiz save notice:", err));
  };

  const handleRestart = () => {
    if (onRetry) {
      onRetry();
    } else {
      setMode("TEST");
      setCurrentIndex(0);
      setUserAnswers({});
      setScore(0);
      setSavedToFirebase(false);
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case "hard":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
            Hard
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
            Easy
          </span>
        );
    }
  };

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 text-cyan-400 border border-indigo-500/40 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  {mode === "TEST"
                    ? "10-Question Test Mode"
                    : mode === "REVIEW"
                    ? "Answer Review & Explanations"
                    : "Test Complete"}
                </span>
                {currentQ && getDifficultyBadge(currentQ.difficulty)}
              </div>
              <h3 className="text-sm font-bold text-slate-200 truncate max-w-md">
                {topic || "Topic Assessment"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === "TEST" && !isLoading && (
              <span className="text-xs px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-slate-300 font-mono">
                Answered: <strong className="text-cyan-400">{answeredCount}</strong>/{totalQuestions}
              </span>
            )}

            {mode === "REVIEW" && (
              <span className="text-xs px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-slate-300 font-mono">
                Score: <strong className="text-emerald-400">{score}</strong>/{totalQuestions}
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Navigator Pills (1 to 10) */}
        {!isLoading && questions && questions.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              {mode === "REVIEW" ? "Review Questions:" : "Questions:"}
            </span>

            <div className="flex items-center gap-1.5">
              {questions.map((q, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered = userAnswers[idx] !== undefined;
                const isCorrect = userAnswers[idx] === q.correct_idx;

                let pillClass = "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";

                if (mode === "REVIEW") {
                  if (isCorrect) {
                    pillClass = isCurrent
                      ? "bg-emerald-500 text-slate-950 font-bold border-emerald-300 ring-2 ring-emerald-500/40"
                      : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300";
                  } else {
                    pillClass = isCurrent
                      ? "bg-rose-500 text-slate-950 font-bold border-rose-300 ring-2 ring-rose-500/40"
                      : "bg-rose-950/60 border-rose-500/50 text-rose-300";
                  }
                } else {
                  // TEST mode
                  if (isCurrent) {
                    pillClass = "bg-cyan-500 text-slate-950 font-bold border-cyan-300 ring-2 ring-cyan-500/40";
                  } else if (isAnswered) {
                    pillClass = "bg-indigo-600/30 border-indigo-500/50 text-cyan-300";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      if (mode === "SUMMARY") setMode("REVIEW");
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${pillClass}`}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 relative z-10 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Generating 10 Tailored Questions with AI...
                </p>
                <p className="text-xs text-slate-400">
                  Grounding questions directly in your lesson material
                </p>
              </div>
            </div>
          ) : mode === "SUMMARY" ? (
            /* ========================================================= */
            /* PHASE 2: SCORE & SUBMISSION SUMMARY SCREEN                */
            /* ========================================================= */
            <div className="py-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center shadow-xl shadow-amber-500/10">
                  <Trophy className="w-12 h-12 text-amber-400" />
                </div>
                {score >= 7 && (
                  <span className="absolute -top-2 -right-2 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-extrabold rounded-full shadow-md uppercase">
                    Mastery!
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-slate-100">
                  Quiz Submitted!
                </h3>
                <p className="text-sm text-slate-300 max-w-md">
                  {score >= 8
                    ? "Shabash! You demonstrated outstanding conceptual mastery."
                    : score >= 5
                    ? "Good job! You have a solid grasp. Review the explanations below to master the rest."
                    : "Good attempt! Review the explanations for each question to clear all your doubts."}
                </p>
              </div>

              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Score</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono mt-1">
                    {score}/{totalQuestions}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Accuracy</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {Math.round((score / totalQuestions) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Status</span>
                  <span className="text-base font-bold text-amber-400 mt-2 flex items-center gap-1">
                    {score >= 7 ? "PASSED ✓" : "PRACTICE"}
                  </span>
                </div>
              </div>

              {savedToFirebase && (
                <div className="flex items-center gap-2 text-xs text-cyan-300/80 bg-cyan-950/40 border border-cyan-800/50 px-3.5 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Assessment saved to Student Learning Profile
                </div>
              )}

              {/* Action Buttons: Review Explanations or Retry */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-md">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setMode("REVIEW");
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-950" />
                  Review Answers & Explanations
                </button>

                <button
                  onClick={handleRestart}
                  className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* ========================================================= */
            /* PHASE 1 (TEST) & PHASE 3 (REVIEW) QUESTION CARD          */
            /* ========================================================= */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question Subheader */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>

                {mode === "TEST" ? (
                  <span className="text-xs text-slate-400">
                    {userAnswers[currentIndex] !== undefined ? "✓ Selected (can change anytime)" : "Select your answer"}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      userAnswers[currentIndex] === currentQ.correct_idx
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {userAnswers[currentIndex] === currentQ.correct_idx ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+1)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Question Text Box */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl shadow-inner">
                <p className="text-base font-semibold text-slate-100 leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Option Buttons */}
              <div className="space-y-2.5">
                {currentQ.options?.map((optionText, optIdx) => {
                  const isSelectedByUser = userAnswers[currentIndex] === optIdx;
                  const isCorrect = optIdx === currentQ.correct_idx;

                  let buttonStyles =
                    "bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700";
                  let optionLetterStyle = "bg-slate-800 text-slate-400";

                  if (mode === "TEST") {
                    // TEST MODE: Only show user selection, NO green/red or right/wrong
                    if (isSelectedByUser) {
                      buttonStyles =
                        "bg-indigo-600/30 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10";
                      optionLetterStyle = "bg-cyan-400 text-slate-950 font-bold";
                    }
                  } else {
                    // REVIEW MODE: Show correct answer in green, wrong student choice in red
                    if (isCorrect) {
                      buttonStyles =
                        "bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10";
                      optionLetterStyle = "bg-emerald-500 text-slate-950 font-bold";
                    } else if (isSelectedByUser && !isCorrect) {
                      buttonStyles =
                        "bg-rose-950/40 border-rose-500 text-rose-200 shadow-md shadow-rose-500/10";
                      optionLetterStyle = "bg-rose-500 text-slate-950 font-bold";
                    } else {
                      buttonStyles = "bg-slate-950/20 border-slate-900 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={mode === "REVIEW"}
                      className={`w-full p-3.5 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border cursor-pointer ${buttonStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${optionLetterStyle}`}
                        >
                          {optionLetters[optIdx] || optIdx + 1}
                        </span>
                        <span className="leading-snug">{optionText}</span>
                      </div>

                      {/* Status indicator badge */}
                      {mode === "TEST" ? (
                        isSelectedByUser && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {isCorrect && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Correct Answer
                            </span>
                          )}
                          {isSelectedByUser && !isCorrect && (
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Your Choice
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Teacher's Detailed Explanation (ONLY VISIBLE IN REVIEW MODE AFTER SUBMITTING) */}
              {mode === "REVIEW" && (
                <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300 shadow-inner">
                  <span className="p-2 rounded-xl bg-indigo-500/20 text-cyan-400 shrink-0 mt-0.5 border border-indigo-500/30">
                    <Lightbulb className="w-4 h-4 text-amber-300" />
                  </span>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      Teacher's Explanation
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {currentQ.explanation ||
                        "Understanding this principle clarifies why the chosen option is correct."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No questions found. Please retry.
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isLoading && mode !== "SUMMARY" && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between relative z-10">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentIndex === 0
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-slate-300 hover:bg-slate-800 cursor-pointer"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Middle info / status */}
            <div className="text-xs text-slate-400 hidden sm:block">
              {mode === "TEST" ? (
                <span>
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
              ) : (
                <button
                  onClick={() => setMode("SUMMARY")}
                  className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Back to Score Card
                </button>
              )}
            </div>

            {/* Next / Submit / Done Buttons */}
            <div className="flex items-center gap-2">
              {mode === "TEST" ? (
                <>
                  {currentIndex + 1 < totalQuestions ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="py-2.5 px-4 font-bold rounded-xl text-xs flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700"
                    >
                      Next Question
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}

                  {/* Submit Quiz Button */}
                  <button
                    onClick={handleSubmitQuiz}
                    className={`py-2.5 px-5 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      answeredCount === totalQuestions
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95"
                        : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {answeredCount === totalQuestions
                      ? "Submit Quiz 📝"
                      : `Submit Quiz (${answeredCount}/${totalQuestions})`}
                  </button>
                </>
              ) : (
                /* REVIEW MODE BUTTONS */
                <>
                  {currentIndex + 1 < totalQuestions ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="py-2.5 px-4 font-bold rounded-xl text-xs flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                    >
                      Next Explanation
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="py-2.5 px-5 font-bold rounded-xl text-xs flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Finish Review
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
