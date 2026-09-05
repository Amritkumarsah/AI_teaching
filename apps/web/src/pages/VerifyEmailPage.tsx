import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { GraduationCap, CheckCircle2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [resendEmail, setResendEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { verifyEmail } = useAuthStore();
  const { addToast } = useToast();

  const handleVerify = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) {
      setErrorMessage('Please enter or provide a verification token.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verifyEmail(tokenToVerify.trim());
    setIsVerifying(false);

    if (res.success) {
      setIsSuccess(true);
      addToast({
        type: 'success',
        title: 'Email Verified',
        message: 'Your student account is now fully verified!',
      });
    } else {
      setErrorMessage(res.error || 'Verification token is invalid or expired.');
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setIsResending(false);

      if (data.success) {
        addToast({
          type: 'info',
          title: 'Verification Dispatched',
          message: 'If the account exists and is unverified, a new link was issued.',
        });
        if (data.data?.verificationToken) {
          setToken(data.data.verificationToken);
        }
      }
    } catch {
      setIsResending(false);
      setErrorMessage('Network error attempting to resend verification.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AI Teacher</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Email Verification</h1>
          <p className="text-xs text-slate-400">Confirm your email to unlock all study capabilities</p>
        </div>

        <Card variant="glass">
          <CardContent className="p-6 space-y-5">
            {isSuccess ? (
              <div className="text-center space-y-4 py-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Verification Confirmed!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your email address has been verified. You now have full access to lessons, diagnostics, and AI tutoring.
                  </p>
                </div>
                <Link to="/dashboard">
                  <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Enter Student Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    label="Verification Token"
                    placeholder="Enter 64-character verification code"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => handleVerify(token)}
                    isLoading={isVerifying}
                  >
                    Confirm Verification Token
                  </Button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Need a new link?
                  </span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                <form onSubmit={handleResend} className="space-y-3">
                  <Input
                    label="Account Email"
                    type="email"
                    placeholder="student@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    isLoading={isResending}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Resend Verification Link
                  </Button>
                </form>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-800/80 pt-4">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white">
              &larr; Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
