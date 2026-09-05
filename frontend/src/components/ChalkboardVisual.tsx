"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Activity,
  Sliders,
  Zap,
  Info,
  RefreshCw,
  Eye,
  Film,
  FileText,
  Camera,
  CheckCircle2,
  Cpu,
  Lightbulb,
  SkipBack,
  SkipForward,
  Subtitles,
  Video,
  Download,
  Compass,
  Clock
} from "lucide-react";
import { Realtime3DVisualizer } from "./Realtime3DVisualizer";

interface ChalkboardVisualProps {
  visualData: any;
  conceptTitle: string;
  explanation?: string;
  audioUrl?: string | null;
  isSpeaking?: boolean;
  onTogglePlayPause?: () => void;
  renderedVideoUrl?: string | null;
  onRenderVideo?: () => void;
  isRenderingVideo?: boolean;
  concepts?: any[];
  activeConceptIndex?: number;
  onSelectConcept?: (index: number) => void;
  explanationMode?: "basic" | "medium" | "hard";
  targetTimeMinutes?: number;
  estimatedConceptSeconds?: number;
}

type TabMode = "animation_video" | "3d_sim" | "schematic" | "notes";

export const ChalkboardVisual: React.FC<ChalkboardVisualProps> = ({
  visualData,
  conceptTitle,
  explanation = "",
  audioUrl,
  isSpeaking = false,
  onTogglePlayPause,
  renderedVideoUrl,
  onRenderVideo,
  isRenderingVideo = false,
  concepts = [],
  activeConceptIndex = 0,
  onSelectConcept,
  explanationMode = "basic",
  targetTimeMinutes = 20,
  estimatedConceptSeconds
}) => {
  // Primary Default Mode: ANIMATED 3D VIDEO TUTORIAL
  const [activeTab, setActiveTab] = useState<TabMode>("animation_video");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoProgress, setVideoProgress] = useState<number>(12);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<"webgl_3d" | "render_3d">("render_3d");
  const [reset3DSignal, setReset3DSignal] = useState<number>(0);

  // 3D Sim parameters
  const [cameraAngle, setCameraAngle] = useState<{ yaw: number; pitch: number }>({
    yaw: 0.45,
    pitch: 0.32
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [param1, setParam1] = useState<number>(70); // Velocity / Attention heads
  const [param2, setParam2] = useState<number>(55); // Central mass / Embedding Dim

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const title = visualData?.title || conceptTitle || "Concept Visualizer";
  const titleLower = (
    title +
    " " +
    (visualData?.summary || "") +
    " " +
    (visualData?.detected_domain || "")
  ).toLowerCase();

  // Robust Subject & Domain Detection
  const domain = React.useMemo(() => {
    if (visualData?.detected_domain) return visualData.detected_domain;
    if (
      titleLower.includes("transformer") ||
      titleLower.includes("llm") ||
      titleLower.includes("language model") ||
      titleLower.includes("attention") ||
      titleLower.includes("neural") ||
      titleLower.includes("deep learning") ||
      titleLower.includes("gpt") ||
      titleLower.includes("token") ||
      titleLower.includes("embedding") ||
      titleLower.includes("ai")
    ) {
      return "ai";
    }
    if (
      titleLower.includes("process") ||
      titleLower.includes("os") ||
      titleLower.includes("thread") ||
      titleLower.includes("schedul") ||
      titleLower.includes("memory") ||
      titleLower.includes("sort") ||
      titleLower.includes("tree") ||
      titleLower.includes("code") ||
      titleLower.includes("algo") ||
      titleLower.includes("binary") ||
      titleLower.includes("graph") ||
      titleLower.includes("comput") ||
      titleLower.includes("system")
    ) {
      return "cs";
    }
    if (
      titleLower.includes("newton") ||
      titleLower.includes("orbit") ||
      titleLower.includes("gravit") ||
      titleLower.includes("force") ||
      titleLower.includes("velocity") ||
      titleLower.includes("motion") ||
      titleLower.includes("fall") ||
      titleLower.includes("law") ||
      titleLower.includes("physic") ||
      titleLower.includes("kinet") ||
      titleLower.includes("mechan") ||
      titleLower.includes("inerti") ||
      titleLower.includes("mass") ||
      titleLower.includes("accel")
    ) {
      return "physics";
    }
    if (
      titleLower.includes("photo") ||
      titleLower.includes("cell") ||
      titleLower.includes("dna") ||
      titleLower.includes("bio") ||
      titleLower.includes("plant") ||
      titleLower.includes("organ")
    ) {
      return "biology";
    }
    if (
      titleLower.includes("atom") ||
      titleLower.includes("chem") ||
      titleLower.includes("electron") ||
      titleLower.includes("molecule") ||
      titleLower.includes("quantum") ||
      titleLower.includes("bond")
    ) {
      return "chemistry";
    }
    return "ai";
  }, [titleLower, visualData]);

  // Concept-specific High-Resolution 3D Model Asset
  const realistic3DModelSrc = React.useMemo(() => {
    if (visualData?.image_url) return visualData.image_url;

    // AI & Deep Learning
    if (domain === "ai") {
      return "/visual_ai_transformer.jpg";
    }

    // Computer Science & Sorting Algorithms
    if (domain === "cs") {
      return "/visual_cs_sorting.jpg";
    }

    // Biology & Cellular Photosynthesis
    if (domain === "biology") {
      return "/visual_bio_chloroplast.jpg";
    }

    // Chemistry & Quantum Atomic Physics
    if (domain === "chemistry") {
      return "/visual_chem_atom.jpg";
    }

    // Physics & Space / Mechanics
    if (domain === "physics") {
      // If celestial, orbital, or 3rd law action-reaction
      if (
        titleLower.includes("orbit") ||
        titleLower.includes("gravit") ||
        titleLower.includes("space") ||
        titleLower.includes("planet") ||
        titleLower.includes("sun") ||
        titleLower.includes("earth") ||
        titleLower.includes("third law") ||
        titleLower.includes("action")
      ) {
        return "/visual_space_orbit.jpg";
      }
      return "/visual_phys_mechanics.jpg";
    }

    return "/visual_gen_science.jpg";
  }, [domain, titleLower, visualData]);

  // Video Tutorial Timing based on student's chosen lesson time budget
  const totalVideoDuration = React.useMemo(() => {
    if (estimatedConceptSeconds && estimatedConceptSeconds > 0) {
      return estimatedConceptSeconds;
    }
    if (concepts && concepts[activeConceptIndex]?.estimated_seconds) {
      return concepts[activeConceptIndex].estimated_seconds;
    }
    const numConcepts = concepts && concepts.length > 0 ? concepts.length : 4;
    const minsPerConcept = (targetTimeMinutes || 20) / numConcepts;
    return Math.max(60, Math.round(minsPerConcept * 60));
  }, [estimatedConceptSeconds, concepts, activeConceptIndex, targetTimeMinutes]);

  const currentVideoTime = (videoProgress / 100) * totalVideoDuration;


  // Video Timeline Auto-Scrub Loop
  useEffect(() => {
    if (activeTab !== "animation_video" || !isPlaying) return;

    const interval = setInterval(() => {
      setVideoProgress((prev) => {
        const delta = (100 / totalVideoDuration) * 0.05 * playbackSpeed;
        const next = prev + delta;
        return next >= 100 ? 0 : next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeTab, isPlaying, playbackSpeed, totalVideoDuration]);

  // Sync isPlaying with teacher voice
  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (onTogglePlayPause) {
      onTogglePlayPause();
    }
  };

  const handleSkip = (seconds: number) => {
    const deltaPercent = (seconds / totalVideoDuration) * 100;
    setVideoProgress((prev) => Math.max(0, Math.min(100, prev + deltaPercent)));
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };


  // Drag handlers for 3D Sim
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setCameraAngle((prev) => ({
      yaw: prev.yaw + dx * 0.008,
      pitch: Math.max(-1.2, Math.min(1.2, prev.pitch + dy * 0.008))
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // --------------------------------------------------------------------------
  // 60 FPS Dynamic Animated Overlay Engine (Layered over Realistic 3D Model)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let animClock = 0;

    const render = () => {
      if (isPlaying) {
        animClock += 0.02 * playbackSpeed;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // In 3D Sim mode, draw background starfield grid
      if (activeTab === "3d_sim") {
        const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(w, h));
        bgGrad.addColorStop(0, "#0d1527");
        bgGrad.addColorStop(1, "#03060a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // -----------------------------------------------------------------------
      // DYNAMIC 3D ANIMATED OVERLAY (Tailored to current topic/slide)
      // -----------------------------------------------------------------------
      if (activeTab === "animation_video") {
        // 1. Animated Holographic Corner Target HUDs
        ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
        ctx.lineWidth = 1.5;
        const cornerSize = 24;
        const padding = 20;

        // Top Left Bracket
        ctx.beginPath();
        ctx.moveTo(padding, padding + cornerSize);
        ctx.lineTo(padding, padding);
        ctx.lineTo(padding + cornerSize, padding);
        ctx.stroke();

        // Top Right Bracket
        ctx.beginPath();
        ctx.moveTo(w - padding - cornerSize, padding);
        ctx.lineTo(w - padding, padding);
        ctx.lineTo(w - padding, padding + cornerSize);
        ctx.stroke();

        // Bottom Left Bracket
        ctx.beginPath();
        ctx.moveTo(padding, h - padding - cornerSize);
        ctx.lineTo(padding, h - padding);
        ctx.lineTo(padding + cornerSize, h - padding);
        ctx.stroke();

        // Bottom Right Bracket
        ctx.beginPath();
        ctx.moveTo(w - padding - cornerSize, h - padding);
        ctx.lineTo(w - padding, h - padding);
        ctx.lineTo(w - padding, h - padding - cornerSize);
        ctx.stroke();

        // 2. Animated Holographic Telemetry Rings (Right Stage)
        const ringX = w * 0.78;
        const ringY = h * 0.35;
        const ringRad = 45;

        ctx.save();
        ctx.translate(ringX, ringY);
        ctx.rotate(animClock * 0.5);

        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringRad, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ringRad * 0.75, Math.PI * 0.5, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Holographic Telemetry Data Label
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "center";
        ctx.fillText("3D TELEMETRY", ringX, ringY + ringRad + 16);
        ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
        ctx.fillText(`ROT: ${(animClock * 18 % 360).toFixed(1)}°`, ringX, ringY + ringRad + 28);

        // 3. Floating 3D Vector / Attention Flow Rays
        if (domain === "ai") {
          // Dynamic Softmax Attention Rays between floating points
          const points = [
            { x: cx - 120, y: cy + 40, label: "Query Q" },
            { x: cx, y: cy - 60, label: "Attention Core" },
            { x: cx + 120, y: cy + 30, label: "Key K" },
            { x: cx, y: cy + 90, label: "Value V" }
          ];

          for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const pulse = Math.sin(animClock * 3 + i) * 0.4 + 0.6;

            // Glowing connecting laser
            ctx.strokeStyle = `rgba(6, 182, 212, ${pulse * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Glowing Node
            ctx.fillStyle = "#38bdf8";
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Callout text badge
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.fillText(p1.label, p1.x, p1.y - 10);
          }
        } else if (domain === "cs") {
          // Algorithm Comparison Laser Beams
          const barCount = 8;
          const startX = cx - 140;
          const barSpacing = 40;
          const activeSwap = Math.floor((animClock * 1.5) % (barCount - 1));

          for (let b = 0; b < barCount; b++) {
            const bx = startX + b * barSpacing;
            const isComparing = b === activeSwap || b === activeSwap + 1;

            if (isComparing) {
              // Glowing comparison arch
              ctx.strokeStyle = "#f43f5e";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(bx + 20, cy + 50, 20, Math.PI, 0);
              ctx.stroke();

              ctx.fillStyle = "#f43f5e";
              ctx.font = "bold 10px monospace";
              ctx.fillText("COMPARING", bx + 20, cy + 20);
            }
          }
        } else if (domain === "physics") {
          // Real-time Gravitational & Velocity Vectors
          const orbitR = 110;
          const ox = cx + Math.cos(animClock * 1.2) * orbitR;
          const oy = cy + Math.sin(animClock * 1.2) * (orbitR * 0.55);

          // Force Vector to Center (Rose Neon)
          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + (cx - ox) * 0.45, oy + (cy - oy) * 0.45);
          ctx.stroke();

          // Velocity Vector Tangent (Emerald Neon)
          const vx = -Math.sin(animClock * 1.2) * 50;
          const vy = Math.cos(animClock * 1.2) * 30;
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + vx, oy + vy);
          ctx.stroke();

          // Node Orbiter
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(ox, oy, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "bold 10px monospace";
          ctx.fillStyle = "#f43f5e";
          ctx.fillText("F_g = mg", ox - 20, oy - 12);
          ctx.fillStyle = "#10b981";
          ctx.fillText("v (Velocity)", ox + vx + 8, oy + vy);
        } else if (domain === "biology") {
          // Dynamic Photon Stream in Sunlight
          for (let p = 0; p < 6; p++) {
            const pProgress = (animClock * 2.5 + p * 0.5) % 3;
            const px = cx - 120 + p * 40;
            const py = cy - 110 + pProgress * 70;

            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = "#facc15";
          ctx.font = "bold 10px monospace";
          ctx.fillText("PHOTON FLUX (hν)", cx, cy - 120);
        } else if (domain === "chemistry") {
          // Dynamic Electron Orbit Rings
          ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 120, 60, animClock * 0.3, 0, Math.PI * 2);
          ctx.stroke();

          // Electron Particle
          const ex = cx + Math.cos(animClock * 2) * 120;
          const ey = cy + Math.sin(animClock * 2) * 60;
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(ex, ey, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 10px monospace";
          ctx.fillText("e⁻ (Spin: +½)", ex + 10, ey);
        }

        // 4. Floating Holographic Mathematical Formula Card (Top-Left of stage)
        const fCardX = 35;
        const fCardY = 60;
        const formulaText =
          domain === "ai"
            ? "Attention(Q, K, V) = softmax(Q·Kᵀ / √d_k) · V"
            : domain === "cs"
            ? "T(n) = O(n²) Bubble Sort Comparisons"
            : domain === "physics"
            ? "ΣF = m·a  ⟺  F_net = m · (dv/dt)"
            : domain === "biology"
            ? "6CO₂ + 6H₂O + Photons ⟶ C₆H₁₂O₆ + 6O₂"
            : "Ψ(r, θ, φ) = R_nl(r) · Y_lm(θ, φ)";

        ctx.fillStyle = "rgba(10, 15, 29, 0.82)";
        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(fCardX, fCardY, 340, 48, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "left";
        ctx.fillText("GOVERNING EQUATION & PARAMETERS", fCardX + 14, fCardY + 18);

        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#facc15";
        ctx.fillText(formulaText, fCardX + 14, fCardY + 36);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, domain, cameraAngle, isDragging, playbackSpeed, isPlaying, param1, param2]);

  // Real world example text
  const realWorldExample =
    visualData?.real_world_example ||
    (domain === "ai"
      ? "Real-world example: When reading 'The bank of the river', self-attention links 'bank' to 'river' rather than a financial bank."
      : domain === "physics"
      ? "Real-world example: A spaceship firing thrusters in deep vacuum accelerates continuously because there is zero opposing aerodynamic friction."
      : domain === "cs"
      ? "Real-world example: Sorting a hand of cards from lowest to highest by scanning and swapping adjacent cards."
      : domain === "biology"
      ? "Real-world example: Plant leaves converting radiant solar photons into glucose energy molecules."
      : "Practical scientific application grounded in your educational material.");

  // Active Subtitle Line synchronized with video
  const activeSubtitle = React.useMemo(() => {
    if (!explanation) {
      return `${title}: Observing active 3D model simulation and mathematical parameters in real-time.`;
    }
    // Support English (. ! ?) as well as Hindi Poorna Viraam (।) and line breaks
    const sentences = explanation
      .split(/[.!?।\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) return explanation;
    const sentenceIndex = Math.floor((videoProgress / 100) * sentences.length);
    return sentences[Math.min(sentenceIndex, sentences.length - 1)];
  }, [explanation, videoProgress, title]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-950/95 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl shadow-2xl relative overflow-hidden"
    >

      {/* ------------------------------------------------------------------- */}
      {/* TOP STUDIO HEADER BAR & MODE TABS */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-slate-800/80 bg-slate-950/60 z-20">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">{title}</h2>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded text-[10px] uppercase font-mono font-bold">
                {domain.toUpperCase()} • 8K 3D MODEL
              </span>
              {/* Level / Mode Badge */}
              {explanationMode === "basic" && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  🟢 Basic (सरल)
                </span>
              )}
              {explanationMode === "medium" && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  🟡 Medium (प्रैक्टिकल)
                </span>
              )}
              {explanationMode === "hard" && (
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  🔴 Hard (डीप डाइव)
                </span>
              )}
              {/* Selected Target Time Badge */}
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                ⏱️ {targetTimeMinutes || 20} MIN LESSON (~{Math.round(totalVideoDuration / 60)}M NODE)
              </span>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[10px] uppercase font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                60 FPS ANIMATED VIDEO
              </span>
            </div>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("animation_video")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
              activeTab === "animation_video"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            3D Animated Video
          </button>

          <button
            onClick={() => setActiveTab("3d_sim")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === "3d_sim"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Interactive Lab
          </button>

          <button
            onClick={() => setActiveTab("schematic")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === "schematic"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Schematic
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
              activeTab === "notes"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN VISUAL DISPLAY AREA */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
        {/* ================================================================= */}
        {/* TAB 1: PHOTOREALISTIC 3D ANIMATED VIDEO TUTORIAL (PRIMARY!) */}
        {/* ================================================================= */}
        {activeTab === "animation_video" && (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Top Video Stage Controls */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-end pointer-events-none">

              <div className="flex items-center gap-2 pointer-events-auto">
                {onRenderVideo && (
                  <button
                    onClick={onRenderVideo}
                    disabled={isRenderingVideo}
                    className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isRenderingVideo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isRenderingVideo ? "Rendering MP4..." : "Export MP4"}</span>
                  </button>
                )}

                {/* 8K Ultra Cinema Mode Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-amber-400/40 rounded-xl text-xs font-mono font-bold text-amber-300 backdrop-blur-md shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>8K ULTRA CINEMA</span>
                </div>

                <button
                  onClick={handleToggleFullscreen}
                  className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-md"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Visual Stage: Photorealistic 8K Model Render */}
            <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center group bg-slate-950">
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  key={realistic3DModelSrc}
                  src={realistic3DModelSrc}
                  alt={title}
                  className={`w-full h-full object-cover object-center filter contrast-[1.08] brightness-[1.02] transition-all duration-1000 ${
                    isPlaying ? "scale-[1.03]" : "scale-100"
                  }`}
                />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/20 to-slate-950/70 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none" />
              </div>

              {/* Layer 2: 60 FPS Transparent Kinetic Canvas Layer */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              />

              {/* Floating Big Play/Pause Touch Target */}
              <div
                onClick={handleTogglePlay}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 cursor-pointer z-15 ${
                  !isPlaying ? "opacity-100 bg-slate-950/30 backdrop-blur-[2px]" : "opacity-0 hover:opacity-100"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transform transition-transform hover:scale-110">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </div>
              </div>


            </div>

            {/* --------------------------------------------------------------- */}
            {/* FULL VIDEO PLAYER CONTROLS (SEEKBAR, SPEED, TIMECODE) */}
            {/* --------------------------------------------------------------- */}
            <div className="p-3 bg-slate-950/95 border-t border-slate-800/90 flex flex-col gap-2 z-20">
              {/* Interactive Timeline Scrubber */}
              <div className="relative w-full flex flex-col">
                <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden flex cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-75 relative"
                    style={{ width: `${videoProgress}%` }}
                  >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md shadow-cyan-400" />
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={videoProgress}
                  onChange={(e) => setVideoProgress(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Player Control Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="w-8 h-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => handleSkip(-5)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Rewind 5s"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleSkip(5)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Forward 5s"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setVideoProgress(0)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Time Display */}
                  <div className="ml-2 font-mono text-xs text-slate-300 flex items-center gap-2">
                    <div>
                      <span>
                        {Math.floor(currentVideoTime / 60).toString().padStart(2, "0")}:
                        {Math.floor(currentVideoTime % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-slate-500">
                        {Math.floor(totalVideoDuration / 60).toString().padStart(2, "0")}:
                        {Math.floor(totalVideoDuration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-[10px] font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{targetTimeMinutes || 20}m Total Plan</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">

                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? "bg-cyan-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: INTERACTIVE 3D LAB (Hands-on parameter controls) */}
        {/* ================================================================= */}
        {/* ================================================================= */}
        {/* TAB 2: INTERACTIVE 3D LAB (Hands-on parameter controls) */}
        {/* ================================================================= */}
        {activeTab === "3d_sim" && (
          <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 overflow-hidden">
            {/* Top Bar for Interactive Sandbox */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/90 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 backdrop-blur-md shadow-xl pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-400">🧪 VIRTUAL EXPERIMENT LAB</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">HANDS-ON PHYSICS SANDBOX</span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setReset3DSignal((prev) => prev + 1)}
                  className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Reset 3D Camera Orbit"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Camera</span>
                </button>

                <button
                  onClick={handleToggleFullscreen}
                  className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-md"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Live Telemetry Floating HUD */}
            <div className="absolute top-14 left-3 z-20 pointer-events-none flex flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-slate-950/85 border border-slate-800/90 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Net Force (F):</span>
                <span className="text-cyan-400 font-bold">{(param1 * 1.5).toFixed(0)} N</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-950/85 border border-slate-800/90 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Mass (m):</span>
                <span className="text-amber-400 font-bold">{param2} kg</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-950/85 border border-emerald-500/40 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Accel (a = F/m):</span>
                <span className="text-emerald-400 font-bold">{((param1 * 1.5) / param2).toFixed(2)} m/s²</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-950/85 border border-indigo-500/40 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Velocity (v):</span>
                <span className="text-indigo-300 font-bold">{((param1 * 1.5) / param2 * (isPlaying ? 2.8 : 0)).toFixed(1)} m/s</span>
              </div>
            </div>

            {/* 3D Simulation Canvas */}
            <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
              <Realtime3DVisualizer
                key={`${domain}-${title}-sim-lab`}
                domain={domain}
                title={title}
                isPlaying={isPlaying}
                speed={playbackSpeed}
                param1={param1}
                param2={param2}
                resetSignal={reset3DSignal}
              />
            </div>

            {/* Interactive Physics / Simulation Controls Bar */}
            <div className="p-3.5 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 z-20">
              {/* Sliders */}
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-slate-300 whitespace-nowrap font-semibold">
                    {domain === "ai"
                      ? "Attention Heads:"
                      : domain === "physics"
                      ? "Applied Force (F):"
                      : "Execution Speed:"}
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={param1}
                    onChange={(e) => setParam1(Number(e.target.value))}
                    className="w-28 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-xs font-mono text-cyan-400 font-bold w-12">
                    {domain === "physics" ? `${(param1 * 1.5).toFixed(0)} N` : `${param1}%`}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-slate-300 whitespace-nowrap font-semibold">
                    {domain === "ai"
                      ? "Embedding Dim:"
                      : domain === "physics"
                      ? "Object Mass (m):"
                      : "Layer Depth:"}
                  </span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={param2}
                    onChange={(e) => setParam2(Number(e.target.value))}
                    className="w-28 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-xs font-mono text-amber-400 font-bold w-12">
                    {domain === "physics" ? `${param2} kg` : `${param2}`}
                  </span>
                </div>
              </div>

              {/* Experiment Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParam1((prev) => Math.min(100, prev + 25))}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold text-cyan-300 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Inject +50 N Push Impulse"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+50N Impulse</span>
                </button>

                <button
                  onClick={() => {
                    setParam1(10);
                    setIsPlaying(false);
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs font-mono font-bold text-rose-300 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Apply Emergency Brake"
                >
                  <Pause className="w-3.5 h-3.5 text-rose-400" />
                  <span>Brake</span>
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause Sim" : "Resume Sim"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: TECHNICAL SCHEMATIC & BLUEPRINT */}
        {/* ================================================================= */}
        {activeTab === "schematic" && (
          <div className="w-full h-full p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="relative w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[340px]">
              {domain === "ai" && (
                <svg viewBox="0 0 600 280" className="w-full max-w-xl h-auto drop-shadow-xl">
                  <rect x="50" y="210" width="500" height="50" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
                  <text x="300" y="240" textAnchor="middle" fill="#38bdf8" fontFamily="monospace" fontWeight="bold" fontSize="13">
                    Input Tokens + Positional Encoding E = TokenEmbed(x) + PE(pos)
                  </text>
                  <line x1="300" y1="210" x2="300" y2="160" stroke="#38bdf8" strokeWidth="3" />
                  <polygon points="300,155 294,168 306,168" fill="#38bdf8" />
                  <rect x="120" y="90" width="360" height="65" rx="12" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                  <text x="300" y="120" textAnchor="middle" fill="#c7d2fe" fontFamily="monospace" fontWeight="bold" fontSize="14">
                    MULTI-HEAD ATTENTION (h Heads)
                  </text>
                  <text x="300" y="140" textAnchor="middle" fill="#a5b4fc" fontFamily="monospace" fontSize="11">
                    Head_i = Softmax(Q_i · K_iᵀ / √d_k) · V_i
                  </text>
                  <line x1="300" y1="90" x2="300" y2="45" stroke="#10b981" strokeWidth="3" />
                  <polygon points="300,40 294,52 306,52" fill="#10b981" />
                  <rect x="160" y="10" width="280" height="35" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                  <text x="300" y="32" textAnchor="middle" fill="#a7f3d0" fontFamily="monospace" fontWeight="bold" fontSize="12">
                    Feed-Forward Layer & LayerNorm(x + Sublayer(x))
                  </text>
                </svg>
              )}

              {domain === "physics" && (
                <svg viewBox="0 0 600 280" className="w-full max-w-xl h-auto drop-shadow-xl">
                  <line x1="50" y1="210" x2="550" y2="210" stroke="#475569" strokeWidth="3" />
                  <rect x="240" y="110" width="120" height="100" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2.5" />
                  <text x="300" y="165" textAnchor="middle" fill="#f8fafc" fontFamily="monospace" fontWeight="bold" fontSize="18">
                    m = 10 kg
                  </text>
                  <line x1="300" y1="110" x2="300" y2="25" stroke="#38bdf8" strokeWidth="3.5" />
                  <polygon points="300,20 294,35 306,35" fill="#38bdf8" />
                  <text x="315" y="35" fill="#38bdf8" fontFamily="monospace" fontWeight="bold" fontSize="13">
                    N = mg (Normal Force)
                  </text>
                  <line x1="300" y1="210" x2="300" y2="275" stroke="#f43f5e" strokeWidth="3.5" />
                  <polygon points="300,280 294,265 306,265" fill="#f43f5e" />
                  <text x="315" y="275" fill="#f43f5e" fontFamily="monospace" fontWeight="bold" fontSize="13">
                    W = m·g (Gravity)
                  </text>
                  <line x1="360" y1="160" x2="490" y2="160" stroke="#10b981" strokeWidth="3.5" />
                  <polygon points="495,160 480,154 480,166" fill="#10b981" />
                  <text x="420" y="145" fill="#10b981" fontFamily="monospace" fontWeight="bold" fontSize="13">
                    F_applied = 150 N →
                  </text>
                  <line x1="240" y1="190" x2="130" y2="190" stroke="#f59e0b" strokeWidth="3.5" />
                  <polygon points="125,190 140,184 140,196" fill="#f59e0b" />
                  <text x="135" y="175" fill="#f59e0b" fontFamily="monospace" fontWeight="bold" fontSize="13">
                    ← f_k = μ·N (Friction)
                  </text>
                </svg>
              )}

              {domain !== "ai" && domain !== "physics" && (
                <svg viewBox="0 0 600 240" className="w-full max-w-xl h-auto drop-shadow-xl">
                  <rect x="30" y="80" width="130" height="80" rx="12" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
                  <text x="95" y="115" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13">
                    INPUT STATE
                  </text>
                  <line x1="160" y1="120" x2="230" y2="120" stroke="#38bdf8" strokeWidth="3" />
                  <polygon points="235,120 225,115 225,125" fill="#38bdf8" />
                  <rect x="235" y="60" width="160" height="120" rx="16" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                  <text x="315" y="110" textAnchor="middle" fill="#c7d2fe" fontWeight="bold" fontSize="14">
                    TRANSFORMATION
                  </text>
                  <line x1="395" y1="120" x2="465" y2="120" stroke="#10b981" strokeWidth="3" />
                  <polygon points="470,120 460,115 460,125" fill="#10b981" />
                  <rect x="470" y="80" width="110" height="80" rx="12" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                  <text x="525" y="115" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13">
                    EQUILIBRIUM
                  </text>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: CONCEPT STUDY NOTES */}
        {/* ================================================================= */}
        {activeTab === "notes" && (
          <div className="w-full h-full p-6 overflow-y-auto space-y-4">
            {/* Active Level Header Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between shadow-md ${
                explanationMode === "basic"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : explanationMode === "hard"
                  ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold font-mono">
                <Sparkles className="w-4 h-4" />
                <span>
                  ACTIVE MODE:{" "}
                  {explanationMode === "basic"
                    ? "🟢 BASIC (सरल अवधारणा)"
                    : explanationMode === "hard"
                    ? "🔴 HARD (गहन गणितीय विश्लेषण)"
                    : "🟡 MEDIUM (प्रायोगिक एवं व्यावहारिक)"}
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Tier: {explanationMode.toUpperCase()}
              </span>
            </div>

            {/* Core Principle / Summary */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-slate-900/60 border border-indigo-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {explanationMode === "hard"
                  ? "Theoretical Principle & Formal Derivation"
                  : explanationMode === "medium"
                  ? "Engineering Principle & Mechanism"
                  : "Fundamental Everyday Principle"}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {visualData?.summary ||
                  `Deep conceptual breakdown of ${title} structured according to progressive learning outcomes.`}
              </p>
            </div>

            {/* Key Takeaway */}
            {visualData?.key_takeaway && (
              <div className="p-3 bg-slate-900/90 border border-cyan-500/30 rounded-xl flex items-center gap-2.5 text-xs text-cyan-200 font-mono">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{visualData.key_takeaway}</span>
              </div>
            )}

            {/* Bullets Breakdown */}
            {visualData?.bullets && Array.isArray(visualData.bullets) && visualData.bullets.length > 0 && (
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {explanationMode === "hard"
                    ? "Advanced Derivation Points & Invariants:"
                    : explanationMode === "medium"
                    ? "Key Quantitative Steps:"
                    : "Key Observations:"}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {visualData.bullets.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Real World Analogy / Application */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  {explanationMode === "hard"
                    ? "Advanced System Application"
                    : explanationMode === "medium"
                    ? "Practical Engineering Application"
                    : "Everyday Real-World Analogy"}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {visualData?.real_world_example || realWorldExample}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
