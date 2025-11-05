import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { consultantFlowStyles } from '../../constants/styles/consultantFlowStyles';
import { COLORS } from '../../constants/core/colors';

interface Step {
  id: string;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = [],
}) => {
  const getStepDotStyle = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      return consultantFlowStyles.stepDotCompleted;
    }
    if (stepIndex === currentStep) {
      return consultantFlowStyles.stepDotActive;
    }
    return consultantFlowStyles.stepDot;
  };

  const getStepLabelStyle = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      return [consultantFlowStyles.stepLabel, consultantFlowStyles.stepLabelActive];
    }
    return consultantFlowStyles.stepLabel;
  };

  return (
    <View style={consultantFlowStyles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={consultantFlowStyles.stepItem}>
          <View style={getStepDotStyle(index)} />
          {completedSteps.includes(index) && (
            <CheckCircle size={12} color="#10B981" style={{ position: 'absolute', left: -2, top: -2 }} />
          )}
          <Text style={getStepLabelStyle(index)}>{step.title}</Text>
        </View>
      ))}
    </View>
  );
};
