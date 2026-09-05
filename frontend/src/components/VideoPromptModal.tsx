"use client";

import React, { useState, useEffect } from "react";
import { Film, Copy, Check, Sparkles, X, Clapperboard } from "lucide-react";

interface VideoPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptTitle: string;
  visualType: string;
}

export const VideoPromptModal: React.FC<VideoPromptModalProps> = ({
  isOpen,
  onClose,
  conceptTitle,
  visualType
}) => {
  const [promptData, setPromptData] = useState<any | null>(null);
  const [activeClip, setActiveClip] = useState<"A" | "B" | "C">("B");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("http://localhost:8000/api/generate-video-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concept_title: conceptTitle,
        visual_type: visualType,
        subject: "Physics"
      })
    })
      .then((res) => res.json())
      .then((data) => setPromptData(data))
      .catch((err) => console.error(err));
  }, [isOpen, conceptTitle, visualType]);

  if (!isOpen) return null;

  const currentClipText =
    activeClip === "A"
      ? promptData?.clip_a_talking_shot
      : activeClip === "B"
      ? promptData?.clip_b_holographic_panel
      : promptData?.clip_c_checkpoint_return;

  const handleCopy = () => {
    if (!currentClipText) return;
    navigator.clipboard.writeText(currentClipText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/20 text-cyan-400 rounded-xl border border-indigo-500/30">
              <Film className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Text-to-Video Master Studio Prompt
              </h3>
              <p className="text-xs text-slate-400">
                Generate photorealistic 5-10s clips via Sora, Veo, or Runway Gen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clip Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button
            onClick={() => setActiveClip("A")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeClip === "A"
                ? "bg-indigo-600/30 border border-cyan-400 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            Clip A: Talking Shot (8s)
          </button>

          <button
            onClick={() => setActiveClip("B")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeClip === "B"
                ? "bg-indigo-600/30 border border-cyan-400 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Clip B: Holographic Panel Reveal (8s)
          </button>

          <button
            onClick={() => setActiveClip("C")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeClip === "C"
                ? "bg-indigo-600/30 border border-cyan-400 text-cyan-200"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Clip C: Return to Avatar Checkpoint (6s)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500 selection:text-slate-950">
            {currentClipText || "Generating prompt..."}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Consistent studio environment & educator styling across all generations
          </div>

          <button
            onClick={handleCopy}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Copied Prompt!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Video Prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
