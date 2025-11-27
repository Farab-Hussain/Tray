import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const applicationDetailScreenStyles = StyleSheet.create({
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
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden', // Ensure content doesn't overflow card
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  companyName: {
    fontSize: 17,
    color: COLORS.gray,
    fontWeight: '500',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  jobInfoIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2, // Align icon with first line of text
  },
  jobInfoText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  matchBanner: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  matchBannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  matchBannerSubtitle: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
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
  skillText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  skillTagMatched: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  skillTextMatched: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '600',
  },
  textCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  textContent: {
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 24,
  },
  resumeButton: {
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  resumeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 4,
  },
});

