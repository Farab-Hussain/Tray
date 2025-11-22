import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { loadMoreButtonStyles } from '../../constants/styles/loadMoreButtonStyles';

type LoadMoreButtonProps = {
  onPress: () => void;
  loading: boolean;
  hasMore: boolean;
  label?: string;
};

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onPress,
  loading,
  hasMore,
  label = 'Load More',
}) => {
  if (!hasMore) return null;

  return (
    <View style={loadMoreButtonStyles.container}>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        style={[loadMoreButtonStyles.button, loading && loadMoreButtonStyles.buttonDisabled]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={loadMoreButtonStyles.buttonText}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default LoadMoreButton;

