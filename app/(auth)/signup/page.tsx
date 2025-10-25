'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return 'Password must be at least 12 characters';
    }
    return null;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpAction(email, password);

      if (result.error) {
        if (result.error.message?.includes('already')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(result.error.message || 'An error occurred during signup');
        }
      } else if (result.user) {
        // Successful signup - redirect to onboarding
        router.push('/onboarding/connect-bank');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Create your account
          </h2>
          <p className="text-slate-600">
            Start managing your budget in under 5 minutes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    data-testid="email-input"
                    label="Email address"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    data-testid="password-input"
                    label="Password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    data-testid="confirm-password-input"
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              data-testid="signup-button"
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
