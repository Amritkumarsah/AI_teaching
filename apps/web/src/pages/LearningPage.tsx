import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Volume2,
  Layers,
  Lightbulb,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LessonConcept {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  script: string;
  keyTakeaway: string;
}

const SAMPLE_LESSON = {
  id: 'lesson-001',
  topic: "Newton's Laws of Motion: Core Intuition",
  subject: 'Physics',
  level: 'Intermediate',
  durationMinutes: 20,
  concepts: [
    {
      id: 'c1',
      title: '1. The Principle of Inertia (First Law)',
      durationMinutes: 6,
      completed: true,
      script:
        'An object at rest stays at rest, and an object in motion stays in uniform motion unless acted upon by an unbalanced external force. Think of an air-hockey puck on a frictionless table: once tapped, it never slows down on its own.',
      keyTakeaway: 'Mass measures inertia — resistance to changing motion.',
    },
    {
      id: 'c2',
      title: '2. Force, Mass, and Acceleration (F = ma)',
      durationMinutes: 7,
      completed: false,
      script:
        'The second law tells us quantitatively how forces alter motion. Acceleration is directly proportional to net force and inversely proportional to mass: a = F / m. Pushing a shopping cart requires twice the force when loaded with double the groceries.',
      keyTakeaway: 'Net force accelerates objects. More mass requires proportionally more force.',
    },
    {
      id: 'c3',
      title: '3. Action & Reaction Pairs (Third Law)',
      durationMinutes: 7,
      completed: false,
      script:
        'Whenever one body exerts a force on a second body, the second exerts an equal and opposite force on the first. When a rocket engine expels hot exhaust downward, the reaction thrust propels the rocket upward into orbit.',
      keyTakeaway: 'Forces always occur in matched interaction pairs acting on different objects.',
    },
  ],
};

export const LearningPage: React.FC = () => {
  const { addToast } = useToast();
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const concept = SAMPLE_LESSON.concepts[currentConceptIndex];
  const progressPercent = Math.round(((currentConceptIndex + 1) / SAMPLE_LESSON.concepts.length) * 100);

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(concept.script);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  const handleNextConcept = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    if (currentConceptIndex < SAMPLE_LESSON.concepts.length - 1) {
      setCurrentConceptIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      addToast({
        type: 'success',
        title: 'Lesson Completed!',
        message: 'You have finished all interactive modules for this lesson.',
      });
    }
  };

  const handlePreviousConcept = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">{SAMPLE_LESSON.subject}</Badge>
            <Badge variant="neutral">{SAMPLE_LESSON.level}</Badge>
            <span className="text-xs text-slate-400 font-medium">~{SAMPLE_LESSON.durationMinutes} mins</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5">
            {SAMPLE_LESSON.topic}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 hidden sm:block">
            <ProgressBar value={progressPercent} size="sm" showLabel label="Progress" />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsQuestionModalOpen(true)}
            leftIcon={<HelpCircle className="w-4 h-4 text-amber-400" />}
          >
            Checkpoint
          </Button>
          <Link to="/create-lesson">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              New Lesson
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Concept List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Lesson Modules
          </h2>
          <div className="space-y-2">
            {SAMPLE_LESSON.concepts.map((item, idx) => {
              const isActive = idx === currentConceptIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setIsPlaying(false);
                    setCurrentConceptIndex(idx);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      Module {idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.durationMinutes} min
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-semibold mt-1 ${
                      isActive ? 'text-white' : 'text-slate-200'
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Lightbulb className="w-4 h-4" />
              <span>Pedagogy Architecture</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every lesson executes the 8-stage sequence: Understand &rarr; Plan &rarr; Explain &rarr; Demonstrate &rarr; Question &rarr; Evaluate &rarr; Adapt.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Classroom Board */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="indigo" dot>Active Concept</Badge>
                  <CardTitle className="mt-2 text-lg sm:text-xl font-bold">{concept.title}</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant={isPlaying ? 'secondary' : 'primary'}
                  onClick={handleTogglePlay}
                  leftIcon={
                    isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />
                  }
                >
                  {isPlaying ? 'Pause Voice' : 'Listen Teacher'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Teacher Explanation Canvas */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <BrainCircuit className="w-4 h-4" />
                  Teacher Script
                </div>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {concept.script}
                </p>
              </div>

              {/* Key Concept Takeaway */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Core Intuition Takeaway
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                    {concept.keyTakeaway}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousConcept}
                disabled={currentConceptIndex === 0}
              >
                Previous
              </Button>

              <div className="text-xs text-slate-400">
                Module {currentConceptIndex + 1} of {SAMPLE_LESSON.concepts.length}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleNextConcept}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentConceptIndex === SAMPLE_LESSON.concepts.length - 1 ? 'Finish Lesson' : 'Next Concept'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Checkpoint Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title="Knowledge Checkpoint"
        description="Verify your intuition before advancing to the next pedagogical stage."
        footer={
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              disabled={selectedOption === null}
              onClick={() => {
                setIsAnswerSubmitted(true);
                addToast({
                  type: 'success',
                  title: 'Answer Evaluated',
                  message: 'Correct! The net force determines acceleration in accordance with F = ma.',
                });
              }}
            >
              Submit Answer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">
            If you double the net force applied to an object while keeping its mass constant, what happens to its acceleration?
          </p>

          <div className="space-y-2">
            {[
              'The acceleration is halved.',
              'The acceleration remains completely unchanged.',
              'The acceleration doubles.',
              'The acceleration increases fourfold.',
            ].map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <div
                  key={opt}
                  onClick={() => setSelectedOption(idx)}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {opt}
                </div>
              );
            })}
          </div>

          {isAnswerSubmitted && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              &check; Correct! Because a = F / m, doubling F doubles a when m is constant.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
