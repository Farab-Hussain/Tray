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
  const errors: string[] = [];
  const feedback: string[] = [];
  
  // Basic length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Character type checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
    feedback.push('Add uppercase letters');
  }
  
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
    feedback.push('Add lowercase letters');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
    feedback.push('Add numbers');
  }
  
  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character');
    feedback.push('Add special characters (!@#$%^&*)');
  }
  
  // Calculate strength score
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
  
  // Additional feedback for improvement
  if (password.length < 12 && password.length >= 8) {
    feedback.push('Consider using 12+ characters');
  }
  
  if (password.length < 16 && password.length >= 12) {
    feedback.push('Great length! Consider adding more variety');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    feedback.push('Avoid common sequences');
  }
  
  const strength: PasswordStrength = {
    score,
    level,
    feedback: feedback.slice(0, 3), // Limit to 3 most important feedback items
    color,
  };
  
  // Consider password valid if it's "fair" or better (score >= 3)
  // This allows users to proceed with fair passwords while still encouraging stronger ones
  const isValid = score >= 3 || errors.length === 0;
  
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
