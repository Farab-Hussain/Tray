import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const changePasswordStyles = StyleSheet.create({
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
  inputWrapper: {
    position: 'relative',
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
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.red,
  },
  generalError: {
    textAlign: 'center',
  },
});

