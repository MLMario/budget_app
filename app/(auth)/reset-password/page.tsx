'use client';

import { useState } from 'react';
import { resetPasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordAction(email);

      if (result.error) {
        setError(result.error.message || 'An error occurred');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a password reset link
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Password reset email sent! Please check your inbox and follow the instructions.
            </p>
            <div className="mt-4">
              <a
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Return to sign in
              </a>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending email...' : 'Send reset link'}
            </Button>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
