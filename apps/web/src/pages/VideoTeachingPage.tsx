import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  BookOpen,
  Sparkles,
  Loader2,
  Video,
  Layers,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { ITeachingScene, IVideoJob, SceneType, SubjectCategory } from '@ai-teacher/types';

export const VideoTeachingPage: React.FC = () => {
  // Input configuration
  const [topic, setTopic] = useState<string>("Newton's Laws of Motion (Inertia & Force Vectors)");
  const [subject, setSubject] = useState<SubjectCategory>('physics');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<IVideoJob | null>(null);

  // Playback state
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // 1. Initial Load: Check or initiate sample video
  useEffect(() => {
    handleGenerateVideo();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. Asynchronous Video Generation Pipeline: POST /api/video/generate -> Poll /api/video/jobs/:id
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setCurrentSceneIndex(0);
    setPlaybackTime(0);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          preference: 'fallback',
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.jobId) {
        pollJobStatus(json.data.jobId);
      }
    } catch (err) {
      console.error('Failed to initiate video generation:', err);
      setIsGenerating(false);
    }
  };

  // 3. Polling status until COMPLETED
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/jobs/${jobId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setActiveJob(json.data);
          if (json.data.status === 'COMPLETED' || json.data.status === 'FAILED') {
            clearInterval(interval);
            setIsGenerating(false);
            if (json.data.status === 'COMPLETED') {
              setIsPlaying(true);
            }
          }
        }
      } catch (err) {
        console.error('Job polling error:', err);
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 400);
  };

  // 4. Video Playback loop synchronization
  useEffect(() => {
    if (!isPlaying || !activeJob?.scenes?.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setPlaybackTime((prev) => {
        const currentScene = activeJob.scenes?.[currentSceneIndex];
        const sceneDuration = currentScene?.duration || 15;

        if (prev >= sceneDuration) {
          // Transition to next scene
          if (currentSceneIndex < (activeJob.scenes?.length || 1) - 1) {
            setCurrentSceneIndex((idx) => idx + 1);
            return 0;
          } else {
            // End of video
            setIsPlaying(false);
            return sceneDuration;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSceneIndex, activeJob?.scenes]);

  const activeScene: ITeachingScene | undefined = activeJob?.scenes?.[currentSceneIndex];

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReplay = () => {
    setCurrentSceneIndex(0);
    setPlaybackTime(0);
    setIsPlaying(true);
  };

  const handleSelectScene = (index: number) => {
    setCurrentSceneIndex(index);
    setPlaybackTime(0);
    setIsPlaying(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Topic Generator Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            AI Teaching Video Studio
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dynamic Multimodal Video Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Synchronized educational visuals, animated avatar, and domain-specific models (no talking heads).
          </p>
        </div>

        {/* Topic Input & Generation Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectCategory)}
            disabled={isGenerating}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="physics">Physics (Forces & Mechanics)</option>
            <option value="math">Mathematics (Calculus & Functions)</option>
            <option value="biology">Biology (Cellular Anatomy)</option>
            <option value="history">History (Chronology & Milestones)</option>
            <option value="programming">Programming (Simulation & Flow)</option>
          </select>

          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? 'Generating Video...' : 'Generate New Video'}</span>
          </button>
        </div>
      </div>

      {/* Generation Stage Tracker */}
      {isGenerating && activeJob && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-medium">
            <span className="text-indigo-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              {activeJob.currentStage || 'Processing video pipeline...'}
            </span>
            <span className="text-slate-400 font-mono">{activeJob.progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${activeJob.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Stage: {activeJob.currentStage}</span>
            <span>Estimated completion: &lt; 5s</span>
          </div>
        </div>
      )}

      {/* MAIN VIDEO PLAYER COMPONENT (Subject-Aware Blackboard Canvas + Avatar PiP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Video Viewport & Controls */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-2xl flex flex-col justify-between p-4 sm:p-6 group">
            {/* Top Bar: Scene Title & Type Badge */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  {activeScene?.type || 'INTRO'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  Scene {currentSceneIndex + 1}/{activeJob?.scenes?.length || 8}: {activeScene?.textOverlay?.headline}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  00:{playbackTime < 10 ? `0${playbackTime}` : playbackTime} / 00:{activeScene?.duration || 15}
                </span>
              </div>
            </div>

            {/* Central Stage: Subject-Aware Dynamic Visual Content */}
            <div className="flex-1 flex items-center justify-center my-3 relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800/80 p-3">
              {/* If Math: Render LaTeX & Coordinate Graph */}
              {activeScene?.visual?.subject === 'math' && (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                  <div
                    className="w-full h-full max-h-[220px]"
                    dangerouslySetInnerHTML={{ __html: activeScene.visual.svgData || '' }}
                  />
                  {activeScene.visual.latexFormula && (
                    <div className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-sky-300 font-mono text-xs">
                      {activeScene.visual.latexFormula}
                    </div>
                  )}
                </div>
              )}

              {/* If Physics: Render SVG Vector Simulation & Equilibrium */}
              {activeScene?.visual?.subject === 'physics' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    className="w-full h-full max-h-[240px]"
                    dangerouslySetInnerHTML={{ __html: activeScene.visual.svgData || '' }}
                  />
                </div>
              )}

              {/* If Biology: Render Cellular Organelles */}
              {activeScene?.visual?.subject === 'biology' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    className="w-full h-full max-h-[240px]"
                    dangerouslySetInnerHTML={{ __html: activeScene.visual.svgData || '' }}
                  />
                </div>
              )}

              {/* If History: Render Chronology Timeline */}
              {activeScene?.visual?.subject === 'history' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div
                    className="w-full h-full max-h-[240px]"
                    dangerouslySetInnerHTML={{ __html: activeScene.visual.svgData || '' }}
                  />
                </div>
              )}

              {/* If Programming: Render Code Terminal & Execution Output */}
              {activeScene?.visual?.subject === 'programming' && (
                <div className="w-full h-full flex flex-col justify-between font-mono text-xs">
                  <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 overflow-x-auto max-h-[140px]">
                    <code>{activeScene.visual.codeSnippet}</code>
                  </pre>
                  <div className="mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px]">
                    <div className="text-slate-500 font-semibold uppercase text-[9px] mb-1">Terminal Output</div>
                    <pre className="text-sky-300 whitespace-pre-wrap">{activeScene.visual.executionOutput}</pre>
                  </div>
                </div>
              )}

              {/* Picture-in-Picture Animated Teacher Avatar */}
              <div className="absolute bottom-3 right-3 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-indigo-500/60 bg-slate-950 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105">
                {activeScene?.avatar?.avatarVideoUrl ? (
                  <img
                    src={activeScene.avatar.avatarVideoUrl}
                    alt="Teacher Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                    Avatar
                  </div>
                )}
                <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[9px] font-bold text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  <span>Prof. Maya</span>
                  {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
              </div>
            </div>

            {/* Subtitles & Kinetic Text Overlay Bar */}
            <div className="z-10 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-sm">
              <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
                "{activeScene?.script || 'Loading lesson narration...'}"
              </p>
            </div>
          </div>

          {/* Video Control Bar: Play, Pause, Replay, Scrubber, Download, Sources */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Replay from Scene 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-slate-400 font-mono text-[11px] ml-2">
                Scene {currentSceneIndex + 1} of {activeJob?.scenes?.length || 8}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeJob?.downloadUrl && (
                <a
                  href={activeJob.downloadUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download MP4</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsSourcesDrawerOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>View Lesson Sources</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Scene Playlist & Sources Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Lesson Scenes ({activeJob?.scenes?.length || 8})
              </span>
              <span className="text-[11px] text-slate-500">Click to jump</span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {activeJob?.scenes?.map((scene, idx) => {
                const isCurrent = currentSceneIndex === idx;
                return (
                  <button
                    key={scene.sceneId}
                    type="button"
                    onClick={() => handleSelectScene(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-500/20 to-sky-500/10 border-indigo-500/40 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold ${
                        isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                          {scene.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {scene.duration}s
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                        {scene.textOverlay?.headline}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {scene.script}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson Sources Collapsible Drawer */}
          {isSourcesDrawerOpen && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Lesson Reference Sources
                </span>
                <button
                  type="button"
                  onClick={() => setIsSourcesDrawerOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {activeJob?.lessonSources?.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-200">{src.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{src.citation}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
                      {src.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
