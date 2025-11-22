import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../../constants/core/colors';
import { useNetwork } from '../../contexts/NetworkContext';
import { offlineOverlayStyles } from '../../constants/styles/offlineOverlayStyles';

const OfflineOverlay: React.FC = () => {
  const { isConnected, checkConnection } = useNetwork();
  const [isChecking, setIsChecking] = React.useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    // Small delay to show loading state
    setTimeout(() => {
      setIsChecking(false);
    }, 500);
  };

  // Don't show overlay if connected
  if (isConnected) {
    return null;
  }

  return (
    <Modal
      visible={!isConnected}
      transparent={false}
      animationType="fade"
      hardwareAccelerated
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <WifiOff size={64} color={COLORS.gray} />
          </View>

          {/* Title */}
          <Text style={styles.title}>No Internet Connection</Text>

          {/* Message */}
          <Text style={styles.message}>
            Please check your connection and try again.
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
            onPress={handleRetry}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <RefreshCw size={20} color={COLORS.white} style={styles.retryIcon} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = offlineOverlayStyles;

export default OfflineOverlay;

