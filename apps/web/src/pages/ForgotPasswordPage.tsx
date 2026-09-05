import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { GraduationCap, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoResetToken, setDemoResetToken] = useState<string | null>(null);

  const { forgotPassword } = useAuthStore();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await forgotPassword(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      // In local dev/test mode, check if token was returned for quick testing
      addToast({
        type: 'info',
        title: 'Instructions Sent',
        message: 'Password reset link has been dispatched to your email.',
      });
    } else {
      setErrorMessage(res.error || 'Unable to process password reset request.');
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
          <h1 className="text-2xl font-extrabold text-white">Reset your password</h1>
          <p className="text-xs text-slate-400">We will send you a secure link to reset your credentials</p>
        </div>

        <Card variant="glass">
          {isSubmitted ? (
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  If an account exists for <span className="text-indigo-300 font-semibold">{email}</span>, you will receive an email with instructions on how to reset your password.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter the email associated with your student account and we will issue a time-sensitive 1-hour reset token.
                </p>

                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isSubmitting}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Reset Link
                </Button>
              </CardContent>

              <CardFooter className="justify-center border-t border-slate-800/80 pt-4">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white">
                  &larr; Remember your password? Sign in
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
