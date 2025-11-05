import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.black,
    marginBottom: 2,
  },
  contactTitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    alignSelf: 'flex-end' as const,
    backgroundColor: COLORS.chatInputBackground,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start' as const,
    backgroundColor: COLORS.chatBackground,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.black,
  },
  otherMessageText: {
    color: COLORS.black,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    minHeight: 40,
  },
  emojiButton: {
    padding: 4,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    maxHeight: 100,
    paddingVertical: 4,
  },
  cameraButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendButtonActive: {
    backgroundColor: COLORS.green,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.gray,
  },
  timestampText: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
  },
  timestampRight: {
    alignSelf: 'flex-end' as const,
  },
  timestampLeft: {
    alignSelf: 'flex-start' as const,
  },
  // Selection mode styles
  selectionModeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.chatInputBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectionModeText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '600' as const,
  },
  selectionModeActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  selectionModeButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.red || '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Message selection styles
  messageBubbleSelected: {
    opacity: 0.7,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  messageBubblePressable: {
    // Allows long press detection
  },
  // Action sheet / menu styles
  actionSheetOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  actionSheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  actionSheetItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  actionSheetItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  actionSheetItemTextDanger: {
    fontSize: 16,
    color: COLORS.red || '#FF3B30',
    fontWeight: '600' as const,
  },
  // Confirmation modal styles
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: COLORS.lightGray,
  },
  modalButtonDelete: {
    backgroundColor: COLORS.red || '#FF3B30',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalButtonTextCancel: {
    color: COLORS.black,
  },
  modalButtonTextDelete: {
    color: COLORS.white,
  },
});
