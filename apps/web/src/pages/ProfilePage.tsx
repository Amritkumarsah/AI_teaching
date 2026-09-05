import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import {
  User,
  Mail,
  GraduationCap,
  Clock,
  Globe,
  Award,
  BookOpen,
  CheckCircle2,
  Save,
  Flame,
  Target
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, setProfile, setAuth, token } = useAuthStore();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || 'Student');
  const [email, setEmail] = useState(user?.email || 'student@aiteacher.io');
  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || 'intermediate');
  const [learningGoal, setLearningGoal] = useState(profile?.learningGoal || 'concept_mastery');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'en');
  const [teachingStyle, setTeachingStyle] = useState(profile?.teachingStyle || 'intuitive');
  const [studyTime, setStudyTime] = useState(profile?.availableStudyTimeMinutes || 25);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      if (user) {
        setAuth(
          {
            ...user,
            name,
            email,
          },
          token || 'demo-token'
        );
      }

      if (profile) {
        setProfile({
          ...profile,
          educationLevel: educationLevel as any,
          learningGoal: learningGoal as any,
          preferredLanguage: preferredLanguage as any,
          teachingStyle: teachingStyle as any,
          availableStudyTimeMinutes: Number(studyTime),
          updatedAt: new Date(),
        });
      }

      setIsSaving(false);
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal learning preferences have been saved successfully.',
      });
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 p-1 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-3xl font-extrabold text-indigo-400">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{name}</h1>
              <Badge variant="success" dot>Active Scholar</Badge>
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {email}
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-indigo-300 border border-slate-700/60 font-medium">
                {educationLevel.charAt(0).toUpperCase() + educationLevel.slice(1)} Level
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-sky-300 border border-slate-700/60 font-medium">
                Style: {teachingStyle.charAt(0).toUpperCase() + teachingStyle.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</p>
              <h3 className="text-2xl font-bold text-white">4 Days</h3>
              <p className="text-xs text-emerald-400 mt-0.5">Top 15% consistency</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lessons Finished</p>
              <h3 className="text-2xl font-bold text-white">12 Mastered</h3>
              <p className="text-xs text-indigo-400 mt-0.5">Across 3 core subjects</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retention Rate</p>
              <h3 className="text-2xl font-bold text-white">92.4%</h3>
              <p className="text-xs text-emerald-400 mt-0.5">Adaptive spaced checks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Configuration Form */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Learning Profile</CardTitle>
            <CardDescription>
              Configure how the AI Teacher tailors analogies, pacing, and lesson breakdowns to your needs.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Current Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value as any)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="beginner">Beginner (Foundations & Intuition)</option>
                  <option value="intermediate">Intermediate (High School / Early Undergrad)</option>
                  <option value="advanced">Advanced (University / Professional)</option>
                  <option value="expert">Expert (Research & Deep Rigor)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Primary Learning Goal
                </label>
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value as any)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="concept_mastery">Deep Concept Mastery</option>
                  <option value="exam_prep">Exam & Test Preparation</option>
                  <option value="interview_prep">Technical Interview Readiness</option>
                  <option value="quick_overview">Rapid Executive Summary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Teaching Style Preference
                </label>
                <select
                  value={teachingStyle}
                  onChange={(e) => setTeachingStyle(e.target.value as any)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="intuitive">Intuitive & Analogy-Heavy</option>
                  <option value="socratic">Socratic & Inquiry-Driven</option>
                  <option value="rigorous">Rigorous & Mathematical</option>
                  <option value="hands_on">Hands-On & Code-First</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as any)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>

              <Input
                label="Target Session Length (Minutes)"
                type="number"
                min={5}
                max={120}
                value={studyTime}
                onChange={(e) => setStudyTime(Number(e.target.value))}
                leftIcon={<Clock className="w-4 h-4" />}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
