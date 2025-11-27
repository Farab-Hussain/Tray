/**
 * Skill Matching Algorithm
 * 
 * Calculates match score and rating between job required skills and user skills
 * Industry best practices:
 * - Case-insensitive matching
 * - Fuzzy matching for spelling variations
 * - Common skill normalization (e.g., MongoDB variations)
 * - Clear rating thresholds
 * - Returns detailed breakdown for transparency
 */

export interface MatchResult {
  score: number; // Number of matching skills
  totalRequired: number; // Total required skills
  matchPercentage: number; // Percentage match (0-100)
  rating: "gold" | "silver" | "bronze" | "basic";
  matchedSkills: string[]; // Which skills matched
  missingSkills: string[]; // Which skills are missing
}

/**
 * Normalize skill names to handle common variations and spelling differences
 * This helps match skills like "MongoDB" with "Moongodb" or "Mongo DB"
 */
function normalizeSkillName(skill: string): string {
  let normalized = skill.trim().toLowerCase();
  
  // Remove common separators and spaces
  normalized = normalized.replace(/[\s\-_\.]+/g, '');
  
  // Common skill variations mapping (maps variations to canonical form)
  const skillVariations: { [key: string]: string } = {
    // Database variations - MongoDB
    'moongodb': 'mongodb',  // Common typo
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    
    // JavaScript variations
    'js': 'javascript',
    'ecmascript': 'javascript',
    'javascript': 'javascript',
    
    // React variations
    'reactjs': 'react',
    'react.js': 'react',
    'react': 'react',
    
    // Express variations
    'expressjs': 'express',
    'express.js': 'express',
    'express': 'express',
    
    // Node variations
    'node': 'nodejs',
    'node.js': 'nodejs',
    'nodejs': 'nodejs',
    
    // Vue variations
    'vue': 'vuejs',
    'vue.js': 'vuejs',
    'vuejs': 'vuejs',
    
    // Angular variations
    'angularjs': 'angular',
    'angular.js': 'angular',
    'angular': 'angular',
    
    // Python variations
    'py': 'python',
    'python': 'python',
    
    // TypeScript variations
    'ts': 'typescript',
    'typescript': 'typescript',
    
    // HTML/CSS variations
    'html5': 'html',
    'html': 'html',
    'css3': 'css',
    'css': 'css',
    
    // SQL variations
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'mysql': 'mysql',
    'sql': 'sql',
  };
  
  // Check if normalized skill matches any variation
  if (skillVariations[normalized]) {
    return skillVariations[normalized];
  }
  
  return normalized;
}

/**
 * Check if two skills match (with fuzzy matching)
 */
function skillsMatch(skill1: string, skill2: string): boolean {
  const norm1 = normalizeSkillName(skill1);
  const norm2 = normalizeSkillName(skill2);
  
  // Exact match after normalization
  if (norm1 === norm2) {
    return true;
  }
  
  // Partial match (one contains the other)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }
  
  // Fuzzy match: check if they're similar (for typos)
  // Calculate similarity ratio (simple Levenshtein-like check)
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  
  // If shorter is at least 70% of longer and one contains most of the other
  if (longer.length > 0 && shorter.length / longer.length >= 0.7) {
    // Check if shorter string is mostly contained in longer
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    // If 80% of characters match, consider it a match
    if (matches / shorter.length >= 0.8) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate match score between job required skills and user skills
 * 
 * @param jobSkills - Array of required skills for the job
 * @param userSkills - Array of skills the user has
 * @returns MatchResult with score, rating, and breakdown
 * 
 * Rating Criteria:
 * - Gold: 100% match (all required skills)
 * - Silver: 75%+ match (most skills) - e.g., 3 out of 4
 * - Bronze: 50%+ match (half skills) - e.g., 2 out of 4
 * - Basic: <50% match (1 or fewer skills)
 */
export function calculateMatchScore(
  jobSkills: string[],
  userSkills: string[]
): MatchResult {
  // Normalize skills: trim, lowercase, remove duplicates
  const normalizedJobSkills = jobSkills
    .map(skill => skill.trim().toLowerCase())
    .filter(skill => skill.length > 0);
  
  const normalizedUserSkills = userSkills
    .map(skill => skill.trim().toLowerCase())
    .filter(skill => skill.length > 0);

  // Remove duplicates
  const uniqueJobSkills = [...new Set(normalizedJobSkills)];
  const uniqueUserSkills = [...new Set(normalizedUserSkills)];

  // Find matching skills (case-insensitive)
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  uniqueJobSkills.forEach(jobSkill => {
    // Find matching user skill using fuzzy matching
    const matchedUserSkill = uniqueUserSkills.find(userSkill => {
      return skillsMatch(userSkill, jobSkill);
    });

    if (matchedUserSkill) {
      // Find the original user skill that matched (preserve original casing)
      const originalMatchedSkill = userSkills.find(us => {
        return skillsMatch(us, jobSkill);
      }) || jobSkills.find(js => skillsMatch(js, jobSkill)) || jobSkill;
      
      // Only add if not already in matchedSkills (prevent duplicates)
      if (!matchedSkills.some(ms => skillsMatch(ms, originalMatchedSkill))) {
        matchedSkills.push(originalMatchedSkill);
      }
    } else {
      // Preserve original casing from job skills
      const originalMissingSkill = jobSkills.find(js => 
        normalizeSkillName(js) === normalizeSkillName(jobSkill)
      ) || jobSkill;
      missingSkills.push(originalMissingSkill);
    }
  });

  // Ensure score always matches matchedSkills length (single source of truth)
  const matchCount = matchedSkills.length;
  const totalRequired = uniqueJobSkills.length;
  const matchPercentage = totalRequired > 0 
    ? (matchCount / totalRequired) * 100 
    : 0;

  // Determine rating based on percentage
  let rating: "gold" | "silver" | "bronze" | "basic";
  if (matchPercentage === 100) {
    rating = "gold";
  } else if (matchPercentage >= 75) {
    rating = "silver";
  } else if (matchPercentage >= 50) {
    rating = "bronze";
  } else {
    rating = "basic";
  }

  // Final validation: score must equal matchedSkills length
  const finalScore = matchedSkills.length;
  const finalMatchPercentage = totalRequired > 0 
    ? (finalScore / totalRequired) * 100 
    : 0;

  // Recalculate rating based on final score
  let finalRating: "gold" | "silver" | "bronze" | "basic";
  if (finalMatchPercentage === 100) {
    finalRating = "gold";
  } else if (finalMatchPercentage >= 75) {
    finalRating = "silver";
  } else if (finalMatchPercentage >= 50) {
    finalRating = "bronze";
  } else {
    finalRating = "basic";
  }

  return {
    score: finalScore, // Always use matchedSkills.length as single source of truth
    totalRequired,
    matchPercentage: finalMatchPercentage,
    rating: finalRating,
    matchedSkills,
    missingSkills,
  };
}

/**
 * Get rating priority for sorting (lower number = higher priority)
 * Used to sort applications: Gold first, then Silver, then Bronze, then Basic
 */
export function getRatingPriority(rating: "gold" | "silver" | "bronze" | "basic"): number {
  const priorities = {
    gold: 1,
    silver: 2,
    bronze: 3,
    basic: 4,
  };
  return priorities[rating];
}

/**
 * Format match result for display
 */
export function formatMatchResult(result: MatchResult): string {
  return `${result.score}/${result.totalRequired} skills (${result.matchPercentage.toFixed(0)}%) - ${result.rating.toUpperCase()}`;
}

