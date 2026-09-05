import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  Settings,
  Bell,
  Moon,
  Volume2,
  Database,
  Cpu,
  AlertTriangle,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { addToast } = useToast();

  const [soundEffects, setSoundEffects] = useState(true);
  const [captions, setCaptions] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'unknown'>('healthy');

  const handleTestBackend = async () => {
    setIsCheckingBackend(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.success) {
        setBackendStatus('healthy');
        addToast({
          type: 'success',
          title: 'Backend Online',
          message: data.message || 'Express API is running smoothly.',
        });
      } else {
        throw new Error('Unhealthy status');
      }
    } catch {
      setBackendStatus('unknown');
      addToast({
        type: 'error',
        title: 'Backend Verification Failed',
        message: 'Could not reach GET /api/health.',
      });
    } finally {
      setIsCheckingBackend(false);
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    setIsResetModalOpen(false);
    addToast({
      type: 'info',
      title: 'Local State Reset',
      message: 'Client session and local caches have been reset to factory defaults.',
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Control platform behavior, audio preferences, system diagnostic checks, and storage.
        </p>
      </div>

      {/* Backend & Environment Diagnostics */}
      <Card className="border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <CardTitle>System & API Health</CardTitle>
              </div>
              <CardDescription>
                Real-time status of the Express Node.js backend and MongoDB cluster.
              </CardDescription>
            </div>
            <Badge variant={backendStatus === 'healthy' ? 'success' : 'danger'} dot>
              {backendStatus === 'healthy' ? 'API Active' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block font-medium">API Gateway</span>
              <span className="text-slate-200 font-mono font-semibold">http://127.0.0.1:5000</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block font-medium">Database Node</span>
              <span className="text-slate-200 font-mono font-semibold">MongoDB 127.0.0.1:27017</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block font-medium">Foundation Layer</span>
              <span className="text-indigo-400 font-mono font-semibold">Phase 1 Standard</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t border-slate-800/80 pt-4">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Key Mode (No paid vendor keys needed)
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestBackend}
            isLoading={isCheckingBackend}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Ping Health Endpoint
          </Button>
        </CardFooter>
      </Card>

      {/* Interactive & Classroom Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-sky-400" />
            <CardTitle>Classroom & Audio Experience</CardTitle>
          </div>
          <CardDescription>
            Personalize how interactive lessons, sound cues, and pacing behave during study sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-slate-800/80">
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div>
              <p className="text-sm font-semibold text-white">Audio Feedback & Sound Effects</p>
              <p className="text-xs text-slate-400">Play subtle audio cues upon correct quiz answers and milestone completions.</p>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-white">Live Closed Captions</p>
              <p className="text-xs text-slate-400">Render real-time subtitles synchronously with teacher explanations.</p>
            </div>
            <input
              type="checkbox"
              checked={captions}
              onChange={(e) => setCaptions(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-white">Auto-Advance Topics</p>
              <p className="text-xs text-slate-400">Automatically progress to next concept card when comprehension check passes.</p>
            </div>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400" />
            <CardTitle>Notifications & Study Reminders</CardTitle>
          </div>
          <CardDescription>
            Stay consistent with daily learning streak alerts and topic retention checks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Daily Streak Reminders</p>
              <p className="text-xs text-slate-400">Receive an encouraging reminder if your goal hasn&apos;t been met by 6:00 PM.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-500/20 bg-rose-950/10">
        <CardHeader>
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle className="text-rose-300">Data & Cache Management</CardTitle>
          </div>
          <CardDescription>
            Clear local workspace caches and reset client-side progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-slate-400 max-w-lg">
            This will purge locally cached lesson previews, temporary session states, and test tokens. Your MongoDB database remains safe.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Clear Local Cache
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Cache Reset"
        description="Are you sure you want to clear your local web application storage?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetData}>
              Yes, Reset Local Data
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This operation will clear all in-browser storage and reset UI session state. You will not lose files stored in the backend MongoDB database.
        </p>
      </Modal>
    </div>
  );
};
