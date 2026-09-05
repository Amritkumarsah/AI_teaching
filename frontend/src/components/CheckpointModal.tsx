"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Sparkles, RefreshCw, Send, X } from "lucide-react";
import { saveAssessmentResult } from "@/lib/firebase";

interface CheckpointModalProps {
  question: any;
  onAnswerSubmit: (answer: any) => Promise<any>;
  onContinue: () => void;
  onClose?: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  question,
  onAnswerSubmit,
  onContinue,
  onClose
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);

  if (!question) return null;

  const isMCQ =
    question.type === "mcq" ||
    (Array.isArray(question.options) && question.options.length > 0);
  const typeDisplay = (question.type || (isMCQ ? "MCQ" : "Concept")).toUpperCase();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const answerPayload = isMCQ ? selectedOption : textAnswer;
      const res = await onAnswerSubmit(answerPayload);
      setEvaluation(res);
      // Auto-save student response and AI feedback to Firebase Firestore
      saveAssessmentResult("student_default", {
        question: question.question || question.title || "Checkpoint",
        answer: answerPayload,
        evaluation: res,
        type: isMCQ ? "mcq" : "text"
      }).catch(err => console.warn("Firestore save assessment notice:", err));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForBranch = () => {
    setEvaluation(null);
    setSelectedOption(null);
    setTextAnswer("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/20 text-cyan-400 border border-indigo-500/30">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                Interactive Concept Checkpoint
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Teacher Pauses to Check Your Intuition
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs rounded-full font-mono">
              Type: {typeDisplay}
            </span>
            <button
              onClick={onClose || onContinue}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close checkpoint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl mb-6">
          <p className="text-base font-medium text-slate-200 leading-relaxed">
            {question.question || question.prompt || "Conceptual Checkpoint Question"}
          </p>
        </div>

        {/* Input Phase (When not evaluated yet) */}
        {!evaluation && (
          <div className="space-y-4">
            {isMCQ ? (
              <div className="space-y-2.5">
                {question.options?.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 border ${
                      selectedOption === idx
                        ? "bg-indigo-600/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                        selectedOption === idx
                          ? "bg-cyan-500 text-slate-950 border-cyan-400"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 block mb-2">
                  Type your explanation in your own words (or state your thought process):
                </label>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="e.g. Action and reaction forces act on different bodies..."
                  rows={4}
                  className="w-full p-3.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (isMCQ ? selectedOption === null : !textAnswer.trim())}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Evaluating Pedagogical Rubric...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Evaluation & Adaptive Remediation Phase */}
        {evaluation && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 1. Verdict Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                evaluation.verdict === "CORRECT"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : evaluation.verdict === "MISCONCEPTION"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}
            >
              {evaluation.verdict === "CORRECT" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm tracking-wide">
                  {evaluation.verdict === "CORRECT"
                    ? "Concept Mastered!"
                    : evaluation.verdict === "MISCONCEPTION"
                    ? "Misconception Diagnosed!"
                    : "Need More Practice"}
                </div>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                  {evaluation.feedback}
                </p>
              </div>
            </div>

            {/* 2. Adaptive Misconception Remediation Branch */}
            {evaluation.action === "re_explain_branch" && evaluation.re_explanation && (
              <div className="p-4 bg-indigo-950/50 border border-indigo-500/40 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Teacher Re-explains with a New Mental Model
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed italic">
                  "{evaluation.re_explanation}"
                </p>

                {evaluation.follow_up_question && (
                  <div className="pt-2 border-t border-indigo-500/20 text-xs text-cyan-200">
                    <strong>Targeted Reflection: </strong>
                    {evaluation.follow_up_question}
                  </div>
                )}
              </div>
            )}

            {/* Continue or Try Again Buttons */}
            <div className="flex items-center justify-between pt-2">
              {evaluation.verdict !== "CORRECT" && (
                <button
                  onClick={handleResetForBranch}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Question Again
                </button>
              )}

              <button
                onClick={onContinue}
                className="ml-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                Continue Lesson
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
