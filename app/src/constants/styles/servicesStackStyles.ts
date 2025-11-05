import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

// Consolidated styles for all screens in ServicesStackNavigator
// Includes: Services, BookingSlots, and Cart screens

export const servicesStackStyles = StyleSheet.create({
  // ============ Common Styles ============
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollViewContent: {
    padding: 20,
  },

  // ============ BookingSlots Screen Styles ============
  bookingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: 12,
  },
  timeSlotsContainer: {
    marginBottom: 30,
  },
  timeSlotsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 20,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '31%',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  selectedTimeSlotText: {
    color: COLORS.white,
  },
  bookedTimeSlot: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectedTimeInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
    borderWidth: 1,
    borderColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTimeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 16,
  },
  sessionSummary: {
    gap: 8,
  },
  sessionDate: {
    fontSize: 15,
    color: COLORS.gray,
    fontWeight: '500',
  },
  sessionTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.green,
    marginVertical: 4,
  },
  sessionDuration: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '600',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.green,
  },
  bookButtonContainer: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  bookButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // ============ Cart Screen Styles ============
  cartSafeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  cartScrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  cartContentContainer: {
    padding: 20,
    paddingBottom: 0, // Remove bottom padding since summary is sticky
  },
  cartHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    paddingVertical: 15,
  },
  cartEmptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 20,
  },
  cartItemsContainer: {
    marginTop: 20,
  },
  cartContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  stickySummary: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
    paddingBottom: 20, // Add bottom spacing
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  // ============ Services Screen Styles ============
  // Services screen uses screenStyles from constants/screenStyles
  // Including here for consistency:
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  servicesCardWrapper: {
    width: '48%',   
    marginBottom: 12,
  },
});

