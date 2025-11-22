import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const changeUsernameStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 6,
  },
  submitButton: {
    marginTop: 12,
  },
});

