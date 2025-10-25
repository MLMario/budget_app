'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/plaid/PlaidLink';
import { Button } from '@/components/ui/Button';
import { exchangePublicTokenAction } from '@/app/actions/plaid';
import { getSessionAction } from '@/app/actions/auth';
import { Building2, Shield, Zap, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function ConnectBankPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      const session = await getSessionAction();
      if (session) {
        setUserId(session.id);
      }
    }
    fetchUserId();
  }, []);

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const result = await exchangePublicTokenAction(userId, publicToken);

      if (result.error) {
        setError('Failed to connect bank. Please try again.');
      } else {
        // Success - redirect to review transactions
        router.push('/onboarding/setup-budget');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaidExit = (error: any, metadata: any) => {
    if (error) {
      setError('Bank connection was not completed. Please try again or skip for now.');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/setup-budget');
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Connect Your Bank
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Securely connect your bank account to automatically import and categorize transactions.
            We use Plaid for bank-level security.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 mb-3">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="secondary"
                size="sm"
                className="text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-700 font-medium">Connecting your bank...</p>
                <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
              </div>
            ) : (
              <>
                <PlaidLink
                  userId={userId}
                  onSuccess={handlePlaidSuccess}
                  onExit={handlePlaidExit}
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  Skip for now
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Why connect your bank?
              </h3>
              <p className="text-sm text-blue-700">Get the most out of your budget tracking</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Automatic imports</p>
                <p className="text-xs text-blue-700">Saves hours every month</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">AI categorization</p>
                <p className="text-xs text-blue-700">95% accuracy rate</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Real-time tracking</p>
                <p className="text-xs text-blue-700">Always up to date</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Bank-level security</p>
                <p className="text-xs text-blue-700">Protected by Plaid</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
