"use client";

import React, { useEffect, useState } from "react";
import { User, BookOpen, Clock, Award, CheckCircle2, Lock, ArrowRight, Sparkles, RefreshCw, FileText } from "lucide-react";

interface DashboardViewProps {
  onStartLesson: (topic: string, conceptIndex?: number) => void;
  onBackToUpload: () => void;
  activeTopic?: string;
  docId?: string | null;
  lessonPlan?: any | null;
  learnerProfile?: any | null;
  sessionScores?: number[];
  completedConcepts?: string[];
  currentLanguage?: string;
  activeConceptIndex?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartLesson,
  onBackToUpload,
  activeTopic = "Physics",
  docId = null,
  lessonPlan = null,
  learnerProfile = null,
  sessionScores = [],
  completedConcepts = [],
  currentLanguage = "en",
  activeConceptIndex = 0
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [learningPath, setLearningPath] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const topicParam = encodeURIComponent(lessonPlan?.topic || activeTopic || "physics");
      const docIdParam = docId ? `&doc_id=${encodeURIComponent(docId)}` : "";
      const [profRes, pathRes] = await Promise.all([
        fetch("http://localhost:8000/api/learner-profile?learner_id=default_student"),
        fetch(`http://localhost:8000/api/learning-path?topic=${topicParam}${docIdParam}`)
      ]);
      const profData = await profRes.json();
      const pathData = await pathRes.json();
      setProfile(profData.profile);
      setLearningPath(pathData.learning_path);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTopic, docId, lessonPlan?.topic]);

  const cleanTopicName = lessonPlan?.topic || activeTopic || "Uploaded Course Material";
  const effectiveStudentName = learnerProfile?.student_name || learnerProfile?.name || profile?.name || "Student";
  const effectiveLevel = learnerProfile?.level || lessonPlan?.learner_level || profile?.default_level || "Intermediate";
  const effectiveLanguage = currentLanguage || lessonPlan?.language || profile?.preferred_language || "en";
  const effectiveAvgScore = (sessionScores && sessionScores.length > 0)
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : (profile?.avg_score || 88);

  // Dynamically derive modules from the uploaded lesson plan if available, else use backend path
  const effectiveLearningPath = React.useMemo(() => {
    if (lessonPlan && lessonPlan.concepts && lessonPlan.concepts.length > 0) {
      const concepts = lessonPlan.concepts;
      const modules = concepts.map((concept: any, idx: number) => {
        const isCompleted = completedConcepts?.includes(concept.id || concept.title) || (idx < activeConceptIndex);
        const isInProgress = idx === activeConceptIndex;
        const isUnlocked = idx <= Math.max(1, completedConcepts.length);
        const status = isCompleted ? "COMPLETED" : (isInProgress ? "IN_PROGRESS" : (isUnlocked ? "UNLOCKED" : "LOCKED"));
        const score = isCompleted ? (sessionScores[idx] || 90) : null;
        return {
          id: concept.id || `mod_${idx + 1}`,
          title: `Module ${idx + 1}: ${concept.title}`,
          prerequisites: idx > 0 ? [`mod_${idx}`] : [],
          status,
          score,
          estimated_hours: Math.max(1, Math.round((concept.estimated_seconds || 240) / 60)),
          key_concepts: concept.key_takeaways?.slice(0, 4) || [concept.title]
        };
      });
      const completedCount = modules.filter((m: any) => m.status === "COMPLETED").length;
      return {
        domain: "uploaded_document",
        track_title: `Mastery Curriculum: ${cleanTopicName}`,
        progress_percentage: Math.round((completedCount / modules.length) * 100),
        modules_completed: completedCount,
        total_modules: modules.length,
        current_recommended_module: modules.find((m: any) => m.status === "IN_PROGRESS") || modules[0],
        modules
      };
    }
    return learningPath;
  }, [lessonPlan, learningPath, completedConcepts, activeConceptIndex, sessionScores, cleanTopicName]);

  if (loading && !effectiveLearningPath) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
        <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
        <span className="text-sm font-medium">Loading Real-Time Learning Path for {cleanTopicName}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Personalized Warmup / Recall Banner */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-cyan-950/70 border border-indigo-500/40 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-cyan-300 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Personalized AI Teacher Memory
            </span>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              Welcome back! Dr. Arya remembers your progress in <strong className="text-cyan-300">{cleanTopicName}</strong>. Ready to master the next concepts?
            </p>
          </div>
        </div>

        <button
          onClick={() => onStartLesson(cleanTopicName, activeConceptIndex || 0)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          Start Lesson Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Student Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Learner Profile</div>
            <div className="text-base font-bold text-slate-100">{effectiveStudentName}</div>
            <div className="text-[11px] text-cyan-400 capitalize">{effectiveLevel} Level</div>
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Average Score</div>
            <div className="text-2xl font-black text-emerald-400">{effectiveAvgScore}%</div>
            <div className="text-[11px] text-slate-500">Across all checkpoints</div>
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Active Curriculum</div>
            <div className="text-sm font-bold text-indigo-300 truncate max-w-[150px]">{cleanTopicName}</div>
            <div className="text-[11px] text-slate-500">{docId ? "From Uploaded Document" : "Curriculum Track"}</div>
          </div>
        </div>

        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-md">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Preferred Language</div>
            <div className="text-base font-bold text-amber-300">
              {effectiveLanguage === "hi"
                ? "Hindi (हिंदी)"
                : effectiveLanguage === "hinglish"
                ? "English / Hinglish"
                : "English (US)"}
            </div>
            <div className="text-[11px] text-slate-500">Neural Voice & Visuals</div>
          </div>
        </div>
      </div>

      {/* 3. Multi-Module Curriculum Track & Dependency Roadmap */}
      {effectiveLearningPath && (
        <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  Active Curriculum Track
                </span>
                {docId && (
                  <span className="px-2 py-0.2 bg-indigo-500/20 text-cyan-300 text-[10px] font-mono rounded-full border border-indigo-500/30 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Real Document Modules
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                {effectiveLearningPath.track_title}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {effectiveLearningPath.modules_completed} of {effectiveLearningPath.total_modules} Modules Completed
              </span>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                  style={{ width: `${effectiveLearningPath.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {effectiveLearningPath.modules?.map((mod: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  mod.status === "COMPLETED"
                    ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200"
                    : mod.status === "IN_PROGRESS"
                    ? "bg-indigo-950/30 border-cyan-400/50 text-slate-100 shadow-md shadow-cyan-500/5"
                    : mod.status === "UNLOCKED"
                    ? "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                    : "bg-slate-950/20 border-slate-800/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      mod.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : mod.status === "IN_PROGRESS"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {mod.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : mod.status === "LOCKED" ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </span>

                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span>{mod.title}</span>
                      {mod.status === "IN_PROGRESS" && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-cyan-300 text-[10px] font-bold rounded border border-indigo-500/30">
                          Active Focus
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>Concepts: {mod.key_concepts?.join(", ")}</span>
                      <span>•</span>
                      <span>{mod.estimated_hours} Hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  {mod.status === "COMPLETED" ? (
                    <span className="px-3 py-1 bg-emerald-950/40 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                      Score: {mod.score}%
                    </span>
                  ) : mod.status === "IN_PROGRESS" || mod.status === "UNLOCKED" ? (
                    <button
                      onClick={() => onStartLesson(mod.title, idx)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      Study Module
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Locked (Prereq Required)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-start">
        <button
          onClick={onBackToUpload}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          ← Back to Classroom Studio
        </button>
      </div>
    </div>
  );
};
