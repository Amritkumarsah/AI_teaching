import React, { useEffect, useRef } from 'react';
import { IVisualContent } from '@ai-teacher/types';
import katex from 'katex';
import { ArrowRight, Code, Activity, GitCommit, Layers } from 'lucide-react';

interface ChalkboardProps {
  visual?: IVisualContent;
  conceptTitle?: string;
}

export const ChalkboardVisual: React.FC<ChalkboardProps> = ({ visual, conceptTitle }) => {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visual?.type === 'EQUATION' && visual.data?.steps && mathRef.current) {
      mathRef.current.innerHTML = '';
      visual.data.steps.forEach((st: { step: string; latex: string }) => {
        const stepContainer = document.createElement('div');
        stepContainer.className = 'my-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50';

        const label = document.createElement('div');
        label.className = 'text-xs text-indigo-400 font-semibold mb-1';
        label.innerText = st.step;
        stepContainer.appendChild(label);

        const formula = document.createElement('div');
        formula.className = 'text-base sm:text-lg text-slate-100 overflow-x-auto py-1';
        try {
          katex.render(st.latex, formula, { throwOnError: false, displayMode: true });
        } catch {
          formula.innerText = st.latex;
        }
        stepContainer.appendChild(formula);
        mathRef.current?.appendChild(stepContainer);
      });
    }
  }, [visual]);

  if (!visual) {
    return (
      <div className="h-full min-h-[320px] chalkboard-texture rounded-2xl border border-slate-800 p-6 flex items-center justify-center text-slate-500">
        Waiting for next visual demonstration...
      </div>
    );
  }

  const type = String(visual.type || '').toLowerCase();

  return (
    <div className="h-full min-h-[340px] chalkboard-texture rounded-2xl border border-slate-800 p-5 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {visual.title || conceptTitle || 'Interactive Visual'}
          </h3>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {visual.type}
        </span>
      </div>

      {/* Render specialized visual domain */}
      <div className="flex-1 flex flex-col justify-center">
        {/* 1. Physics: Simulation Force Vectors */}
        {(type === 'simulation' || type === 'simulation_diagram') && (
          <div className="flex flex-col items-center justify-center p-4">
            <svg viewBox="0 0 320 180" className="w-full max-w-sm h-48 drop-shadow">
              {/* Horizontal Floor Surface */}
              <line x1="20" y1="140" x2="300" y2="140" stroke="#64748b" strokeWidth="3" strokeDasharray="4 4" />

              {/* Block Body */}
              <rect x="110" y="80" width="100" height="60" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
              <text x="160" y="115" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="bold">
                {visual.data?.object || 'Mass (m)'}
              </text>

              {/* Up Vector: Normal Force */}
              <line x1="160" y1="80" x2="160" y2="25" stroke="#10b981" strokeWidth="3" />
              <text x="170" y="45" fill="#10b981" fontSize="11" fontWeight="bold">F_N = mg</text>

              {/* Down Vector: Gravity */}
              <line x1="160" y1="140" x2="160" y2="175" stroke="#ef4444" strokeWidth="3" />
              <text x="170" y="170" fill="#ef4444" fontSize="11" fontWeight="bold">F_g = mg</text>

              {/* Right Vector: Applied Force / Velocity */}
              <line x1="210" y1="110" x2="275" y2="110" stroke="#3b82f6" strokeWidth="3" />
              <text x="240" y="100" fill="#3b82f6" fontSize="11" fontWeight="bold">v = const</text>

              {/* Net Force status */}
              <text x="50" y="100" fill="#10b981" fontSize="11" fontWeight="bold">F_net = 0</text>
            </svg>
            <div className="mt-2 text-center text-xs text-slate-400">
              State: <span className="font-mono text-sky-300">{visual.data?.velocity ? `Velocity: ${visual.data.velocity}` : 'Equilibrium (F_net = 0)'}</span>
            </div>
          </div>
        )}

        {/* 2. Mathematics: KaTeX Equation */}
        {type === 'equation' && (
          <div className="w-full text-center py-6">
            <div ref={mathRef} className="w-full inline-block" />
            {visual.data?.latex && (
              <div className="font-mono text-lg sm:text-2xl text-amber-300 py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800 tracking-wide">
                {visual.data.latex}
              </div>
            )}
          </div>
        )}

        {/* 3. Computer Science: Code Trace */}
        {(type === 'code' || type === 'code_trace') && (
          <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-slate-400">
              <Code className="w-4 h-4 text-indigo-400" />
              <span>{visual.data?.language || 'typescript'}</span>
            </div>
            {(visual.data?.codeLines || (visual.data?.code ? visual.data.code.split('\n') : ['// Initialized execution pointer', 'const state = evaluate();'])).map((line: string, i: number) => (
              <div
                key={i}
                className={`py-0.5 px-2 rounded ${
                  i === 1 ? 'bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-400 font-semibold' : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 select-none mr-3 w-4 inline-block text-right">{i + 1}</span>
                {line}
              </div>
            ))}
          </div>
        )}

        {/* 4. Process Flowchart */}
        {(type === 'flowchart' || type === 'flowchart_process') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2">
            {(visual.data?.nodes || visual.data?.steps || [
              { stage: 'Step 1', label: 'Initial Input' },
              { stage: 'Step 2', label: 'Mechanism Transformation' },
              { stage: 'Step 3', label: 'Conserved Output' },
            ]).map((node: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">{node.stage || `Stage ${idx + 1}`}</span>
                <span className="text-xs sm:text-sm font-medium text-slate-200 mt-1">{node.label || node}</span>
              </div>
            ))}
          </div>
        )}

        {/* 5. History / Timeline */}
        {type === 'timeline' && (
          <div className="space-y-3 p-2">
            {(visual.data?.milestones || visual.data?.events || [
              { era: 'Epoch 1', event: 'Formulation of Inertial Principle' },
              { era: 'Epoch 2', event: 'Universal Gravitation Synthesis' },
            ]).map((m: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-semibold text-sky-400">{m.era || m.year}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{m.event}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Quantitative Graph / Trend */}
        {type === 'graph' && (
          <div className="p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm h-36 border-l-2 border-b-2 border-slate-600 relative flex items-end p-2">
              <div className="w-full h-24 bg-gradient-to-tr from-sky-500/20 to-indigo-500/40 rounded-t-lg border-t-2 border-sky-400 flex items-center justify-center text-xs text-sky-200 font-semibold">
                {visual.data?.trend || 'Linear Proportionality (y = k · x)'}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              X: {visual.data?.xAxis || 'Applied Influence'} | Y: {visual.data?.yAxis || 'Dynamic Response'}
            </div>
          </div>
        )}

        {/* 7. Default Diagram / Concept Map / Image */}
        {type !== 'simulation' && type !== 'simulation_diagram' && type !== 'equation' && type !== 'code' && type !== 'code_trace' && type !== 'flowchart' && type !== 'flowchart_process' && type !== 'timeline' && type !== 'graph' && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">{visual.title || conceptTitle}</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{visual.description || 'Interactive Chalkboard Conceptual Representation'}</p>
          </div>
        )}
      </div>

      {/* Visual description note */}
      {visual.description && (
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>{visual.description}</span>
        </div>
      )}
    </div>
  );
};
