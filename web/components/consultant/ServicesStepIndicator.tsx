'use client';

import React from 'react';
import { Check, Eye, FileCheck, Clock } from 'lucide-react';

interface ServicesStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICES_STEPS: ServicesStep[] = [
  {
    id: 1,
    title: 'Browse Services',
    description: 'Explore available services',
    icon: Eye,
  },
  {
    id: 2,
    title: 'Apply for Service',
    description: 'Submit your application',
    icon: FileCheck,
  },
  {
    id: 3,
    title: 'Await Approval',
    description: 'Admin reviews your request',
    icon: Clock,
  },
];

interface ServicesStepIndicatorProps {
  currentStep: number;
  className?: string;
}

const ServicesStepIndicator: React.FC<ServicesStepIndicatorProps> = ({
  currentStep,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Progress</h3>
      
      <div className="space-y-6">
        {SERVICES_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === SERVICES_STEPS.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-4">
                {/* Icon Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-green-100 text-green-700 border-2 border-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-green-700' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`
                    absolute left-5 top-10 w-0.5 h-6
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          {currentStep === 1 && (
            <>
              Browse through available services and click <span className="font-semibold">&ldquo;Apply&rdquo;</span> on services you want to offer.
            </>
          )}
          {currentStep === 2 && (
            <>
              Review your application details and submit. You can track all applications in the <span className="font-semibold">My Applications</span> page.
            </>
          )}
          {currentStep === 3 && (
            <>
              Your application is under review. You&apos;ll be notified once the admin approves or rejects your request.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default ServicesStepIndicator;

