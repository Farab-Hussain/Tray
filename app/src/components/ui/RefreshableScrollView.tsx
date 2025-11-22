import React from 'react';
import { ScrollView, ScrollViewProps, RefreshControl } from 'react-native';
import { COLORS } from '../../constants/core/colors';

type RefreshableScrollViewProps = ScrollViewProps & {
  refreshing: boolean;
  onRefresh: () => void;
  refreshColor?: string;
  children: React.ReactNode;
};

const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  refreshing,
  onRefresh,
  refreshColor = COLORS.green,
  children,
  ...scrollViewProps
}) => {
  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={refreshColor}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView;

