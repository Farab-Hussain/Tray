import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PasswordStrength } from '../../utils/passwordValidation';
import { getPasswordStrengthText, getPasswordStrengthIcon } from '../../utils/passwordValidation';

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

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>To improve your password:</Text>
          {strength.feedback.map((item, index) => (
            <Text key={index} style={styles.feedbackItem}>
              • {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 2,
  },
});

export default PasswordStrengthIndicator;
