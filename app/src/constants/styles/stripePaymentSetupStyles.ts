import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const stripePaymentSetupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 28,
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.green,
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.orange,
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.blue,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    color: COLORS.green,
    marginRight: 12,
    marginTop: 2,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  infoItemText: {
    flex: 1,
    textAlign: 'left',
  },
});

