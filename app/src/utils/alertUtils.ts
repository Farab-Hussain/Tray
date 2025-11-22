import { Alert } from 'react-native';

/**
 * Shows a confirmation dialog
 * @param title - Dialog title
 * @param message - Dialog message
 * @param onConfirm - Callback when user confirms
 * @param onCancel - Optional callback when user cancels
 * @param confirmText - Text for confirm button (default: "OK")
 * @param cancelText - Text for cancel button (default: "Cancel")
 */
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Shows a simple alert dialog
 * @param title - Dialog title
 * @param message - Dialog message
 * @param onOk - Optional callback when user presses OK
 */
export const showAlert = (
  title: string,
  message: string,
  onOk?: () => void
) => {
  Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
};

/**
 * Shows an error alert
 * @param message - Error message
 * @param onOk - Optional callback when user presses OK
 */
export const showErrorAlert = (message: string, onOk?: () => void) => {
  showAlert('Error', message, onOk);
};

/**
 * Shows a success alert
 * @param message - Success message
 * @param onOk - Optional callback when user presses OK
 */
export const showSuccessAlert = (message: string, onOk?: () => void) => {
  showAlert('Success', message, onOk);
};

