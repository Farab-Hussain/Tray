import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/core/colors';
import { summaryCardStyles } from '../../constants/styles/summaryCardStyles';

type SummaryStat = {
  label: string;
  value: number;
  color?: string;
};

type SummaryCardProps = {
  title?: string;
  stats: SummaryStat[];
  containerStyle?: any;
  titleStyle?: any;
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title = 'Application Summary',
  stats,
  containerStyle,
  titleStyle,
}) => {
  return (
    <View style={[summaryCardStyles.summaryCard, containerStyle]}>
      <Text style={[summaryCardStyles.summaryTitle, titleStyle]}>{title}</Text>
      <View style={summaryCardStyles.summaryStats}>
        {stats.map((stat, index) => {
          if (stat.value === 0) return null;
          
          return (
            <View key={index} style={summaryCardStyles.summaryStat}>
              <Text style={summaryCardStyles.summaryLabel}>{stat.label}</Text>
              <Text
                style={[
                  summaryCardStyles.summaryValue,
                  stat.color && { color: stat.color },
                ]}
              >
                {stat.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default SummaryCard;

