"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
  Activity,
  Radio,
  Smile,
  MessageSquare,
  Pin,
  Settings,
  ShieldCheck,
  Signal
} from "lucide-react";

interface TeacherAvatarProps {
  isSpeaking: boolean;
  language: string;
  currentViseme?: string;
  teacherName?: string;
  explanationMode?: "basic" | "medium" | "hard";
  tutorGender?: "female" | "male";
  teacherState?: "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "EXPLAINING" | "ASKING" | "WAITING_FOR_STUDENT";
  persona?: string;
  personality?: "dr_arya" | "vikram_sir" | "prof_walter";
  onPersonalityChange?: (p: "dr_arya" | "vikram_sir" | "prof_walter") => void;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  isSpeaking,
  language,
  currentViseme = "rest",
  teacherName = "Dr. Arya",
  explanationMode = "basic",
  tutorGender = "female",
  teacherState = "IDLE",
  persona = "friendly",
  personality = "dr_arya",
  onPersonalityChange
}) => {
  const [videoFeedMode, setVideoFeedMode] = useState<"webcam" | "studio">("webcam");
  const [audioSpectrum, setAudioSpectrum] = useState<number[]>(new Array(16).fill(8));
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(true);

  // Real-Time Facial Animation State
  const [mouthAperture, setMouthAperture] = useState<number>(0); // 0 (closed) to 1 (open)
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  // 1. Real-Time Eye Blinking Loop (Every 3.8s)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 130);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  // 2. Real-Time Audio-Driven Speech Loop (Steady picture, natural audio spectrum)
  useEffect(() => {
    if (!isSpeaking) {
      setMouthAperture(0);
      setAudioSpectrum(new Array(16).fill(6));
      return;
    }

    let animFrame: number;
    let clock = 0;

    const animateSpeech = () => {
      clock += 0.12;

      // Dynamic mouth opening modulation driven by conversational cadence
      const syllableSpeed = Math.sin(clock * 3.2);
      const subCadence = Math.sin(clock * 7.5);
      const rawAperture = Math.max(0, (syllableSpeed * 0.6 + subCadence * 0.4));
      setMouthAperture(rawAperture);

      // Audio spectrum bars
      setAudioSpectrum(
        Array.from({ length: 16 }, (_, i) => {
          const base = 25 + Math.sin(clock * 2 + i) * 20 + Math.random() * 45;
          return Math.floor(Math.max(10, Math.min(95, base)));
        })
      );

      animFrame = requestAnimationFrame(animateSpeech);
    };

    animFrame = requestAnimationFrame(animateSpeech);
    return () => cancelAnimationFrame(animFrame);
  }, [isSpeaking]);

  const langDisplay =
    language === "hi"
      ? "हिंदी (Hindi)"
      : language === "hinglish"
      ? "Hinglish (India)"
      : "English (US)";

  const displayName =
    personality === "vikram_sir"
      ? "Vikram Sir"
      : personality === "prof_walter"
      ? "Prof. Walter"
      : teacherName || "Dr. Arya";

  const roleTitle =
    personality === "vikram_sir"
      ? "Mentor (Bhaiya)"
      : personality === "prof_walter"
      ? "Lab Scientist"
      : "Academic Prof";

  return (
    <div className="relative flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-200">
      {/* ------------------------------------------------------------- */}
      {/* VIDEO CALL TOP BAR (Google Meet / Zoom Style) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-2">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking ? "bg-emerald-400" : "bg-cyan-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSpeaking ? "bg-emerald-500" : "bg-cyan-500"
              }`}
            />
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-100 tracking-wide">
              {displayName}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/10 text-cyan-300 font-mono rounded border border-cyan-500/30">
              {roleTitle}
            </span>
            <span
              className={`px-1.5 py-0.2 text-[9px] font-semibold rounded uppercase font-mono ${
                explanationMode === "basic"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : explanationMode === "medium"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              {explanationMode}
            </span>
          </div>
        </div>

        {/* Video Call Stream Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => setVideoFeedMode("webcam")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                videoFeedMode === "webcam"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Webcam (Live)
            </button>
            <button
              onClick={() => setVideoFeedMode("studio")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                videoFeedMode === "studio"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Studio
            </button>
          </div>

          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isPinned ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
            }`}
            title="Pin Video Feed"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 18: TEACHER PERSONALITY SWITCHER ROW */}
      {/* ------------------------------------------------------------- */}
      {onPersonalityChange && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 text-[11px] z-10">
          <span className="text-slate-400 font-medium flex items-center gap-1 text-[10px]">
            <Sparkles className="w-3 h-3 text-cyan-400" /> AI Persona:
          </span>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onPersonalityChange("dr_arya")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                personality === "dr_arya"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Dr. Arya - Academic Professor (Neerja/Swara Neural)"
            >
              Dr. Arya (Prof)
            </button>
            <button
              onClick={() => onPersonalityChange("vikram_sir")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                personality === "vikram_sir"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Vikram Sir - Energetic Mentor / Bhaiya (Prabhat/Madhur Neural)"
            >
              Vikram Sir (Mentor)
            </button>
            <button
              onClick={() => onPersonalityChange("prof_walter")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                personality === "prof_walter"
                  ? "bg-purple-500 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Prof. Walter - Visual Lab Scientist (Guy Neural)"
            >
              Prof. Walter (Lab)
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIDEO CALL FEED (LIVE ANIMATED REAL-TIME PRESENTATION) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* MODE 1: WEBCAM WITH FAITHFUL PHOTO PORTRAIT */}
        {videoFeedMode === "webcam" && (
          <div className="relative w-full h-full overflow-hidden">
            {personality === "vikram_sir" ? (
              <img
                src="/avatar_dr_vikram.jpg"
                alt="Vikram Sir - Live Webcam"
                className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01]"
              />
            ) : personality === "prof_walter" ? (
              <img
                src="/avatar_presenter_classroom.jpg"
                alt="Prof. Walter - Live Webcam"
                className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01]"
              />
            ) : (
              <>
                {/* Base Portrait Layer */}
                <img
                  src="/avatar_dr_arya_smile.jpg"
                  alt="Dr. Arya - Live Webcam"
                  className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01]"
                />

                {/* Speaking Layer: Real Photograph with natural lips, mouth, and teeth inside the picture itself */}
                <img
                  src="/avatar_dr_arya_talking.jpg"
                  alt="Dr. Arya - Speaking Naturally"
                  className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01] pointer-events-none transition-opacity duration-150"
                  style={{
                    opacity: isSpeaking ? Math.min(1, Math.max(0, mouthAperture * 1.4)) : 0
                  }}
                />
              </>
            )}

            {/* Video Call Scanline & Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />
          </div>
        )}

        {/* MODE 2: LECTURE HALL */}
        {videoFeedMode === "studio" && (
          <div className="relative w-full h-full">
            <img
              src={
                personality === "vikram_sir"
                  ? "/avatar_dr_vikram.jpg"
                  : "/avatar_presenter_classroom.jpg"
              }
              alt="Live Lecture Hall"
              className="w-full h-full object-cover object-center filter contrast-[1.04] brightness-[1.02]"
            />
          </div>
        )}

        {/* Top-Right Video Call Telemetry Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/80 border border-slate-700/80 rounded text-[10px] font-mono text-slate-300 backdrop-blur-md">
            <Signal className="w-3 h-3 text-emerald-400" />
            <span>HD 1080p • LIVE</span>
          </div>
        </div>

        {/* Bottom-Left Video Call Nameplate with Speaking Mic Aura */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 border border-slate-700/80 rounded-xl backdrop-blur-md z-10 shadow-lg">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isSpeaking
                  ? "bg-emerald-500 text-slate-950"
                  : teacherState === "LISTENING"
                  ? "bg-amber-500 text-slate-950"
                  : teacherState === "THINKING"
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {isSpeaking ? <Mic className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </span>
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">{teacherName}</span>
              <span className="text-[10px] text-slate-400">• {langDisplay}</span>
            </div>
            <div className="text-[10px] font-mono font-medium">
              {teacherState === "LISTENING" ? (
                <span className="text-amber-400 animate-pulse">● Listening to student...</span>
              ) : teacherState === "THINKING" ? (
                <span className="text-cyan-400 animate-pulse">● Retrieving textbook RAG...</span>
              ) : teacherState === "ASKING" || teacherState === "WAITING_FOR_STUDENT" ? (
                <span className="text-purple-400 animate-pulse">● Waiting for your answer...</span>
              ) : isSpeaking ? (
                <span className="text-emerald-400">Speaking (Live Audio Sync)</span>
              ) : (
                <span className="text-slate-400">Listening...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIDEO CALL BOTTOM CONTROLS BAR (Zoom / Meet Toolbar) */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between z-20">
        {/* Real-time Voice Audio Visualizer Bars */}
        <div className="flex items-center gap-0.5 h-5 w-28">
          {audioSpectrum.slice(0, 14).map((val, idx) => (
            <span
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                isSpeaking ? "bg-emerald-400" : "bg-slate-700"
              }`}
              style={{
                height: isSpeaking ? `${Math.max(15, val)}%` : "20%"
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isMicMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title={isMicMuted ? "Unmute Student Mic" : "Mute Student Mic"}
          >
            {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
