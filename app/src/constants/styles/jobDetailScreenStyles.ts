import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const jobDetailScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  matchBannerWrapper: {
    marginBottom: 20,
  },
  matchBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  matchBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  matchBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  matchStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  matchStat: {
    flex: 1,
    alignItems: 'center',
  },
  matchStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  matchStatLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  matchStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.lightBackground,
    marginHorizontal: 16,
  },
  matchSkillsSection: {
    marginTop: 12,
  },
  matchSkillsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
    marginBottom: 10,
  },
  missingSkillsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 10,
  },
  matchSkillsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  matchSkillTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  matchSkillTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  missingSkillTag: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  missingSkillTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray,
  },
  headerSection: {
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    lineHeight: 32,
  },
  companyName: {
    fontSize: 18,
    color: COLORS.gray,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
    fontWeight: '400',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  skillTagMatched: {
    backgroundColor: COLORS.green,
  },
  skillText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  skillTextMatched: {
    color: COLORS.white,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 8,
  },
  appliedButton: {
    backgroundColor: COLORS.gray,
  },
  appliedMessage: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  statusWarning: {
    fontSize: 13,
    color: COLORS.red,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

