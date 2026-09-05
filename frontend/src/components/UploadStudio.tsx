"use client";

import React, { useState, useEffect } from "react";
import { Upload, FileText, Sparkles, Clock, Globe, BookOpen, CheckCircle, ArrowRight, RefreshCw, Compass, Calendar, X, Award, CheckCircle2 } from "lucide-react";

interface UploadStudioProps {
  onLessonReady: (plan: any, docId: string | null, profile: any) => void;
  onViewDashboard: () => void;
}

export const UploadStudio: React.FC<UploadStudioProps> = ({ onLessonReady, onViewDashboard }) => {
  const [instruction, setInstruction] = useState(
    "I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end"
  );
  const [selectedSample, setSelectedSample] = useState<string>("newtons_laws");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [docId, setDocId] = useState<string | null>("newtons_laws");
  const [samples, setSamples] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<"grounded" | "general">("grounded");
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [roadmapPlan, setRoadmapPlan] = useState<any | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/sample-materials")
      .then((res) => res.json())
      .then((data) => {
        if (data.sample_materials) {
          setSamples(data.sample_materials);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSampleSelect = async (sampleId: string) => {
    setSelectedSample(sampleId);
    setUploadedFile(null);
    setDocId(sampleId);
    setMode("grounded");

    // Pre-seed instruction based on sample
    if (sampleId === "operating_systems") {
      setInstruction(
        "I'm a beginner, teach me Process Management in 20 minutes, in Hinglish, with 3D visuals and live interaction for Semester Exam"
      );
    } else if (sampleId === "newtons_laws") {
      setInstruction(
        "I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end"
      );
    } else if (sampleId === "photosynthesis") {
      setInstruction(
        "Teach me Photosynthesis light and dark reactions for Class 11, in English, 20 minutes with process diagrams"
      );
    } else if (sampleId === "bubble_sort") {
      setInstruction(
        "Explain Bubble Sort algorithm and time complexity in Hinglish, 5 minutes crash course for interviews"
      );
    }

    try {
      const formData = new FormData();
      formData.append("sample_id", sampleId);
      await fetch("http://localhost:8000/api/load-sample", {
        method: "POST",
        body: formData
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadedFile(file);
    setSelectedSample("");
    setMode("grounded");

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.doc_id) {
        setDocId(data.doc_id);
      }
      const topicName = data.detected_title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setInstruction(`Teach me ${topicName} in 20 minutes, with simple examples, and quiz me at the end`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartSession = async () => {
    setIsProcessing(true);
    try {
      const defaultTopic = uploadedFile
        ? uploadedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        : (selectedSample === "photosynthesis" ? "Photosynthesis" : selectedSample === "bubble_sort" ? "Bubble Sort" : "Newton's Laws");

      // 1. Parse free-text instruction into structured profile
      const profRes = await fetch("http://localhost:8000/api/parse-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          default_topic: defaultTopic
        })
      });
      const { profile } = await profRes.json();

      // 2. Plan time-aware, level-aware lesson
      const planRes = await fetch("http://localhost:8000/api/plan-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          doc_id: mode === "grounded" ? docId : null
        })
      });
      const { plan } = await planRes.json();

      onLessonReady(plan, mode === "grounded" ? docId : null, profile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpen7DayRoadmap = async () => {
    const defaultTopic = uploadedFile
      ? uploadedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      : (selectedSample === "photosynthesis" ? "Photosynthesis" : selectedSample === "bubble_sort" ? "Bubble Sort" : selectedSample === "operating_systems" ? "Operating Systems" : "Newton's Laws");

    setInstruction(`7-day comprehensive learning roadmap for ${defaultTopic} with daily modules and milestones`);
    setShowRoadmapModal(true);
    setIsLoadingRoadmap(true);

    try {
      const profRes = await fetch("http://localhost:8000/api/parse-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: `7 days comprehensive learning roadmap for ${defaultTopic} with daily modules and milestones`,
          default_topic: defaultTopic
        })
      });
      const { profile } = await profRes.json();
      profile.is_multiday = true;
      profile.multiday_count = 7;

      const planRes = await fetch("http://localhost:8000/api/plan-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          doc_id: mode === "grounded" ? docId : null
        })
      });
      const { plan } = await planRes.json();
      setRoadmapPlan({ plan, profile });
    } catch (err) {
      console.error("Error generating 7-day roadmap:", err);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Adaptive Pedagogical Video Educator
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-indigo-200">
          AI Teacher Studio
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload any textbook chapter or syllabus, state your time and language preference, and experience a human-like educator teaching you through interactive video.
        </p>
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setMode("grounded")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            mode === "grounded"
              ? "bg-indigo-600/30 border border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          RAG Document Grounded Mode
        </button>

        <button
          onClick={() => {
            setMode("general");
            setDocId(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            mode === "general"
              ? "bg-amber-600/30 border border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          <Compass className="w-4 h-4 text-amber-400" />
          General Knowledge Mode (No Document)
        </button>
      </div>

      {/* 1. Document Ingestion Card (When Grounded Mode) */}
      {mode === "grounded" && (
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Step 1: Select or Upload Material</h3>
              <p className="text-xs text-slate-400">PDF, DOCX, PPTX, or TXT curriculum files</p>
            </div>
            {docId && (
              <span className="px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Material Grounded & Indexed
              </span>
            )}
          </div>

          {/* Pre-loaded Sample Material Presets */}
          <div>
            <label className="text-xs text-slate-400 block mb-2 font-medium">
              Instant Sample Material Presets:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSampleSelect(s.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedSample === s.id
                      ? "bg-indigo-950/50 border-cyan-400 text-slate-100 shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                    <span>{s.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                      {s.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Custom File */}
          <div className="pt-2">
            <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer bg-slate-950/40 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-300 font-medium">
                {uploadedFile ? uploadedFile.name : "Or drag and drop your own PDF / DOCX / PPTX / TXT"}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Semantic chunking & vector indexing applied automatically
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* 2. Natural Language Instruction Input */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Step 2: Natural-Language Teaching Instructions</h3>
            <p className="text-xs text-slate-400">
              Specify your target time budget, language, style, grade level, and quiz preferences
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            className="w-full p-4 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
            placeholder="e.g. I'm a beginner, teach me Chapter 4 in 20 minutes, in Hindi, with simple examples, and quiz me at the end"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Quick Presets:</span>
            <button
              onClick={() =>
                setInstruction(
                  "I'm a beginner, teach me Newton's Laws in 5 minutes, in Hindi, ultra-concise with 1 quick quiz"
                )
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              ⚡ 5-Min Crash Course (Hindi)
            </button>
            <button
              onClick={() =>
                setInstruction(
                  "I'm a beginner, teach me in 20 minutes, in Hinglish, with real-life analogies and checkpoints"
                )
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              🎓 20-Min Lesson (Hinglish)
            </button>
            <button
              onClick={() =>
                setInstruction(
                  "Advanced deep dive in English, 60 minutes, with rigorous formula derivations and final exam"
                )
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              🔬 60-Min Advanced Deep Dive
            </button>
            <button
              onClick={handleOpen7DayRoadmap}
              className="px-2.5 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/40 text-indigo-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Click to view and generate content-grounded 7-Day Curriculum Roadmap"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>🗓️ 7-Day Curriculum Roadmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onViewDashboard}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          View Persistent Student Profile & Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartSession}
            disabled={isProcessing || !instruction.trim()}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing Adaptive Lesson Plan...
              </>
            ) : (
              <>
                Generate & Begin Teaching Session
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7-DAY CURRICULUM ROADMAP MODAL */}
      {showRoadmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      7-Day Mastery Curriculum Roadmap
                    </h2>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-mono rounded border border-cyan-500/40">
                      Grounded in Content
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {roadmapPlan?.plan?.topic || (uploadedFile ? uploadedFile.name : selectedSample)} • 7 Daily Milestones (~30 Mins / Day)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRoadmapModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
              {isLoadingRoadmap ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-300">
                    Generating 7-Day Pedagogical Syllabus Grounded in Your Material...
                  </span>
                  <span className="text-xs text-slate-500">
                    Extracting daily milestones, cognitive pacing & checkpoints
                  </span>
                </div>
              ) : roadmapPlan?.plan?.curriculum ? (
                roadmapPlan.plan.curriculum.map((dayItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/40 rounded-xl flex items-start gap-3.5 transition-all shadow-sm"
                  >
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold font-mono shrink-0">
                      Day {dayItem.day || idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-200 truncate">
                          {dayItem.title}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded shrink-0">
                          {dayItem.expected_duration || "30 mins"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {dayItem.focus}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-400" />
                          Checkpoint: {dayItem.checkpoint_type || "Formative Checkpoint"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Click to generate the 7-day roadmap.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  if (roadmapPlan?.plan) {
                    onLessonReady(roadmapPlan.plan, mode === "grounded" ? docId : null, roadmapPlan.profile);
                    setShowRoadmapModal(false);
                  }
                }}
                disabled={isLoadingRoadmap || !roadmapPlan?.plan}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>🚀 Begin 7-Day Curriculum with AI Teacher</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
