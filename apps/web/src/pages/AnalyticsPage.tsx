import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Award, Clock, Flame, BookOpen, Brain, Sparkles } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const radarData = [
    { subject: 'Newtonian Mechanics', score: 92, fullMark: 100 },
    { subject: 'Calculus & Derivations', score: 78, fullMark: 100 },
    { subject: 'Electromagnetism', score: 68, fullMark: 100 },
    { subject: 'Algorithms & Code Trace', score: 88, fullMark: 100 },
    { subject: 'Thermodynamics', score: 62, fullMark: 100 },
  ];

  const weeklyStudyHours = [
    { day: 'Mon', minutes: 35 },
    { day: 'Tue', minutes: 45 },
    { day: 'Wed', minutes: 20 },
    { day: 'Thu', minutes: 60 },
    { day: 'Fri', minutes: 40 },
    { day: 'Sat', minutes: 55 },
    { day: 'Sun', minutes: 30 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Learning Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time cognitive diagnostics tracking topic mastery, study time, and misconception resolution over time.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Learning Time</div>
          <div className="text-2xl font-bold text-white mt-1">285 Mins</div>
          <div className="text-[11px] text-emerald-400 mt-1">↑ +24% this week</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Lessons Mastered</div>
          <div className="text-2xl font-bold text-white mt-1">12 Lessons</div>
          <div className="text-[11px] text-emerald-400 mt-1">3 Courses active</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Misconceptions Solved</div>
          <div className="text-2xl font-bold text-white mt-1">9 Traps</div>
          <div className="text-[11px] text-indigo-400 mt-1">Adaptive remediation applied</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Current Streak</div>
          <div className="text-2xl font-bold text-white mt-1">5 Days</div>
          <div className="text-[11px] text-amber-400 mt-1">Top 5% student consistency</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            Domain Concept Mastery Radar
          </h2>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                <Radar name="Mastery" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Minutes Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Daily Study Minutes (Past 7 Days)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStudyHours}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="minutes" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
