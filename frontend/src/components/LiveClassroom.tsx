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
  Monitor
} from "lucide-react";
import { TeacherAvatar } from "./TeacherAvatar";
import { Realtime3DVisualizer } from "./Realtime3DVisualizer";

interface LiveClassroomProps {
  initialDocId?: string;
  initialTopic?: string;
  initialLanguage?: string;
  initialLevel?: string;
  initialDuration?: number;
  initialGoal?: string;
  onExit?: () => void;
}

export const LiveClassroom: React.FC<LiveClassroomProps> = ({
  initialDocId = "operating_systems",
  initialTopic = "Process Management",
  initialLanguage = "hinglish",
  initialLevel = "beginner",
  initialDuration = 20,
  initialGoal = "Semester Exam",
  onExit
}) => {
  // Session parameters
  const [sessionId, setSessionId] = useState<string>(() => `live_${Math.random().toString(36).substring(2, 9)}`);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [level, setLevel] = useState<string>(initialLevel);
  const [tutorGender, setTutorGender] = useState<"female" | "male">("female");
  const [persona, setPersona] = useState<string>("friendly");

  // Live session state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [teacherState, setTeacherState] = useState<"IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "EXPLAINING" | "ASKING" | "WAITING_FOR_STUDENT">("IDLE");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>("Welcome! Preparing your live interactive class from your course material...");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<number>(0);
  const [studentMastery, setStudentMastery] = useState<number>(85);
  const [currentSectionIdx, setCurrentSectionIdx] = useState<number>(0);

  // Visual Planner State
  const [visualSpec, setVisualSpec] = useState<any>({
    visualType: "process_animation",
    title: "Operating System Process Lifecycle",
    domain: "os"
  });
  const [activeVisualTab, setActiveVisualTab] = useState<"visual_engine" | "3d_webgl" | "whiteboard">("visual_engine");
  const [selectedProcessState, setSelectedProcessState] = useState<string>("Running");

  // Interruption and Q&A State
  const [questionInput, setQuestionInput] = useState<string>("");
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [interruptionHistory, setInterruptionHistory] = useState<Array<{ q: string; a: string; time: string }>>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<any>(null);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null);

  // Audio and WebSocket references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);

  // -------------------------------------------------------------
  // 1. WEBSOCKET CONNECTION SETUP
  // -------------------------------------------------------------
  useEffect(() => {
    let ws: WebSocket;
    const connectWS = () => {
      const wsUrl = `ws://localhost:8000/ws/live-class/${sessionId}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to Live Classroom WebSocket:", sessionId);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;
          handleServerEvent(eventName, data);
        } catch (e) {
          console.error("Failed to parse WS event:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.warn("Live Classroom WS Error:", err);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [sessionId]);

  // Handle events broadcast by LiveClassService
  const handleServerEvent = (eventName: string, data: any) => {
    if (eventName === "teacher_state_changed") {
      setTeacherState(data.state || "IDLE");
      setIsSpeaking(data.is_speaking || false);
      if (data.spoken_text) {
        setSpokenText(data.spoken_text);
      }
      if (data.interrupted) {
        // Stop audio playback immediately!
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    } else if (eventName === "teacher_speech_ready") {
      if (data.audio_url) {
        setCurrentAudioUrl(data.audio_url);
        setIsSpeaking(true);
        setTeacherState("EXPLAINING");
        if (audioRef.current) {
          audioRef.current.src = data.audio_url;
          audioRef.current.play().catch((err) => {
            console.warn("Audio autoplay blocked, click anywhere to listen:", err);
          });
        }
      }
      if (data.spoken_text) {
        setSpokenText(data.spoken_text);
      }
      if (data.is_interruption_response) {
        setInterruptionHistory((prev) => [
          {
            q: "Student Question",
            a: data.spoken_text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          },
          ...prev.slice(0, 4)
        ]);
      }
    } else if (eventName === "visual_updated") {
      if (data.visual_spec) {
        setVisualSpec(data.visual_spec);
      }
    } else if (eventName === "lesson_completed") {
      setTeacherState("IDLE");
      setIsSpeaking(false);
      setSpokenText(data.summary || "Congratulations! You have successfully mastered this topic.");
    }
  };

  // -------------------------------------------------------------
  // 2. START CLASS AUTOMATICALLY ON MOUNT
  // -------------------------------------------------------------
  useEffect(() => {
    const startClass = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/live-class/start", {
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
            tutor_gender: tutorGender,
            persona: persona
          })
        });
        const data = await res.json();
        console.log("Live class initialized:", data);
      } catch (e) {
        console.error("Failed to start live class:", e);
      }
    };

    const timer = setTimeout(startClass, 800);
    return () => clearTimeout(timer);
  }, []);

  // -------------------------------------------------------------
  // 3. STUDENT INTERRUPTION (REAL-TIME QUESTIONING)
  // -------------------------------------------------------------
  const interruptTutor = async (questionText: string) => {
    if (!questionText.trim()) return;

    // 1. Immediately cut audio on the client side
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setTeacherState("LISTENING");
    setSpokenText(`Understanding question: "${questionText}"...`);

    // 2. Send interruption to backend
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "student_interrupt",
            data: { question: questionText }
          })
        );
      } else {
        await fetch("http://localhost:8000/api/live-class/interrupt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            question: questionText
          })
        });
      }
      setQuestionInput("");
    } catch (err) {
      console.error("Failed to interrupt live tutor:", err);
    }
  };

  // -------------------------------------------------------------
  // 4. SPEECH-TO-TEXT VOICE RECOGNITION (🎤 ASK THE TEACHER)
  // -------------------------------------------------------------
  const startVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not natively supported in this browser. Please type your question.");
      return;
    }

    if (isListeningMic) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
        // Instant audio cutoff upon clicking mic
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsSpeaking(false);
        setTeacherState("LISTENING");
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        console.log("Voice transcript received:", transcript);
        setQuestionInput(transcript);
        interruptTutor(transcript);
        setIsListeningMic(false);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Failed to initiate voice capture:", e);
      setIsListeningMic(false);
    }
  };

  // -------------------------------------------------------------
  // 5. CLASSROOM PEDAGOGICAL CONTROLS (Pause, Repeat, Simplify...)
  // -------------------------------------------------------------
  const triggerControlAction = async (action: string, value?: string) => {
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
        body: JSON.stringify({
          session_id: sessionId,
          action,
          value
        })
      });
    } catch (e) {
      console.error(`Failed to trigger control action ${action}:`, e);
    }
  };

  // -------------------------------------------------------------
  // 6. RENDER VISUAL CONTENT ACCORDING TO VISUAL SPEC
  // -------------------------------------------------------------
  const renderVisualArea = () => {
    const vType = visualSpec?.visualType || "process_animation";

    // Sub-view: 3D WebGL Engine
    if (activeVisualTab === "3d_webgl") {
      return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <Realtime3DVisualizer
            domain={topic.toLowerCase().includes("newton") ? "physics" : topic.toLowerCase().includes("photo") ? "biology" : "cs"}
            title={topic}
          />
        </div>
      );
    }

    // Sub-view: Whiteboard / Formula
    if (activeVisualTab === "whiteboard") {
      return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
              <Terminal className="w-4 h-4" />
              <span>LIVE AI TEACHER CHALKBOARD</span>
            </div>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 font-mono rounded">LaTeX & Trace Mode</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="p-6 bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-xl shadow-cyan-500/5 max-w-lg text-center">
              <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold block mb-2">
                Fundamental Equation / Axiom
              </span>
              <div className="text-3xl font-mono font-black text-slate-100 tracking-wider">
                Process = Program + PCB + Memory State
              </div>
              <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
                A program is passive code stored on secondary storage. When executed, the operating system allocates a Process Control Block (PCB), stack, heap, and register context.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-lg text-center font-mono text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="text-emerald-400 font-bold block">Program Counter</span>
                <span className="text-[10px] text-slate-400">Next instruction pointer</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="text-cyan-400 font-bold block">Stack & Heap</span>
                <span className="text-[10px] text-slate-400">Variables & Dynamic allocation</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="text-purple-400 font-bold block">PCB State</span>
                <span className="text-[10px] text-slate-400">Kernel bookkeeping table</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center">
            Synchronized dynamically with Dr. {tutorGender === "male" ? "Vikram" : "Arya"}'s spoken lecture
          </div>
        </div>
      );
    }

    // Visual Type 1: Program vs Process Comparison (Triggered on Interruption)
    if (vType === "comparison" || visualSpec?.type === "comparison") {
      return (
        <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{visualSpec.title || "Program vs Process Comparison"}</h3>
                  <p className="text-xs text-slate-400">Clarification requested by student</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-mono">
                Active Clarification
              </span>
            </div>

            {/* Visual Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Program Card */}
              <div className="p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                  <Database className="w-4 h-4" />
                  <span>Program (Passive Entity)</span>
                </div>
                <div className="aspect-[16/9] bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-3 text-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
                    <Database className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-bold">chrome.exe / script.py</span>
                  <span className="text-[10px] text-slate-400 mt-1">Stored passively on Secondary Disk</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-sans">
                  <li>Passive entity (binary code on disk)</li>
                  <li>Does NOT consume CPU clock cycles</li>
                  <li>No dynamic Program Counter or Stack</li>
                  <li>Lifespan: Exists indefinitely on drive</li>
                </ul>
              </div>

              {/* Process Card */}
              <div className="p-4 bg-slate-900/80 border border-cyan-500/50 rounded-2xl shadow-lg shadow-cyan-500/5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
                  <Cpu className="w-4 h-4" />
                  <span>Process (Active Entity)</span>
                </div>
                <div className="aspect-[16/9] bg-slate-950 rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center p-3 text-center mb-3 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mb-2 animate-pulse">
                    <Cpu className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="font-mono text-xs text-cyan-300 font-bold">PID: 4092 [Running in RAM]</span>
                  <span className="text-[10px] text-slate-400 mt-1">Allocated PCB, Stack, Heap, & CPU Registers</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-sans">
                  <li>Active entity in Main Memory (RAM)</li>
                  <li>Actively executes on CPU cores</li>
                  <li>Owns dedicated PCB, Stack, and Registers</li>
                  <li>Lifespan: Created $\to$ Executes $\to$ Terminates</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0" />
            <p className="text-xs text-cyan-200">
              <strong className="text-white">Analogy:</strong> A <em>recipe book</em> on your kitchen shelf is a <strong>Program</strong>. The chef actively baking the cake using that recipe is the <strong>Process</strong>!
            </p>
          </div>
        </div>
      );
    }

    // Visual Type 2: Process State Machine Animation (Default for OS Process Management)
    const states = [
      { id: "New", label: "NEW", desc: "Process is being created and admitted by the kernel scheduler.", color: "text-amber-400", border: "border-amber-500/40" },
      { id: "Ready", label: "READY", desc: "Loaded in RAM, waiting to be allocated a CPU core by scheduler.", color: "text-cyan-400", border: "border-cyan-500/40" },
      { id: "Running", label: "RUNNING", desc: "Instructions are actively executing on the CPU processor core.", color: "text-emerald-400", border: "border-emerald-500" },
      { id: "Waiting", label: "WAITING", desc: "Blocked waiting for I/O completion or disk transfer event.", color: "text-purple-400", border: "border-purple-500/40" },
      { id: "Terminated", label: "TERMINATED", desc: "Process has finished execution; OS frees RAM and PCB memory.", color: "text-rose-400", border: "border-rose-500/40" }
    ];

    return (
      <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-100">{visualSpec.title || "Operating System 5-State Process Model"}</h3>
                <p className="text-xs text-slate-400">Click any state to inspect kernel lifecycle behavior</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Process Flow
            </span>
          </div>

          {/* Interactive State Flow Diagram */}
          <div className="py-6 px-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl relative my-2">
            <div className="grid grid-cols-5 gap-3 items-center">
              {states.map((st, i) => {
                const isSelected = selectedProcessState === st.id;
                return (
                  <div key={st.id} className="relative flex flex-col items-center">
                    <button
                      onClick={() => setSelectedProcessState(st.id)}
                      className={`w-full py-3.5 px-2 rounded-xl font-mono text-xs font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? `bg-slate-800 ${st.color} border-2 ${st.border} shadow-lg shadow-cyan-500/10 scale-105`
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {st.label}
                    </button>
                    {i < states.length - 1 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-600">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Animated Packet Flow Line */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500 px-2">
              <span>Admit $\to$</span>
              <span>Scheduler Dispatch $\to$</span>
              <span className="text-emerald-400 font-bold">Executing</span>
              <span>$\to$ I/O Wait / Interrupt</span>
              <span>$\to$ Exit</span>
            </div>
          </div>

          {/* Selected State Deep Dive Inspector */}
          {selectedProcessState && (
            <div className="mt-4 p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 font-mono">
                  State Focus: <span className="text-cyan-400 uppercase">{selectedProcessState}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Kernel Scheduler Dispatcher</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {states.find((s) => s.id === selectedProcessState)?.desc}
              </p>
            </div>
          )}
        </div>

        {/* Live Synchronization Footnote */}
        <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Tutor speech synchronizes with visual timeline markers</span>
          </div>
          <button
            onClick={() => setActiveVisualTab("3d_webgl")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors cursor-pointer"
          >
            Switch to 3D Orbit View $\to$
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP CLASSROOM NAV BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-5 flex items-center justify-between z-30 shrink-0">
        {/* Left: Branding & Live Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shadow-cyan-500/20">
              AI
            </div>
            <span className="font-extrabold tracking-wide text-sm bg-gradient-to-r from-cyan-300 via-emerald-300 to-white bg-clip-text text-transparent">
              AI TEACHER CLASSROOM
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            LIVE
          </div>

          {isConnected ? (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> WS Synchronized
            </span>
          ) : (
            <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
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
            onClick={() => triggerControlAction("repeat")}
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

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SPLIT CLASSROOM (AVATAR LEFT | 3D VISUALS RIGHT) */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: AI TUTOR AVATAR & TRANSCRIPT (5 cols on lg) */}
        <section className="lg:col-span-5 flex flex-col gap-3 min-h-0">
          {/* Tutor Persona & Avatar Picker Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Tutor:</span>
              <button
                onClick={() => setTutorGender(tutorGender === "female" ? "male" : "female")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition-colors cursor-pointer"
              >
                {tutorGender === "female" ? "👩 Dr. Arya" : "👨 Dr. Vikram"}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-400">Persona:</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="strict">Strict</option>
                <option value="exam coach">Exam Coach</option>
                <option value="patient">Patient</option>
                <option value="socratic">Socratic</option>
              </select>
            </div>
          </div>

          {/* Teacher Avatar Box */}
          <div className="flex-shrink-0">
            <TeacherAvatar
              isSpeaking={isSpeaking}
              language={language}
              teacherName={tutorGender === "male" ? "Dr. Vikram" : "Dr. Arya"}
              tutorGender={tutorGender}
              teacherState={teacherState}
              persona={persona}
            />
          </div>

          {/* Real-time Spoken Explanation Subtitle Card */}
          <div className="flex-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto min-h-[140px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Live Teacher Spoken Stream
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Real-Time Neural Speech</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                "{spokenText}"
              </p>
            </div>

            {/* Hidden Audio Element for Streaming Voice */}
            <audio
              ref={audioRef}
              onPlay={() => setIsSpeaking(true)}
              onEnded={() => {
                setIsSpeaking(false);
                setTeacherState("IDLE");
              }}
              onError={(e) => {
                console.warn("Audio playback notice:", e);
                setIsSpeaking(false);
              }}
              className="hidden"
            />

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Voice: Microsoft Neural TTS</span>
              <span className="text-emerald-400">{isSpeaking ? "🔊 Active Voice" : "⏸ Paused"}</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: 3D VISUAL TEACHING ENGINE (7 cols on lg) */}
        <section className="lg:col-span-7 flex flex-col gap-3 min-h-0">
          {/* Visual Mode Navigation Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveVisualTab("visual_engine")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVisualTab === "visual_engine"
                    ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dynamic Visual Spec
              </button>
              <button
                onClick={() => setActiveVisualTab("3d_webgl")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVisualTab === "3d_webgl"
                    ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                3D WebGL Orbit
              </button>
              <button
                onClick={() => setActiveVisualTab("whiteboard")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeVisualTab === "whiteboard"
                    ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Whiteboard
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px]">GPU Three.js / SVG Engine</span>
            </div>
          </div>

          {/* Visual Workspace Container */}
          <div className="flex-1 min-h-0 relative">
            {renderVisualArea()}
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM LIVE CLASS CONTROLS & INTERACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-5 py-3 z-30 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Student Live Interruption Input Bar */}
          <div className="flex items-center gap-2">
            {/* 🎤 Ask the Teacher Voice Button */}
            <button
              onClick={startVoiceInput}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
                isListeningMic
                  ? "bg-rose-500 text-white animate-pulse shadow-rose-500/40 ring-2 ring-rose-400"
                  : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold shadow-cyan-500/20"
              }`}
              title="Interrupt and speak your question to the teacher"
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListeningMic ? "Listening..." : "🎤 Ask Teacher"}</span>
            </button>

            {/* Text Question Input */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") interruptTutor(questionInput);
                }}
                placeholder="Ask Dr. Arya/Vikram anything (e.g. 'Ma'am mujhe Process aur Program ka difference samajh nahi aaya')..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-inner pr-20"
              />
              <button
                onClick={() => interruptTutor(questionInput)}
                disabled={!questionInput.trim()}
                className="absolute right-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Pedagogical Reaction Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => triggerControlAction("simple")}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Explain with a simpler analogy"
              >
                <Baby className="w-3.5 h-3.5 text-amber-400" />
                <span>Explain Simply</span>
              </button>

              <button
                onClick={() => triggerControlAction("example")}
                className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Request concrete code/diagram example"
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
                    triggerControlAction("language", e.target.value);
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

          {/* Row 2: Progress & Transport Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
            {/* Play/Pause & Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerControlAction(isSpeaking ? "pause" : "resume")}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => triggerControlAction("next")}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Continue Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 w-72">
              <span className="text-[11px] font-mono text-slate-400">Progress:</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.max(15, lessonProgress)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">{lessonProgress || 33}%</span>
            </div>

            {/* Current Topic Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Topic: <strong className="text-slate-200">{topic}</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
