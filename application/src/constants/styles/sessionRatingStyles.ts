import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const sessionRatingStyles = StyleSheet.create({
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  starButton: {
    marginHorizontal: 5,
  },
  ratingContainer: {
    padding: 20,
  },
  ratingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  completeContainer: {
    padding: 20,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sessionInfoContainer: {
    padding: 20,
  },
  sessionInfoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
