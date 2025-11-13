import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const consultantFlowStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerSpacer: {
    width: 24,
  },

  // Status badge styles
  statusBadge: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Form section styles
  section: {
    // backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 16,
    // padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },

  // Input styles
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.black,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },

  // Category selection styles
  scrollContainer: {
    position: 'relative',
  },
  categoryScrollContainer: {
    maxHeight: 50,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  scrollIndicatorLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -8 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scrollIndicatorRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -8 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.black,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },

  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: COLORS.lightGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.green,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },

  // Custom category input styles
  customCategoryContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  customCategoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  customCategoryInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 6,
    fontSize: 16,
    color: COLORS.black,
  },

  // Price input styles
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSymbol: {
    position: 'absolute',
    left: 12,
    fontSize: 14,
    color: COLORS.gray,
    zIndex: 1,
  },
  priceInputField: {
    flex: 1,
    paddingLeft: 28,
  },

  // Specialty styles
  specialtyInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  specialtyInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  specialtyTagText: {
    fontSize: 13,
    color: COLORS.white,
  },
  specialtyTagRemove: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '600',
  },

  // Button styles
  submitButton: {
    backgroundColor: COLORS.green,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 10,
    textAlign: 'center',
  },

  // Profile image styles
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  // Step indicator styles
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
  },
  stepDotActive: {
    backgroundColor: COLORS.green,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.green,
  },
  stepLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  stepLabelActive: {
    color: COLORS.green,
    fontWeight: '600',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});

export const serviceApplicationStyles = StyleSheet.create({
  // Service type selection
  serviceTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  serviceTypeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  serviceTypeCardSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  serviceTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  serviceTypeDescription: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },

  // Service list styles
  serviceList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
  },
  serviceItemLast: {
    borderBottomWidth: 0,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
  },
  serviceDuration: {
    fontSize: 12,
    color: COLORS.gray,
  },

  // Custom service form
  customServiceForm: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  durationInput: {
    flex: 1,
  },
  durationUnit: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  durationUnitText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export const pendingApprovalStyles = StyleSheet.create({
  // Status styles
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  // Welcome card styles
  welcomeCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.green,
    marginBottom: 24,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
    marginRight: 12,
    width: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    lineHeight: 22,
  },

  // Review notes styles
  reviewNotesCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.red,
    marginBottom: 24,
  },
  reviewNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 8,
  },
  reviewNotesText: {
    fontSize: 14,
    color: COLORS.red,
    lineHeight: 20,
  },

  // Card styles
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },

  // Status badge styles
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgePending: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeApproved: {
    backgroundColor: COLORS.green,
  },
  statusBadgeRejected: {
    backgroundColor: COLORS.red,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadgeTextPending: {
    color: COLORS.white,
  },
  statusBadgeTextApproved: {
    color: COLORS.white,
  },
  statusBadgeTextRejected: {
    color: COLORS.white,
  },

  // Stats row styles
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action button styles
  actionsContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonLarge: {
    flexDirection: 'row',
    backgroundColor: COLORS.green,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryButtonLargeText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    gap: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.green,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },

  // Help text styles
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helpText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
});
