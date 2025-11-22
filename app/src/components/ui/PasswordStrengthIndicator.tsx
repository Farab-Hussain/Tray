import React from 'react';
import { View, Text } from 'react-native';
import { PasswordStrength } from '../../utils/passwordValidation';
import { getPasswordStrengthText, getPasswordStrengthIcon } from '../../utils/passwordValidation';
import { passwordStrengthIndicatorStyles } from '../../constants/styles/passwordStrengthIndicatorStyles';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showFeedback?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
  showFeedback = true,
}) => {
  const strengthText = getPasswordStrengthText(strength.level);
  const strengthIcon = getPasswordStrengthIcon(strength.level);

  return (
    <View style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View style={styles.strengthBar}>
          <View
            style={[
              styles.strengthFill,
              {
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.color,
              },
            ]}
          />
        </View>
        <View style={styles.strengthInfo}>
          <Text style={styles.strengthIcon}>{strengthIcon}</Text>
          <Text style={[styles.strengthText, { color: strength.color }]}>
            {strengthText}
          </Text>
        </View>
      </View>

      {/* Feedback removed - only show strength indicator */}
    </View>
  );
};

const styles = passwordStrengthIndicatorStyles;

export default PasswordStrengthIndicator;
