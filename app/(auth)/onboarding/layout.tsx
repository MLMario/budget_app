'use client';

import { usePathname } from 'next/navigation';

interface Step {
  number: number;
  title: string;
  path: string;
}

const steps: Step[] = [
  { number: 1, title: 'Connect Bank', path: '/onboarding/connect-bank' },
  { number: 2, title: 'Review Transactions', path: '/onboarding/review-transactions' },
  { number: 3, title: 'Set Budget', path: '/onboarding/setup-budget' },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getCurrentStep = () => {
    const currentStep = steps.find((step) => pathname?.includes(step.path));
    return currentStep?.number || 1;
  };

  const currentStepNumber = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm" data-testid="progress-indicator">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    data-testid={`step-${step.number}`}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                      ${
                        step.number < currentStepNumber
                          ? 'bg-green-500 text-white'
                          : step.number === currentStepNumber
                          ? 'bg-blue-600 text-white active'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {step.number < currentStepNumber ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <p
                    className={`
                      mt-2 text-xs font-medium
                      ${
                        step.number === currentStepNumber
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.number}. {step.title}
                  </p>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-4
                      ${
                        step.number < currentStepNumber
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
