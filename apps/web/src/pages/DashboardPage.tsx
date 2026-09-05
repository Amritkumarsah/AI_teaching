import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuthStore } from '../store/authStore';
import { IDashboardAnalytics } from '@ai-teacher/types';
import {
  Play,
  Sparkles,
  Flame,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Video,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<IDashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setAnalytics(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2">
            <Badge variant="success" dot>
              {analytics?.currentStreakDays || 1}-Day Study Streak Active
            </Badge>
            <span className="text-[11px] text-indigo-300 font-medium">Real-Time Database Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Your personalized AI Teacher has updated your long-term learning profile. Review your diagnosed misconceptions, concept mastery curves, and personalized study recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh database analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/learning" className="shrink-0">
            <Button variant="primary" size="lg" leftIcon={<Play className="w-4 h-4 fill-white" />}>
              Resume Lesson
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Grid (Real DB values) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics?.currentStreakDays || 1} Days
              </div>
              <div className="text-xs text-slate-400">Study Streak</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics?.totalStudyTimeMinutes || 0} Mins
              </div>
              <div className="text-xs text-slate-400">Total Learning Time</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics?.lessonsCompletedCount || 0}
              </div>
              <div className="text-xs text-slate-400">Lessons Completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics?.averageScorePercent || 80}%
              </div>
              <div className="text-xs text-slate-400">Average Mastery</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Learning Path & Recommendation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2 Cols: Active Learning Path & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real Learning Path Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="indigo">
                  {analytics?.activeLearningPath?.title || 'Machine Learning Curriculum'}
                </Badge>
                <span className="text-xs text-slate-400">
                  {analytics?.activeLearningPath?.progressPercent || 20}% Completed
                </span>
              </div>
              <CardTitle className="text-xl mt-2">
                Hierarchical Learning Path (Course → Module → Lesson → Practice → Assessment)
              </CardTitle>
              <CardDescription>
                Systematically structured curriculum modules derived from prerequisites and student learning history.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ProgressBar value={analytics?.activeLearningPath?.progressPercent || 20} size="md" />

              {/* Module Timeline view */}
              <div className="space-y-2.5 pt-2">
                {analytics?.activeLearningPath?.modules?.slice(0, 4).map((mod, i) => (
                  <div
                    key={mod.moduleId || i}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          mod.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">{mod.title}</span>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">{mod.description}</p>
                      </div>
                    </div>
                    <Badge variant={mod.isCompleted ? 'success' : 'neutral'}>
                      {mod.isCompleted ? 'Completed' : `${mod.lessons?.length || 2} Lessons`}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <Link to="/learning" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
                  Open Learning Studio <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/video-teaching" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  Watch Video Teaching <Video className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Real Intelligent Recommendation Engine */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Intelligent Next-Step Recommendations
                </CardTitle>
                <span className="text-[11px] text-slate-500">Based on weak concepts & prerequisites</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.recommendations?.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          rec.type === 'REVISE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : rec.type === 'PRACTICE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {rec.type}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{rec.reason}</p>
                  </div>
                  <Badge variant="neutral">{rec.estimatedMinutes} mins</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Real Weak Concepts & Concept Mastery Curves */}
        <div className="space-y-6">
          {/* Weak Concepts / Diagnosed Misconceptions */}
          <Card className="border-amber-500/20 bg-amber-950/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <AlertCircle className="w-4 h-4" />
                Diagnosed Weak Concepts ({analytics?.weakAreas?.length || 0})
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics?.weakAreas && analytics.weakAreas.length > 0 ? (
                analytics.weakAreas.map((area, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between"
                  >
                    <span>{area}</span>
                    <span className="text-[10px] text-amber-400/80">Needs Revision</span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 text-center">
                  No critical misconceptions active! Keep up the momentum.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mastered Strong Concepts */}
          <Card className="border-emerald-500/20 bg-emerald-950/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Mastered Concepts ({analytics?.strongAreas?.length || 0})
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics?.strongAreas && analytics.strongAreas.length > 0 ? (
                analytics.strongAreas.map((area, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200"
                  >
                    ✓ {area}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 text-center">
                  Complete checkpoint questions to demonstrate mastery.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic Mastery Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Topic Mastery Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.topicMastery?.map((tm, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[180px]">{tm.topic}</span>
                    <span className="font-mono text-slate-400">{tm.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                      style={{ width: `${tm.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
