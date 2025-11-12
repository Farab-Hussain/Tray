export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  color: string;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = []; // No validation errors - allow any password
  const feedback: string[] = []; // No feedback shown
  
  // Handle empty password
  if (!password || password.length === 0) {
    return {
      isValid: true, // Allow empty password (will be caught by required field check)
      errors: [],
      strength: {
        score: 0,
        level: 'very-weak',
        feedback: [],
        color: '#FF4444',
      },
    };
  }
  
  // Character type checks (for strength calculation only, not validation)
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  // Calculate strength score (for display only, not validation)
  let score = 0;
  
  // Length scoring (max 2 points)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety scoring (max 4 points)
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  
  // Bonus for longer passwords (max 2 points)
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;
  
  // Determine strength level
  let level: PasswordStrength['level'];
  let color: string;
  
  if (score <= 2) {
    level = 'very-weak';
    color = '#FF4444';
  } else if (score <= 3) {
    level = 'weak';
    color = '#FF8800';
  } else if (score <= 4) {
    level = 'fair';
    color = '#FFC107';
  } else if (score <= 5) {
    level = 'good';
    color = '#4CAF50';
  } else {
    level = 'strong';
    color = '#2E7D32';
  }
  
  const strength: PasswordStrength = {
    score,
    level,
    feedback: [], // No feedback - just show strength indicator
    color,
  };
  
  // Always allow any password - no validation blocking
  const isValid = true;
  
  return {
    isValid,
    errors,
    strength,
  };
};

export const getPasswordStrengthText = (level: PasswordStrength['level']): string => {
  switch (level) {
    case 'very-weak':
      return 'Very Weak';
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
};

export const getPasswordStrengthIcon = (level: PasswordStrength['level']): string => {
  switch (level) {
    case 'very-weak':
      return '🔴';
    case 'weak':
      return '🟠';
    case 'fair':
      return '🟡';
    case 'good':
      return '🟢';
    case 'strong':
      return '💪';
    default:
      return '❓';
  }
};
