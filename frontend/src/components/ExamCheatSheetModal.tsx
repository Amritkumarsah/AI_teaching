"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Printer,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  GraduationCap
} from "lucide-react";

interface FormulaItem {
  name: string;
  formula: string;
  variables: string;
  takeaway: string;
}

interface TrapItem {
  trap: string;
  correction: string;
  tag: string;
}

interface SolvedProblem {
  problem: string;
  solution: string[];
  answer: string;
}

interface CheatSheetData {
  topic: string;
  target_exam: string;
  formulas: FormulaItem[];
  common_traps: TrapItem[];
  solved_problems: SolvedProblem[];
  key_mnemonics: string[];
}

interface ExamCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
}

export const ExamCheatSheetModal: React.FC<ExamCheatSheetModalProps> = ({
  isOpen,
  onClose,
  topic = "Newtonian Mechanics"
}) => {
  const [data, setData] = useState<CheatSheetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"formulas" | "traps" | "problems" | "mnemonics">("formulas");

  useEffect(() => {
    if (!isOpen) return;

    const fetchCheatSheet = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/exam-cheat-sheet");
        if (res.ok) {
          const json = await res.json();
          const normalized: CheatSheetData = {
            topic: json.topic || topic,
            target_exam: json.exam_badge || "JEE / NEET / Boards",
            formulas: (json.key_formulas || json.formulas || []).map((f: any) => ({
              name: f.name || "Formula",
              formula: f.equation || f.formula || "",
              variables: f.si_units || f.variables || "",
              takeaway: f.note || f.takeaway || ""
            })),
            common_traps: (json.common_exam_traps || json.common_traps || []).map((t: any) => ({
              trap: t.trap || "",
              correction: t.explanation || t.correction || "",
              tag: t.severity || t.tag || "CRITICAL"
            })),
            solved_problems: (json.solved_practice_problems || json.solved_problems || []).map((p: any) => ({
              problem: p.problem || "",
              solution: Array.isArray(p.solution_steps)
                ? p.solution_steps
                : Array.isArray(p.solution)
                ? p.solution
                : typeof p.solution_steps === "string"
                ? p.solution_steps.split(". ").filter(Boolean)
                : typeof p.solution === "string"
                ? p.solution.split(". ").filter(Boolean)
                : [],
              answer: p.answer || (Array.isArray(p.solution_steps) ? p.solution_steps[p.solution_steps.length - 1] : "See solved step above")
            })),
            key_mnemonics: json.rapid_revision_mnemonics || json.key_mnemonics || [
              "F = ma : Push harder -> Accelerate faster",
              "Action & Reaction : Act on distinct bodies and never cancel"
            ]
          };
          setData(normalized);
        }
      } catch (err) {
        console.error("Failed to load exam cheat sheet:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheatSheet();
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  High-Yield Exam Cram & Cheat Sheet
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  JEE / NEET / Boards
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Essential formulas, high-frequency examiner traps & worked step-by-step numericals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("formulas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "formulas"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Formulas ({data?.formulas.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab("traps")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "traps"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exam Traps ({data?.common_traps.length || 3})</span>
          </button>

          <button
            onClick={() => setActiveTab("problems")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "problems"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Worked Numericals</span>
          </button>

          <button
            onClick={() => setActiveTab("mnemonics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "mnemonics"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Mnemonics</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-medium">Synthesizing high-yield exam sheet...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: FORMULAS */}
              {activeTab === "formulas" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data?.formulas.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                            {item.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 font-mono rounded">
                            Core Law
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-900 border border-cyan-500/20 rounded-lg text-center my-2 font-mono text-base font-extrabold text-white tracking-wide shadow-inner">
                          {item.formula}
                        </div>

                        <div className="space-y-1.5 mt-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Variables: </span>
                            <span className="text-slate-200 font-mono text-[11px]">{item.variables}</span>
                          </div>
                          <div>
                            <span className="text-amber-400 font-medium">Core Takeaway: </span>
                            <span className="text-slate-300">{item.takeaway}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: EXAM TRAPS & MISCONCEPTIONS */}
              {activeTab === "traps" && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>Examiners frequently set negative-marking traps around these exact misconceptions. Review carefully before mock tests.</span>
                  </div>

                  <div className="space-y-3">
                    {data?.common_traps.map((trap, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950/70 border border-rose-500/30 rounded-xl space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                            {trap.tag}
                          </span>
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Common Mistake
                          </span>
                        </div>

                        <div className="text-sm font-medium text-rose-200 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
                          {trap.trap}
                        </div>

                        <div className="text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/40 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-400">Correct Understanding: </span>
                            <span>{trap.correction}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SOLVED STEP-BY-STEP PROBLEMS */}
              {activeTab === "problems" && (
                <div className="space-y-4">
                  {data?.solved_problems.map((prob, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">
                          {prob.problem}
                        </h4>
                      </div>

                      <div className="pl-8 space-y-1.5 border-l-2 border-slate-800">
                        {prob.solution.map((step, sIdx) => (
                          <div key={sIdx} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pl-8 pt-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Final Answer: {prob.answer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MNEMONICS */}
              {activeTab === "mnemonics" && (
                <div className="space-y-3">
                  {data?.key_mnemonics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-950/50 to-slate-950/50 border border-amber-500/30 rounded-xl flex items-center gap-3.5"
                    >
                      <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg flex-shrink-0">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                          Memory Hook #{idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-200 mt-0.5">
                          {m}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Teacher Revision Suite • Section 18 Advanced Exam Mode</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition cursor-pointer shadow-sm"
          >
            Done Revising
          </button>
        </div>
      </div>
    </div>
  );
};
