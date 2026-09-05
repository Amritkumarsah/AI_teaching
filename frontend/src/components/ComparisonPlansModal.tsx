"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  GraduationCap,
  Microscope,
  ArrowRight,
  Layers,
  HelpCircle,
  BarChart2,
  Sliders
} from "lucide-react";

interface ComparisonPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopic?: string;
  docId?: string | null;
  currentLanguage?: string;
  onApplyPlan?: (plan: any) => void;
}

export const ComparisonPlansModal: React.FC<ComparisonPlansModalProps> = ({
  isOpen,
  onClose,
  currentTopic = "Newton's Laws of Motion",
  docId = "newtons_laws",
  currentLanguage = "en",
  onApplyPlan
}) => {
  const [plans, setPlans] = useState<any | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<"5min" | "20min" | "60min">("20min");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch("http://localhost:8000/api/comparison-plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching comparison plans:", err);
        setIsLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlan = plans ? plans[selectedBudget] : null;

  // Pedagogical descriptions tailored to selected time budget
  const budgetDetails = {
    "5min": {
      title: "5-Minute Ultra-Concise Core Sprint",
      badge: "⚡ 5-Minute Sprint",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: Zap,
      iconColor: "text-amber-400",
      pacing: "~2.0 mins / concept",
      cognitiveLoad: "Low / High-Speed Primer",
      rigor: "Conceptual Intuition Only (No Complex Derivations)",
      targetAudience: "Quick revision, last-minute exam prep, rapid introduction",
      strategy:
        "Strips historical context and non-essential algebraic formulations. Targets 100% of student focus on the single foundational axiom. Deploys 1 instant visual simulation and finishes with a rapid sanity checkpoint question to verify the core intuition without cognitive fatigue."
    },
    "20min": {
      title: "20-Minute Standard Pedagogical Mastery",
      badge: "🎓 20-Minute Standard (Recommended)",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: GraduationCap,
      iconColor: "text-cyan-400",
      pacing: "~4.0 mins / concept",
      cognitiveLoad: "Balanced / Step-by-Step",
      rigor: "Standard Core Formulations & Real-World Mechanics",
      targetAudience: "Regular classroom study, deep conceptual retention, semester exams",
      strategy:
        "The gold-standard adaptive lesson. Progresses logically from intuitive real-world observations to fundamental governing laws and interactive 3D simulations. Features 2–3 formative checkpoints specifically diagnosing common misconceptions (e.g. Aristotelian force traps, canceling action-reaction fallacy)."
    },
    "60min": {
      title: "60-Minute Comprehensive Rigorous Mastery",
      badge: "🔬 60-Minute Deep Dive",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      icon: Microscope,
      iconColor: "text-indigo-400",
      pacing: "~4.5 mins / concept + Interactive Labs",
      cognitiveLoad: "High Rigor / Academic Depth",
      rigor: "Full Mathematical Derivations & Edge Cases",
      targetAudience: "Competitive entrance exams (JEE, NEET, Olympiads), engineering deep-dives",
      strategy:
        "Thorough academic curriculum. Formulates mathematical proofs from first principles (dp/dt = m*a, calculus velocity limits). Explores counter-intuitive edge cases, multi-body free-body diagrams, hands-on parameter experimentation, and ends with a comprehensive multi-question summative assessment."
    }
  };

  const activeMeta = budgetDetails[selectedBudget];
  const ActiveIcon = activeMeta.icon;

  const handleApply = () => {
    if (currentPlan && onApplyPlan) {
      onApplyPlan(currentPlan);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  Time-Budget & Depth Selection
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded font-semibold uppercase">
                  Adaptive Architectures
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your available time: The AI Teacher automatically restructures lesson depth, pacing, and 3D simulation complexity.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Time Selector Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Select Learning Duration:</span>
          </div>

          <div className="flex items-center gap-2">
            {(["5min", "20min", "60min"] as const).map((key) => {
              const isSelected = selectedBudget === key;
              const meta = budgetDetails[key];
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedBudget(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{key === "5min" ? "5 Minutes" : key === "20min" ? "20 Minutes" : "60 Minutes"}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Side-by-Side Clickable Budget Cards */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Three Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["5min", "20min", "60min"] as const).map((key) => {
              const isSelected = selectedBudget === key;
              const meta = budgetDetails[key];
              const plan = plans ? plans[key] : null;
              const Icon = meta.icon;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedBudget(key)}
                  className={`p-5 rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-slate-900 border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400/50 scale-[1.02]"
                      : "bg-slate-950/70 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Active Selection Badge */}
                  {isSelected && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 text-[10px] font-bold font-mono rounded-full uppercase shadow-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Selection</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>
                      <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{meta.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{meta.targetAudience}</p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">CONCEPTS</span>
                        <span className="text-cyan-300 font-bold text-xs">
                          {plan?.concepts_count || (key === "5min" ? 2 : key === "20min" ? 4 : 5)} Core Topics
                        </span>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">PACING</span>
                        <span className="text-emerald-400 font-bold text-xs">{meta.pacing}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Planned: <strong className="text-slate-200">{plan?.actual_planned_minutes || (key === "5min" ? 4 : key === "20min" ? 16 : 21)} mins</strong>
                    </span>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${isSelected ? "text-cyan-400" : "text-slate-500"}`}>
                      <span>{isSelected ? "Selected" : "Click to select"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Architecture Analysis */}
          <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ActiveIcon className={`w-5 h-5 ${activeMeta.iconColor}`} />
                <h4 className="text-sm font-bold text-slate-100 font-mono tracking-wide uppercase">
                  Selected Time Architecture Analysis ({selectedBudget.toUpperCase()})
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Cognitive Load: <strong className="text-slate-100">{activeMeta.cognitiveLoad}</strong>
              </span>
            </div>

            {/* Pedagogical Strategy Description */}
            <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <span className="text-[11px] font-bold text-cyan-400 uppercase font-mono tracking-wide block">
                Pedagogical Strategy & Pacing:
              </span>
              <p className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                {activeMeta.strategy}
              </p>
            </div>

            {/* Concepts Included In Selected Plan */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase font-mono tracking-wide block flex items-center justify-between">
                <span>Planned Concept Progression ({currentPlan?.concepts?.length || (selectedBudget === "5min" ? 2 : selectedBudget === "20min" ? 4 : 5)} Milestones):</span>
                <span className="text-slate-500 font-normal">Click "Apply & Start Lesson" to begin with this sequence</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentPlan?.concepts?.map((c: any, idx: number) => (
                  <div
                    key={c.id || idx}
                    className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-1 text-xs hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-cyan-300 truncate max-w-[240px]">
                        #{idx + 1}. {c.title}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800">
                        {Math.round((c.estimated_seconds || 150) / 60)} mins
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {c.explanation_focus || c.analogy}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                      <span>Visual: <strong className="text-indigo-300">{c.visual_type || "3D_SIMULATION"}</strong></span>
                      {c.checkpoint_question && (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Checkpoint
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Selected Duration:</span>
            <strong className="text-cyan-300">
              {selectedBudget === "5min" ? "5 Minutes" : selectedBudget === "20min" ? "20 Minutes" : "60 Minutes"}
            </strong>
            <span className="text-slate-600">•</span>
            <span>
              {currentPlan?.concepts?.length || (selectedBudget === "5min" ? 2 : selectedBudget === "20min" ? 4 : 5)} Concepts
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <span>Apply & Start {selectedBudget === "5min" ? "5-Min" : selectedBudget === "20min" ? "20-Min" : "60-Min"} Lesson</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
