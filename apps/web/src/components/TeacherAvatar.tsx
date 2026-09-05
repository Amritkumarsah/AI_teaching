import React, { useEffect, useState } from 'react';
import { Volume2, Sparkles, UserCheck } from 'lucide-react';

interface TeacherAvatarProps {
  isSpeaking: boolean;
  language: string;
  currentViseme?: string;
  teacherName?: string;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({
  isSpeaking,
  language,
  currentViseme = 'rest',
  teacherName = 'Prof. Maya'
}) => {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1
  const [headTilt, setHeadTilt] = useState(0);

  // Natural periodic eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle natural breathing / head movement
  useEffect(() => {
    const headInterval = setInterval(() => {
      setHeadTilt((prev) => (prev === 1 ? -1 : 1));
    }, 2800);
    return () => clearInterval(headInterval);
  }, []);

  // Lip-sync animation driven by speech activity
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const interval = setInterval(() => {
      if (currentViseme === 'open_a') setMouthOpen(0.85);
      else if (currentViseme === 'round_o') setMouthOpen(0.9);
      else setMouthOpen(0.25 + Math.random() * 0.65);
    }, 110);

    return () => clearInterval(interval);
  }, [isSpeaking, currentViseme]);

  return (
    <div className="relative w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Teacher Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md">
        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-200">{teacherName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md">
        <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-sky-400 animate-bounce' : 'text-slate-500'}`} />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{language}</span>
      </div>

      {/* Animated SVG Avatar */}
      <div
        className="relative transition-transform duration-700 ease-out"
        style={{ transform: `rotate(${headTilt * 1.5}deg) translateY(${headTilt * 2}px)` }}
      >
        <svg viewBox="0 0 240 240" className="w-52 h-52 sm:w-60 sm:h-60 drop-shadow-xl">
          <defs>
            <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd8b8" />
              <stop offset="100%" stopColor="#f5be94" />
            </linearGradient>
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="suitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
          </defs>

          {/* Torso / Teacher Suit */}
          <path d="M 40 230 C 40 185 80 170 120 170 C 160 170 200 185 200 230 Z" fill="url(#suitGradient)" />
          {/* White Shirt Collar */}
          <polygon points="120,170 100,195 140,195" fill="#f8fafc" />
          <polygon points="120,195 110,230 130,230" fill="#0284c7" />

          {/* Neck */}
          <rect x="105" y="145" width="30" height="30" fill="#f5be94" rx="4" />

          {/* Head Base */}
          <ellipse cx="120" cy="115" rx="55" ry="60" fill="url(#skinGradient)" />

          {/* Hair back */}
          <path d="M 65 110 C 60 70 85 45 120 45 C 155 45 180 70 175 110 C 180 145 170 160 170 160 C 160 100 150 70 120 70 C 90 70 80 100 70 160 C 70 160 60 145 65 110 Z" fill="url(#hairGradient)" />

          {/* Eyebrows */}
          <path d="M 85 92 Q 98 88 110 93" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 130 93 Q 142 88 155 92" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Eyes with blinking */}
          {blink ? (
            <>
              <line x1="88" y1="105" x2="108" y2="105" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="132" y1="105" x2="152" y2="105" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="98" cy="105" rx="7" ry="5.5" fill="#ffffff" />
              <circle cx="98" cy="105" r="3.5" fill="#0f172a" />
              <circle cx="99.5" cy="103.5" r="1" fill="#ffffff" />

              <ellipse cx="142" cy="105" rx="7" ry="5.5" fill="#ffffff" />
              <circle cx="142" cy="105" r="3.5" fill="#0f172a" />
              <circle cx="143.5" cy="103.5" r="1" fill="#ffffff" />
            </>
          )}

          {/* Nose */}
          <path d="M 118 112 Q 120 124 115 127 L 125 127" stroke="#e09f74" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Dynamic Mouth / Viseme */}
          {mouthOpen > 0.05 ? (
            <path
              d={`M 102 142 Q 120 ${142 + mouthOpen * 22} 138 142 Q 120 ${142 - mouthOpen * 4} 102 142 Z`}
              fill="#991b1b"
              stroke="#7f1d1d"
              strokeWidth="1.5"
            />
          ) : (
            <path d="M 104 142 Q 120 146 136 142" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* Modern Glasses */}
          <rect x="82" y="96" width="32" height="20" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <rect x="126" y="96" width="32" height="20" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <line x1="114" y1="104" x2="126" y2="104" stroke="#6366f1" strokeWidth="2" />
        </svg>
      </div>

      {/* Speaking Wave Bar Indicator */}
      <div className="mt-4 flex items-center gap-1.5 h-6">
        {isSpeaking ? (
          <>
            <span className="w-1 bg-sky-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
            <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-5" />
            <span className="w-1 bg-sky-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-6" />
            <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
            <span className="w-1 bg-sky-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2" />
            <span className="text-xs text-sky-300 font-medium ml-2">Teaching...</span>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Listening & Ready</span>
          </div>
        )}
      </div>
    </div>
  );
};
