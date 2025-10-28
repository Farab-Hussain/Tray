import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const consultantCard = StyleSheet.create({
  card: {
    width: '100%',               // fit inside wrapper
    height: 280,                 // fixed height for uniform cards
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,         // reduced padding
    paddingHorizontal: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },

  leftBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 4,
    textAlign: 'center',
  },

  cardSubtitle: {
    fontSize: 13,
    color: COLORS.blackTransparent,
    marginBottom: 6,
    textAlign: 'center',
  },

  cardButton: {
    // width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 3,
    height: 10,
    backgroundColor: COLORS.yellow,
    borderRadius: 18,
    marginTop: 6,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  iconBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  ConsultantRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: COLORS.black,
  },
});

export const consultantCardGrid = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
