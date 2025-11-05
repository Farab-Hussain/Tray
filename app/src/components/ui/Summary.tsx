import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { summaryStyles as styles } from '../../constants/styles/summaryStyles';

type SummaryProps = {
  subtotal: number;
  loading?: boolean;
  onProceedToCheckout?: () => void;
};

const Summary: React.FC<SummaryProps> = ({
  subtotal,
  loading = false,
  onProceedToCheckout,
}) => {
  const total = subtotal; // Total is now just the subtotal

  return (
    <View style={styles.container}>
      {/* Order Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Info</Text>
        
        <View style={styles.orderBreakdown}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Subtotal</Text>
            <Text style={styles.orderValue}>${subtotal}</Text>
          </View>
          
          
          <View style={[styles.orderRow]}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>${total}</Text>
          </View>
        </View>
      </View>

      {/* Proceed to Checkout Button */}
      <TouchableOpacity 
        style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
        onPress={onProceedToCheckout}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Summary;
