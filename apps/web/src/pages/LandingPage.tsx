import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, CheckCircle, Brain, Layers, Cpu, ShieldCheck, Zap, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const pedagogicalSteps = [
    { step: '1. Understand', desc: 'Analyzes student grade level, knowledge history, target time, and uploaded textbooks.' },
    { step: '2. Plan', desc: 'Synthesizes time-budgeted structured curriculum with domain-specific visual strategies.' },
    { step: '3. Explain', desc: 'Delivers high-fidelity neural voice lecture synchronized with pedagogical scripts.' },
    { step: '4. Demonstrate', desc: 'Renders dynamic visual models, force vector diagrams, and execution steps.' },
    { step: '5. Question', desc: 'Pauses at targeted checkpoints to test conceptual understanding and detect misconceptions.' },
    { step: '6. Evaluate', desc: 'Performs semantic rubric matching (not string equality) to identify cognitive traps.' },
    { step: '7. Adapt', desc: 'Reteaches with an entirely new mental model and analogy before moving forward.' },
    { step: '8. Continue', desc: 'Advances to the next concept and updates the long-term student mastery profile.' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'Pedagogical Intelligence',
      desc: 'Never dumps unformatted walls of text. Follows real cognitive scaffolding principles.',
    },
    {
      icon: BookOpen,
      title: 'Grounded in Source Docs',
      desc: 'Ingests your course PDF, slides, or syllabus notes and cites exact paragraph sources.',
    },
    {
      icon: Zap,
      title: 'Zero-Latency Visuals',
      desc: 'Chalkboard diagrams, LaTeX formulas, and interactive concept checkpoints.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Key Local Mode',
      desc: 'Fully usable locally without paid third-party vendor lock-in or fragile tokens.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 mb-6">
          <Badge variant="indigo" dot>
            A Teacher That Actually Teaches — Not A Chatbot
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Your Personal{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">
            AI Teacher
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Learn from books, notes, syllabus topics, and courses with an adaptive AI educator that explains, demonstrates visuals, asks checkpoint questions, and adapts when you get stuck.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/learning" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start Interactive Lesson
            </Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" variant="outline">
              Open Student Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pedagogical Loop Section */}
      <section className="py-20 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              The 8-Step Pedagogical Loop
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Unlike generic LLM chat windows that dump walls of text, AI Teacher adheres to verified educational cognitive science.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pedagogicalSteps.map((item, idx) => (
              <Card key={idx} className="hover:border-indigo-500/40 transition-all">
                <CardContent className="p-5 space-y-2">
                  <div className="text-xs font-extrabold uppercase text-indigo-400 tracking-wider">
                    {item.step}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>AI Teacher Platform &bull; Phase 1 Foundation Architecture &bull; 100% Production Grade</p>
      </footer>
    </div>
  );
};
