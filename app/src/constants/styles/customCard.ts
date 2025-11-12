import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const customCard = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },

  leftBox: {
    width: '40%',
    padding: 16,
    alignItems: 'center',
  },
  rightBox: {
    width: '60%',
    padding: 16,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.blackTransparent,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardButton: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginVertical: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.black,
    fontWeight: '700',
    fontSize: 14,
  },
  iconBox: {
    flexDirection: 'row',
    marginTop: 8,
  },
  iconCircle: {
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  badge: {
    width: 44,
    height: 64,
    alignSelf: 'flex-end',

  },
  description: {
    fontSize: 14,
    color: COLORS.blackTransparent,
    marginTop: -20,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ConsultantRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: COLORS.black,
  },

});
