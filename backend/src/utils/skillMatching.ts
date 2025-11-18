/**
 * Skill Matching Algorithm
 * 
 * Calculates match score and rating between job required skills and user skills
 * Industry best practices:
 * - Case-insensitive matching
 * - Exact string matching (can be extended to fuzzy matching)
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
    const matched = uniqueUserSkills.some(userSkill => {
      // Exact match (case-insensitive)
      if (userSkill === jobSkill) {
        return true;
      }
      // Partial match (contains) - more flexible matching
      // e.g., "JavaScript" matches "JavaScript ES6"
      if (userSkill.includes(jobSkill) || jobSkill.includes(userSkill)) {
        return true;
      }
      return false;
    });

    if (matched) {
      // Find the original user skill that matched (preserve original casing)
      const originalMatchedSkill = userSkills.find(us => 
        us.trim().toLowerCase() === jobSkill || 
        us.trim().toLowerCase().includes(jobSkill) ||
        jobSkill.includes(us.trim().toLowerCase())
      ) || jobSkills.find(js => js.trim().toLowerCase() === jobSkill) || jobSkill;
      
      matchedSkills.push(originalMatchedSkill);
    } else {
      // Preserve original casing from job skills
      const originalMissingSkill = jobSkills.find(js => 
        js.trim().toLowerCase() === jobSkill
      ) || jobSkill;
      missingSkills.push(originalMissingSkill);
    }
  });

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

  return {
    score: matchCount,
    totalRequired,
    matchPercentage,
    rating,
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

