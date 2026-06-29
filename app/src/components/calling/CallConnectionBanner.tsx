import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { CallConnectionUiState } from '../../hooks/useCallConnectionState';
import { COLORS } from '../../constants/core/colors';

type Props = {
  state: CallConnectionUiState;
  topInset?: number;
};

const labelForState = (state: CallConnectionUiState): string => {
  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'poor':
      return 'Poor connection';
    case 'failed':
      return 'Connection problem';
    default:
      return '';
  }
};

export const CallConnectionBanner: React.FC<Props> = ({ state, topInset = 0 }) => {
  if (state === 'connected') return null;

  const label = labelForState(state);
  if (!label) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: topInset + 12,
        alignSelf: 'center',
        zIndex: 20,
        backgroundColor: state === 'failed' ? '#B42318' : 'rgba(0,0,0,0.72)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {state !== 'failed' && (
        <ActivityIndicator size="small" color={COLORS.white} />
      )}
      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
};
