import { StyleSheet } from 'react-native';

export const passwordStrengthIndicatorStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 2,
  },
});

