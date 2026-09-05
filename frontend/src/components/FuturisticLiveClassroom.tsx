"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Globe,
  Layers,
  Box,
  Cpu,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Send,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lightbulb,
  Baby,
  Smile,
  Shield,
  Activity,
  Award,
  Zap,
  ChevronRight,
  Terminal,
  Database,
  Server,
  Monitor,
  Eye,
  AlertCircle
} from "lucide-react";
import { Realtime3DVisualizer } from "./Realtime3DVisualizer";

export type TeacherStateType =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "EXPLAINING"
  | "ASKING_QUESTION"
  | "WAITING_FOR_RESPONSE"
  | "INTERRUPTED"
  | "ADAPTING"
  | "RESUMING";

interface FuturisticLiveClassroomProps {
  initialDocId?: string;
  initialTopic?: string;
  initialLanguage?: string;
  initialLevel?: string;
  initialDuration?: number;
  initialGoal?: string;
  onExit?: () => void;
}

export const FuturisticLiveClassroom: React.FC<FuturisticLiveClassroomProps> = ({
  initialDocId = "operating_systems",
  initialTopic = "Process Management",
  initialLanguage = "hinglish",
  initialLevel = "beginner",
  initialDuration = 20,
  initialGoal = "Semester Exam",
  onExit
}) => {
  // Session Configuration
  const [sessionId] = useState<string>(() => `live_${Math.random().toString(36).substring(2, 9)}`);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [currentConcept, setCurrentConcept] = useState<string>("Process vs Program");
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [level, setLevel] = useState<string>(initialLevel);

  // 10-State Teacher System
  const [teacherState, setTeacherState] = useState<TeacherStateType>("IDLE");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>(
    "Welcome to the Live Classroom. Initializing neural lecture session..."
  );
  const [lessonProgress, setLessonProgress] = useState<number>(25);
  const [studentMastery, setStudentMastery] = useState<number>(85);
  const [transcriptHistory, setTranscriptHistory] = useState<
    Array<{ speaker: "teacher" | "student"; text: string; time: string }>
  >([]);

  // Audio spectrum & animation state
  const [audioSpectrum, setAudioSpectrum] = useState<number[]>(new Array(16).fill(8));
  const [mouthAperture, setMouthAperture] = useState<number>(0);
  const [headY, setHeadY] = useState<number>(0);

  // Holographic Visual State
  const [visualSpec, setVisualSpec] = useState<any>({
    visualType: "process_animation",
    title: "Process Lifecycle & State Transitions",
    domain: "os"
  });
  const [activeVisualMode, setActiveVisualMode] = useState<"hologram" | "3d_orbit" | "whiteboard">("hologram");
  const [selectedState, setSelectedState] = useState<string>("Running");

  // Interaction State
  const [questionInput, setQuestionInput] = useState<string>("");
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Audio & Hardware Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);

  // ---------------------------------------------------------------------------
  // 1. WEBSOCKET REAL-TIME STREAMING
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let ws: WebSocket;
    const connect = () => {
      const wsUrl = `ws://localhost:8000/ws/live-class/${sessionId}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;
          handleServerEvent(eventName, data);
        } catch (e) {
          console.error("Failed to parse WS payload:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [sessionId]);

  const handleServerEvent = (eventName: string, data: any) => {
    if (eventName === "teacher_state_changed") {
      const newState = data.state as TeacherStateType;
      if (newState) setTeacherState(newState);

      if (data.is_speaking !== undefined) {
        setIsSpeaking(data.is_speaking);
      }

      if (data.interrupted) {
        // Force immediate audio stop on client (<100ms)
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsSpeaking(false);
      }

      if (data.spoken_text) {
        setSpokenText(data.spoken_text);
        setTranscriptHistory((prev) => [
          {
            speaker: "teacher",
            text: data.spoken_text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          },
          ...prev.slice(0, 8)
        ]);
      }
    } else if (eventName === "teacher_speech_ready") {
      if (data.audio_url && audioRef.current) {
        audioRef.current.src = data.audio_url;
        audioRef.current.play().catch((e) => console.warn("Autoplay notice:", e));
        setIsSpeaking(true);
        setTeacherState("SPEAKING");
      }
      if (data.spoken_text) {
        setSpokenText(data.spoken_text);
      }
    } else if (eventName === "visual_updated") {
      if (data.visual_spec) {
        setVisualSpec(data.visual_spec);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 2. INITIALIZE LIVE SESSION ON MOUNT
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        await fetch("http://localhost:8000/api/live-class/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            doc_id: initialDocId,
            topic: topic,
            level: level,
            language: language,
            duration: initialDuration,
            goal: initialGoal,
            tutor_gender: "female",
            persona: "professional"
          })
        });
      } catch (e) {
        console.error("Failed to initialize live session:", e);
      }
    };
    const t = setTimeout(init, 500);
    return () => clearTimeout(t);
  }, []);

  // ---------------------------------------------------------------------------
  // 3. PHOTOGRAPHIC FACIAL SPEECH ARTICULATION LOOP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSpeaking) {
      setMouthAperture(0);
      setHeadY(0);
      setAudioSpectrum(new Array(16).fill(6));
      return;
    }

    let frameId: number;
    let clock = 0;

    const loop = () => {
      clock += 0.14;
      const s1 = Math.sin(clock * 3.5);
      const s2 = Math.sin(clock * 8.2);
      const aperture = Math.max(0, s1 * 0.65 + s2 * 0.35);
      setMouthAperture(aperture);
      setHeadY(Math.sin(clock * 1.8) * 1.8);

      const spectrum = Array.from({ length: 16 }, (_, i) => {
        const wave = Math.sin(clock * 2.5 + i * 0.45);
        return Math.floor(Math.abs(wave) * 75 + 15);
      });
      setAudioSpectrum(spectrum);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isSpeaking]);

  // ---------------------------------------------------------------------------
  // 4. STUDENT INTERRUPTION ENGINE
  // ---------------------------------------------------------------------------
  const interruptTutor = async (question: string) => {
    if (!question.trim()) return;

    // 1. Client-side audio forceful cutoff (<100ms)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setTeacherState("INTERRUPTED");
    setSpokenText(`Understanding question: "${question}"...`);

    setTranscriptHistory((prev) => [
      {
        speaker: "student",
        text: question,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      },
      ...prev.slice(0, 8)
    ]);

    // 2. Dispatch to backend
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "student_interrupt",
            data: { question }
          })
        );
      } else {
        await fetch("http://localhost:8000/api/live-class/interrupt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            question
          })
        });
      }
      setQuestionInput("");
    } catch (e) {
      console.error("Interruption dispatch failure:", e);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. MICROPHONE SPEECH-TO-TEXT (🎤 SPEAK)
  // ---------------------------------------------------------------------------
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is supported in Chrome, Edge, and Brave. Please type your question.");
      return;
    }

    if (isListeningMic) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "hi" ? "hi-IN" : language === "hinglish" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsListeningMic(true);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsSpeaking(false);
        setTeacherState("LISTENING");
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setQuestionInput(transcript);
        interruptTutor(transcript);
        setIsListeningMic(false);
      };

      recognition.onerror = () => setIsListeningMic(false);
      recognition.onend = () => setIsListeningMic(false);
      recognition.start();
    } catch (e) {
      setIsListeningMic(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. CLASSROOM PEDAGOGICAL CONTROLS
  // ---------------------------------------------------------------------------
  const sendControl = async (action: string, value?: string) => {
    try {
      if (action === "pause") {
        if (audioRef.current) audioRef.current.pause();
        setIsSpeaking(false);
        setTeacherState("IDLE");
      } else if (action === "resume") {
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.play();
          setIsSpeaking(true);
          setTeacherState("EXPLAINING");
        }
      }

      await fetch("http://localhost:8000/api/live-class/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, action, value })
      });
    } catch (e) {
      console.error(`Control error for ${action}:`, e);
    }
  };

  // State Badge Helpers
  const getStateBadge = () => {
    switch (teacherState) {
      case "SPEAKING":
      case "EXPLAINING":
        return {
          label: teacherState,
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-400 animate-pulse"
        };
      case "LISTENING":
        return {
          label: "LISTENING TO STUDENT",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-400 animate-ping"
        };
      case "THINKING":
        return {
          label: "RETRIEVING TEXTBOOK RAG",
          color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          dot: "bg-cyan-400 animate-spin"
        };
      case "INTERRUPTED":
        return {
          label: "INTERRUPTED",
          color: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          dot: "bg-rose-500"
        };
      case "ADAPTING":
        return {
          label: "ADAPTING EXPLANATION",
          color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          dot: "bg-indigo-400 animate-pulse"
        };
      case "ASKING_QUESTION":
      case "WAITING_FOR_RESPONSE":
        return {
          label: "CHECKPOINT QUESTION",
          color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          dot: "bg-purple-400 animate-pulse"
        };
      default:
        return {
          label: "IDLE / READY",
          color: "bg-slate-800 text-slate-300 border-slate-700",
          dot: "bg-slate-500"
        };
    }
  };

  const badge = getStateBadge();

  // ---------------------------------------------------------------------------
  // 7. RENDER HOLOGRAPHIC VISUAL PROJECTION AREA
  // ---------------------------------------------------------------------------
  const renderHolographicVisual = () => {
    if (activeVisualMode === "3d_orbit") {
      return (
        <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950/90 border border-cyan-500/30 shadow-2xl shadow-cyan-500/5">
          <Realtime3DVisualizer
            domain={topic.toLowerCase().includes("newton") ? "physics" : "cs"}
            title={topic}
          />
        </div>
      );
    }

    if (activeVisualMode === "whiteboard") {
      return (
        <div className="w-full h-full bg-slate-950/95 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2.5">
            <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>AI HOLOGRAPHIC CHALKBOARD</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded font-mono">
              LaTeX Equation Trace
            </span>
          </div>

          <div className="my-auto space-y-4 text-center">
            <div className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded-xl max-w-md mx-auto">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                Process Equation
              </span>
              <div className="text-2xl font-mono font-extrabold text-slate-100 tracking-wider">
                Process = Program + PCB + Stack/Heap
              </div>
            </div>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
              When stored on disk, it is passive binary code. When scheduled onto the CPU, it becomes an active Process executing machine instructions.
            </p>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Synchronized dynamically with Dr. Arya's lecture
          </div>
        </div>
      );
    }

    // Comparison Mode (Triggered on Interruption)
    if (visualSpec?.visualType === "comparison") {
      return (
        <div className="w-full h-full bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Program vs Process Clarification</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-mono">
                Student Clarification
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* Program */}
              <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>Program (Passive)</span>
                </div>
                <div className="aspect-[16/9] bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-2 text-center mb-2">
                  <Database className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="font-mono text-[11px] text-amber-300 font-bold">chrome.exe on Disk</span>
                  <span className="text-[9px] text-slate-500">Secondary Storage Only</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-3 font-sans">
                  <li>Passive entity (static binary file)</li>
                  <li>Consumes zero CPU clock cycles</li>
                  <li>No dynamic Program Counter</li>
                </ul>
              </div>

              {/* Process */}
              <div className="p-3.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Process (Active)</span>
                </div>
                <div className="aspect-[16/9] bg-slate-950 rounded-lg border border-cyan-500/30 flex flex-col items-center justify-center p-2 text-center mb-2 animate-pulse">
                  <Cpu className="w-6 h-6 text-cyan-400 mb-1" />
                  <span className="font-mono text-[11px] text-cyan-300 font-bold">PID 4092 in RAM</span>
                  <span className="text-[9px] text-slate-400">Owns PCB, Stack, Heap</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-3 font-sans">
                  <li>Active entity in Main Memory</li>
                  <li>Actively executes on CPU cores</li>
                  <li>Allocated dedicated registers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-xl flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-[11px] text-cyan-200 leading-tight">
              <strong>Simple Analogy:</strong> A recipe book on your shelf is a <strong>Program</strong>. The chef actively baking the cake is the <strong>Process</strong>!
            </p>
          </div>
        </div>
      );
    }

    // Default Holographic Mode: OS 5-State Process Flow Animation
    const states = [
      { id: "New", label: "NEW", desc: "Process is created by the operating system.", color: "text-amber-400" },
      { id: "Ready", label: "READY", desc: "Loaded in RAM waiting for CPU core dispatch.", color: "text-cyan-400" },
      { id: "Running", label: "RUNNING", desc: "Instructions actively executing on CPU.", color: "text-emerald-400" },
      { id: "Waiting", label: "WAITING", desc: "Blocked waiting for I/O completion.", color: "text-purple-400" },
      { id: "Terminated", label: "TERMINATED", desc: "Execution finished; memory deallocated.", color: "text-rose-400" }
    ];

    return (
      <div className="w-full h-full bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-cyan-900/40 pb-2">
            <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{visualSpec.title || "Operating System 5-State Process Model"}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Flow
            </span>
          </div>

          {/* Interactive State Flow */}
          <div className="py-4 px-3 bg-slate-900/60 border border-cyan-500/20 rounded-xl my-2">
            <div className="grid grid-cols-5 gap-2 items-center">
              {states.map((st, i) => {
                const isSel = selectedState === st.id;
                return (
                  <div key={st.id} className="relative flex flex-col items-center">
                    <button
                      onClick={() => setSelectedState(st.id)}
                      className={`w-full py-2.5 px-1 rounded-lg font-mono text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSel
                          ? `bg-slate-800 ${st.color} border border-cyan-400 shadow-md shadow-cyan-500/20 scale-105`
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {st.label}
                    </button>
                    {i < states.length - 1 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>Admit $\to$</span>
              <span>Dispatch $\to$</span>
              <span className="text-emerald-400 font-bold">Executing</span>
              <span>$\to$ I/O Wait</span>
              <span>$\to$ Exit</span>
            </div>
          </div>

          {/* Selected State Description */}
          {selectedState && (
            <div className="mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300">
              <strong className="text-cyan-400 uppercase font-mono mr-2">{selectedState} State:</strong>
              {states.find((s) => s.id === selectedState)?.desc}
            </div>
          )}
        </div>

        <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Synchronized with teacher speech stream</span>
          </div>
          <button
            onClick={() => setActiveVisualMode("3d_orbit")}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] cursor-pointer"
          >
            3D Orbit $\to$
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER NAV (FUTURISTIC HIGH-TECH HUD BAR) */}
      {/* ------------------------------------------------------------------- */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shadow-cyan-500/20">
              AI
            </div>
            <span className="font-extrabold tracking-wide text-sm bg-gradient-to-r from-cyan-300 via-emerald-300 to-white bg-clip-text text-transparent">
              AI TEACHER LIVE CLASSROOM
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            LIVE 1080p
          </div>

          {isConnected ? (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Synced
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
            </span>
          )}
        </div>

        {/* Center: Topic & Class Badges */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {topic}
          </span>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {level.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {language.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            {initialDuration} MINS
          </span>
        </div>

        {/* Right: Exit / Switch View */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => sendControl("repeat")}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Repeat current section"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Exit Classroom
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN FUTURISTIC CLASSROOM STAGE (SECTION 9 LAYOUT) */}
      {/* ------------------------------------------------------------------- */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        {/* CENTER-LEFT: THE MAIN AI TEACHER STAGE & HOLOGRAPHIC PROJECTION (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-3 min-h-0">
          {/* Main Visual Stage (Futuristic High-Tech Lab with Teacher & Visual side-by-side) */}
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-slate-900/60 to-slate-950 flex flex-col lg:flex-row items-center justify-between p-4 gap-4 min-h-0">
            {/* Subtle Futuristic Cyan Ambient Glow Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-transparent pointer-events-none" />

            {/* TEACHER AVATAR: Professional Female in Grey Blazer (Standing in High-Tech Studio) */}
            <div className="relative w-full lg:w-5/12 h-full min-h-[300px] flex items-center justify-center">
              <div
                className="relative w-full h-full max-w-md rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl transition-transform duration-75"
                style={{ transform: `translate3d(0, ${headY}px, 0)` }}
              >
                {/* Base Portrait Layer */}
                <img
                  src="/avatar_dr_arya_smile.jpg"
                  alt="Dr. Arya - Professional AI Teacher"
                  className="w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01]"
                />

                {/* Natural Photographic Speaking Layer (Mouth & Syllable Blending from inside photograph) */}
                <img
                  src="/avatar_dr_arya_talking.jpg"
                  alt="Dr. Arya - Speaking Naturally"
                  className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.03] brightness-[1.01] pointer-events-none transition-opacity duration-150"
                  style={{
                    opacity: isSpeaking ? Math.min(1, Math.max(0, mouthAperture * 1.4)) : 0
                  }}
                />

                {/* Subtle Neon Hologram Rim Light */}
                <div className="absolute inset-0 border-2 border-cyan-500/20 pointer-events-none rounded-2xl" />

                {/* Teacher Nameplate HUD Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 bg-slate-950/85 border border-slate-700/80 rounded-xl backdrop-blur-md">
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Dr. Arya</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 font-mono rounded">
                        Teacher
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Professional & Patient</div>
                  </div>

                  {/* Audio Spectrum Bars */}
                  <div className="flex items-center gap-0.5 h-4 w-20">
                    {audioSpectrum.slice(0, 10).map((val, idx) => (
                      <span
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isSpeaking ? "bg-cyan-400" : "bg-slate-700"
                        }`}
                        style={{ height: isSpeaking ? `${Math.max(15, val)}%` : "20%" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* HOLOGRAPHIC VISUAL PROJECTION AREA (Translucent floating panel beside teacher) */}
            <div className="relative w-full lg:w-7/12 h-full flex flex-col justify-between min-h-[300px]">
              {/* Visual Mode Navigation */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border border-cyan-500/30 rounded-xl shrink-0 mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveVisualMode("hologram")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeVisualMode === "hologram"
                        ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Hologram Flow
                  </button>
                  <button
                    onClick={() => setActiveVisualMode("3d_orbit")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeVisualMode === "3d_orbit"
                        ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    3D WebGL Orbit
                  </button>
                  <button
                    onClick={() => setActiveVisualMode("whiteboard")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeVisualMode === "whiteboard"
                        ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Chalkboard
                  </button>
                </div>

                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Box className="w-3 h-3" />
                  <span>Interactive HUD</span>
                </span>
              </div>

              {/* Render Selected Visual Engine */}
              <div className="flex-1 min-h-0 relative">
                {renderHolographicVisual()}
              </div>
            </div>
          </div>

          {/* REAL-TIME SPONSORED SUBTITLE & SPOKEN STREAM CARD */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shrink-0 min-h-[95px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Live Spoken Transcript
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {isSpeaking ? "Streaming Neural Audio" : "Paused"}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
              "{spokenText}"
            </p>

            <audio
              ref={audioRef}
              onPlay={() => setIsSpeaking(true)}
              onEnded={() => {
                setIsSpeaking(false);
                setTeacherState("IDLE");
              }}
              onError={() => setIsSpeaking(false)}
              className="hidden"
            />
          </div>
        </div>

        {/* RIGHT COLUMN: SIDE TELEMETRY & PEDAGOGICAL PANEL (3 cols) */}
        <aside className="lg:col-span-3 flex flex-col gap-3 min-h-0">
          {/* 1. Teacher State HUD */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-2">
              Teacher State System
            </span>
            <div
              className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-xs font-bold ${badge.color}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
              <span>{badge.label}</span>
            </div>
          </div>

          {/* 2. Lesson Telemetry (Topic, Concept, Progress) */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Current Topic</span>
              <span className="text-xs font-bold text-slate-200">{topic}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Current Concept</span>
              <span className="text-xs font-bold text-cyan-400">{currentConcept}</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Lesson Progress</span>
                <span className="text-cyan-400 font-bold">{lessonProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${lessonProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Live Transcript History */}
          <div className="flex-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-y-auto min-h-[140px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-2 block">
              Session Event Log
            </span>
            <div className="space-y-2.5 overflow-y-auto pr-1 text-xs">
              {transcriptHistory.length === 0 ? (
                <span className="text-[11px] text-slate-500 font-mono">No student interactions logged yet.</span>
              ) : (
                transcriptHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-[11px] ${
                      item.speaker === "student"
                        ? "bg-cyan-950/40 border-cyan-800/40 text-cyan-200"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>{item.speaker === "student" ? "You (Student)" : "Dr. Arya"}</span>
                      <span>{item.time}</span>
                    </div>
                    <p className="leading-snug">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* BOTTOM CLASSROOM CONTROLS & INTERACTION BAR (SECTION 9) */}
      {/* ------------------------------------------------------------------- */}
      <footer className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-5 py-3 z-30 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Student Interruption Input Row */}
          <div className="flex items-center gap-2">
            {/* 🎤 Speak Voice Button */}
            <button
              onClick={toggleVoiceInput}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                isListeningMic
                  ? "bg-rose-500 text-white animate-pulse shadow-rose-500/40 ring-2 ring-rose-400"
                  : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold shadow-cyan-500/20"
              }`}
              title="Interrupt and ask with microphone"
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListeningMic ? "Listening..." : "🎤 Speak"}</span>
            </button>

            {/* Type Question Input */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") interruptTutor(questionInput);
                }}
                placeholder="Ask Dr. Arya anything (e.g. 'Ma'am mujhe Process aur Program ka difference samajh nahi aaya')..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans pr-20"
              />
              <button
                onClick={() => interruptTutor(questionInput)}
                disabled={!questionInput.trim()}
                className="absolute right-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </button>
            </div>

            {/* Pedagogical Reaction Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => sendControl("simple")}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Baby className="w-3.5 h-3.5 text-amber-400" />
                <span>Explain Simply</span>
              </button>

              <button
                onClick={() => sendControl("example")}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                <span>Give Example</span>
              </button>

              {/* Language Switcher */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    sendControl("language", e.target.value);
                  }}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="hinglish">Hinglish</option>
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="ne">Nepali</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transport & Control Flow */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
            <div className="flex items-center gap-2">
              <button
                onClick={() => sendControl(isSpeaking ? "pause" : "resume")}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => sendControl("next")}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Continue Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Futuristic Interactive Classroom • 10-State Socratic Engine
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
