import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const studentProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
    width: 120,
    height: 120,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.green,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    zIndex: 10,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#F0F0F0',
    marginLeft: 16,
    marginRight: 16,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoItemText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.gray,
  },
  infoSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});

