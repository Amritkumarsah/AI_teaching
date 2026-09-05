"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Award, CheckCircle2, AlertCircle, ArrowRight, BookOpen, RotateCcw, Sparkles } from "lucide-react";

interface LearningReportModalProps {
  report: any;
  onRestart: () => void;
  onViewDashboard: () => void;
}

export const LearningReportModal: React.FC<LearningReportModalProps> = ({
  report,
  onRestart,
  onViewDashboard
}) => {
  useEffect(() => {
    // Fire celebratory confetti on high score
    if (report?.overall_score >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 mb-2">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            Official Learning Performance Assessment
          </span>
          <h2 className="text-2xl font-black text-slate-100">{report.topic}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalized mastery analysis based on checkpoint questions & pedagogical rubrics
          </p>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score & Grade Overview Card */}
          <div className="grid grid-cols-3 gap-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center">
            <div className="p-3">
              <div className="text-xs text-slate-400 uppercase font-semibold">Mastery Score</div>
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mt-1">
                {report.overall_score}%
              </div>
            </div>

            <div className="p-3 border-x border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">Evaluated Grade</div>
              <div className="text-4xl font-extrabold text-indigo-400 mt-1">
                {report.grade}
              </div>
            </div>

            <div className="p-3">
              <div className="text-xs text-slate-400 uppercase font-semibold">Certification</div>
              <div className="text-sm font-bold text-emerald-400 mt-2">
                {report.certificate_status || "Mastered"}
              </div>
            </div>
          </div>

          {/* Concepts Mastered */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Concepts Mastered in this Session
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.concepts_mastered?.map((c: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium"
                >
                  ✓ {c}
                </span>
              ))}
            </div>
          </div>

          {/* Strengths & Diagnosed Misconceptions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                Key Strengths Demonstrated
              </h5>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {report.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Misconceptions Resolved */}
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Misconceptions Addressed & Remediated
              </h5>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {report.misconceptions_resolved?.map((m: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Next Module */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                Recommended Curriculum Step
              </span>
              <div className="text-sm font-bold text-slate-100 mt-0.5">
                {report.recommended_next_topic}
              </div>
            </div>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold border border-cyan-500/30">
              Prerequisite Met
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            New Lesson Session
          </button>

          <button
            onClick={onViewDashboard}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Open Student Dashboard & Curriculum
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
