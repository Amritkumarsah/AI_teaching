import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { GraduationCap, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const { signup, loginWithGoogle } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    const res = await signup(name, email, password);
    setIsSubmitting(false);

    if (res.success) {
      setSignupSuccess(true);
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
      }
      addToast({
        type: 'success',
        title: 'Account Created',
        message: 'Your student account has been registered.',
      });
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    const simulatedGoogleUser = {
      email: email.trim().toLowerCase().endsWith('@gmail.com') ? email.trim().toLowerCase() : `scholar_${Date.now()}@gmail.com`,
      name: name.trim() || 'Google Scholar',
      googleId: `gid_${Date.now()}`,
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
    };

    const res = await loginWithGoogle(simulatedGoogleUser);
    setIsGoogleLoading(false);

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Account Provisioned via Google',
        message: 'Welcome to your AI Teacher classroom!',
      });
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(res.error || 'Google signup failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AI Teacher</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Create your student profile</h1>
          <p className="text-xs text-slate-400">Join students learning with an adaptive AI tutor</p>
        </div>

        {/* Card Form or Success Confirmation */}
        <Card variant="glass">
          {signupSuccess ? (
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Account Created Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  We have registered your account for <span className="text-indigo-300 font-semibold">{email}</span>. Please verify your email to unlock all platform privileges.
                </p>
              </div>

              {verificationToken && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">Instant Verification Link:</span>
                  <Link
                    to={`/verify-email?token=${verificationToken}`}
                    className="text-xs font-mono text-indigo-400 hover:underline break-all block"
                  >
                    /verify-email?token={verificationToken.slice(0, 16)}...
                  </Link>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5">
                {verificationToken ? (
                  <Link to={`/verify-email?token=${verificationToken}`}>
                    <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Verify Email Now
                    </Button>
                  </Link>
                ) : null}
                <Link to="/dashboard">
                  <Button variant="outline" size="md" className="w-full">
                    Enter Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-6">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading || isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-850 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800" />
                  <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Or register with email
                  </span>
                  <div className="flex-grow border-t border-slate-800" />
                </div>

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Maya Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Create Student Account
                </Button>
              </CardContent>

              <CardFooter className="justify-center border-t border-slate-800/80 pt-4">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
