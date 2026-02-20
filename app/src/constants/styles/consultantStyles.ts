import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const consultantHome = StyleSheet.create({
  warningBanner: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.white,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 10,
  },
  leadCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  leadCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
  },
  aiPanel: {
    backgroundColor: '#EEF7FF',
    borderWidth: 1,
    borderColor: '#CFE6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  aiPanelTitle: {
    color: '#103B66',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  aiPanelText: {
    color: '#284B69',
    fontSize: 12,
    lineHeight: 18,
  },
  aiActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  aiActionButtonDisabled: {
    opacity: 0.7,
  },
  aiActionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  aiResultBox: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
  },
  aiResultText: {
    color: COLORS.black,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
});

export const consultantStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },

  // Header styles
  header: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  // Capacity warning styles
  capacityWarning: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },
  warningText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Main content styles
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
  },

  // Lead cards styles
  leadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    padding: 12,
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  HeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  leadCardContent: {
    marginVertical: 10,
  },
  leadCardContentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    paddingVertical: 6,
  },
  leadCardContentDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  leadCardButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.red,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    minHeight: 40,
  },
  acceptRequestButton: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    minHeight: 40,
  },
  acceptRequestButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  leadProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  matchedTag: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchedTagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  leadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientNameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.gray,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.yellow,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.red,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom navigation styles
  bottomNavigation: {
    backgroundColor: COLORS.green,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '500',
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.white,
    paddingTop: 8,
  },
  navLabelActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
