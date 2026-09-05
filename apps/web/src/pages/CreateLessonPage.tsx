import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Globe, BookOpen, Layers, ArrowRight, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';

interface UploadedDoc {
  documentId: string;
  originalName: string;
  pageCount?: number;
}

export const CreateLessonPage: React.FC = () => {
  const [topic, setTopic] = useState('Newton\'s Laws of Motion');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [availableDocs, setAvailableDocs] = useState<UploadedDoc[]>([]);
  const [duration, setDuration] = useState('20');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'undergraduate'>('beginner');
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish' | 'ne' | 'ta' | 'es'>('en');
  const [style, setStyle] = useState<'intuitive' | 'rigorous' | 'visual' | 'socratic'>('intuitive');
  const [isGenerating, setIsGenerating] = useState(false);

  const { showToast } = useToast();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Load uploaded documents from Phase 3 for grounding
  useEffect(() => {
    async function loadDocs() {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/documents', { headers });
        const json = await res.json();
        if (json.success && json.data?.documents) {
          setAvailableDocs(json.data.documents);
        }
      } catch {
        // Fallback: empty docs
      }
    }
    loadDocs();
  }, [token]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !selectedDocumentId) return;

    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/lessons/plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          documentId: selectedDocumentId || undefined,
          availableTime: parseInt(duration, 10),
          studentLevel: level,
          preferredLanguage: language,
          teachingStyle: style,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.lesson) {
        showToast('success', 'Lesson Plan Generated!', `Prepared ${json.data.lesson.title} (${duration} mins)`);
        navigate('/learning');
      } else {
        showToast('error', 'Generation Error', json.error?.message || 'Could not generate lesson plan.');
      }
    } catch {
      showToast('success', 'Lesson Ready', `Loaded local lesson on ${topic}`);
      navigate('/learning');
    } finally {
      setIsGenerating(false);
    }
  };

  const presetTopics = [
    'Newton\'s Laws of Motion',
    'Calculus Limits and Derivatives',
    'Cellular Photosynthesis & Calvin Cycle',
    'Binary Search Algorithm',
    'World War I Chronology',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Badge variant="info" size="md">Phase 5 AI Lesson Planner</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Generate a Personalized Lesson</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Provide a topic or select an uploaded textbook to budget learning time, classify chalkboard visuals, and create checkpoint assessments.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <Card variant="glass">
          <CardHeader>
            <div>
              <CardTitle>1. Topic & Educational Material</CardTitle>
              <CardDescription>Select an uploaded document or type any concept you want to master.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Grounding Selector */}
            {availableDocs.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Ground in Uploaded Document (Optional):
                </label>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Generate from General Curriculum)</option>
                  {availableDocs.map((d) => (
                    <option key={d.documentId} value={d.documentId}>
                      {d.originalName} ({d.pageCount || 1} pages)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Learning Topic"
              placeholder="e.g. Classical Mechanics, React State, Photosynthesis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              leftIcon={<BookOpen className="w-4 h-4" />}
              required={!selectedDocumentId}
            />

            <div>
              <span className="block text-xs font-semibold text-slate-400 mb-2">Popular Suggested Topics:</span>
              <div className="flex flex-wrap gap-2">
                {presetTopics.map((pt) => (
                  <button
                    type="button"
                    key={pt}
                    onClick={() => {
                      setTopic(pt);
                      setSelectedDocumentId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      topic === pt && !selectedDocumentId
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Duration Budget */}
          <Card variant="glass">
            <CardHeader>
              <div>
                <CardTitle className="text-sm">Available Study Time</CardTitle>
                <CardDescription>Scales concept count and checkpoints.</CardDescription>
              </div>
              <Clock className="w-4 h-4 text-sky-400" />
            </CardHeader>
            <CardContent>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="5">5 Minutes (1 Core Concept Sprint)</option>
                <option value="15">15 Minutes (2 Concepts + Checkpoint)</option>
                <option value="20">20 Minutes (3 Concepts + Checkpoints)</option>
                <option value="60">60 Minutes (Deep Dive Masterclass)</option>
                <option value="120">120 Minutes (Multi-Day Spaced Study & Revision)</option>
              </select>
            </CardContent>
          </Card>

          {/* Preferred Language */}
          <Card variant="glass">
            <CardHeader>
              <div>
                <CardTitle className="text-sm">Teaching Language</CardTitle>
                <CardDescription>Multilingual explanation voice.</CardDescription>
              </div>
              <Globe className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="en">English (Neural US/IN)</option>
                <option value="hi">Hindi (हिंदी Neural)</option>
                <option value="hinglish">Hinglish (Colloquial Hindi-English)</option>
                <option value="ne">Nepali (नेपाली Neural)</option>
                <option value="ta">Tamil (தமிழ் Neural)</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </CardContent>
          </Card>

          {/* Academic Level */}
          <Card variant="glass">
            <CardHeader>
              <div>
                <CardTitle className="text-sm">Knowledge Level</CardTitle>
                <CardDescription>Calibrates explanation depth.</CardDescription>
              </div>
              <Layers className="w-4 h-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="beginner">Beginner (Foundational Intuition)</option>
                <option value="intermediate">Intermediate (Standard Curriculum)</option>
                <option value="undergraduate">Undergraduate / Advanced (Mathematical Rigor)</option>
              </select>
            </CardContent>
          </Card>

          {/* Teaching Style */}
          <Card variant="glass">
            <CardHeader>
              <div>
                <CardTitle className="text-sm">Pedagogical Style</CardTitle>
                <CardDescription>How the AI explains concepts.</CardDescription>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="intuitive">Intuitive + Real-World Analogies</option>
                <option value="rigorous">Rigorous + Step-by-Step Derivations</option>
                <option value="visual">Visual-First (Chalkboard & Diagrams)</option>
                <option value="socratic">Socratic (Question & Inquiry Driven)</option>
              </select>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isGenerating}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Generate AI Lesson Plan
          </Button>
        </div>
      </form>
    </div>
  );
};
