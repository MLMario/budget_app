'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/plaid/PlaidLink';
import { Button } from '@/components/ui/Button';
import { exchangePublicTokenAction } from '@/app/actions/plaid';
import { getSessionAction } from '@/app/actions/auth';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Your Bank
        </h1>
        <p className="text-gray-600 mb-6">
          Securely connect your bank account to automatically import and categorize transactions.
          We use Plaid for bank-level security.
        </p>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
            <div className="mt-2">
              <Button
                onClick={() => setError(null)}
                variant="secondary"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isProcessing ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Connecting your bank...</p>
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
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                onClick={handleSkip}
                variant="secondary"
                className="w-full"
              >
                Skip for now
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Why connect your bank?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Automatic transaction imports (saves hours)</li>
            <li>• AI-powered categorization (95% accuracy)</li>
            <li>• Real-time budget tracking</li>
            <li>• Bank-level security with Plaid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
