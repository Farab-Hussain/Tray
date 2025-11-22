import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const imageUploadStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainerError: {
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
  },
  videoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  videoPlaceholderText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

