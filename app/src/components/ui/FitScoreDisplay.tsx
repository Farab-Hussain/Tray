import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react-native';

interface FitScoreDisplayProps {
  matchScore: {
    score: number;
    totalRequired: number;
    matchPercentage: number;
    matchRating: 'gold' | 'silver' | 'bronze' | 'basic';
    matchedSkills: string[];
    missingSkills: string[];
    improvementSuggestions?: string[];
    availabilityAlignment?: number;
    locationCompatibility?: number;
  };
  compact?: boolean;
  showDetails?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const FitScoreDisplay: React.FC<FitScoreDisplayProps> = ({
  matchScore,
  compact = false,
  showDetails = true,
}) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#808080';
    }
  };

  const getRatingBackgroundColor = (rating: string) => {
    switch (rating) {
      case 'gold':
        return '#FFF9E6';
      case 'silver':
        return '#F5F5F5';
      case 'bronze':
        return '#FFF4E6';
      default:
        return '#F5F5F5';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'gold':
        return Award;
      case 'silver':
        return Star;
      case 'bronze':
        return Target;
      default:
        return Info;
    }
  };

  const getRatingMessage = (rating: string) => {
    switch (rating) {
      case 'gold':
        return 'Excellent Match! You have most of the required skills.';
      case 'silver':
        return 'Good Match! You have many of the required skills.';
      case 'bronze':
        return 'Fair Match. Consider developing missing skills.';
      default:
        return 'Basic Match. Significant skill development needed.';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return COLORS.green;
    if (percentage >= 60) return COLORS.blue;
    if (percentage >= 40) return COLORS.orange;
    return COLORS.red;
  };

  const RatingIcon = getRatingIcon(matchScore.matchRating);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: getRatingBackgroundColor(matchScore.matchRating) }]}>
        <View style={styles.compactHeader}>
          <RatingIcon size={16} color={getRatingColor(matchScore.matchRating)} />
          <Text style={[styles.compactRating, { color: getRatingColor(matchScore.matchRating) }]}>
            {matchScore.matchRating.toUpperCase()}
          </Text>
          <Text style={styles.compactPercentage}>
            {matchScore.matchPercentage.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.compactProgressBar}>
          <View style={[styles.compactProgressFill, { width: `${matchScore.matchPercentage}%`, backgroundColor: getProgressColor(matchScore.matchPercentage) }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getRatingBackgroundColor(matchScore.matchRating) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.ratingContainer}>
          <RatingIcon size={24} color={getRatingColor(matchScore.matchRating)} />
          <View style={styles.ratingText}>
            <Text style={[styles.ratingTitle, { color: getRatingColor(matchScore.matchRating) }]}>
              {matchScore.matchRating.toUpperCase()} MATCH
            </Text>
            <Text style={styles.ratingSubtitle}>
              {getRatingMessage(matchScore.matchRating)}
            </Text>
          </View>
        </View>
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentage, { color: getProgressColor(matchScore.matchPercentage) }]}>
            {matchScore.matchPercentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${matchScore.matchPercentage}%`, backgroundColor: getProgressColor(matchScore.matchPercentage) }]} />
        </View>
        <Text style={styles.progressText}>
          {matchScore.score} of {matchScore.totalRequired} skills matched
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{matchScore.score}</Text>
          <Text style={styles.statLabel}>Matched Skills</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{matchScore.totalRequired - matchScore.score}</Text>
          <Text style={styles.statLabel}>Missing Skills</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{matchScore.matchPercentage.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Match Rate</Text>
        </View>
      </View>

      {showDetails && (
        <>
          {/* Matched Skills */}
          {matchScore.matchedSkills && matchScore.matchedSkills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={16} color={COLORS.green} />
                <Text style={styles.sectionTitle}>Matched Skills</Text>
                <Text style={styles.sectionCount}>
                  {matchScore.matchedSkills.length}
                </Text>
              </View>
              <View style={styles.skillsContainer}>
                {matchScore.matchedSkills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Missing Skills */}
          {matchScore.missingSkills && matchScore.missingSkills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <XCircle size={16} color={COLORS.red} />
                <Text style={styles.sectionTitle}>Missing Skills</Text>
                <Text style={styles.sectionCount}>
                  {matchScore.missingSkills.length}
                </Text>
              </View>
              <View style={styles.skillsContainer}>
                {matchScore.missingSkills.map((skill, index) => (
                  <View key={index} style={[styles.skillTag, styles.missingSkillTag]}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Improvement Suggestions */}
          {matchScore.improvementSuggestions && matchScore.improvementSuggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertCircle size={16} color={COLORS.blue} />
                <Text style={styles.sectionTitle}>Improvement Suggestions</Text>
                <Text style={styles.sectionCount}>
                  {matchScore.improvementSuggestions.length}
                </Text>
              </View>
              {matchScore.improvementSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>• {suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Additional Metrics */}
          {(matchScore.availabilityAlignment !== undefined || matchScore.locationCompatibility !== undefined) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={COLORS.blue} />
                <Text style={styles.sectionTitle}>Additional Metrics</Text>
              </View>
              {matchScore.availabilityAlignment !== undefined && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Availability Alignment:</Text>
                  <Text style={styles.metricValue}>{matchScore.availabilityAlignment}%</Text>
                </View>
              )}
              {matchScore.locationCompatibility !== undefined && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Location Compatibility:</Text>
                  <Text style={styles.metricValue}>{matchScore.locationCompatibility}%</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: 12,
    margin: 8,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingText: {
    marginLeft: 8,
    flex: 1,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  ratingSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactRating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  compactPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  missingSkillTag: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  skillText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  suggestionItem: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default FitScoreDisplay;
