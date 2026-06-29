import { useCallback, useState } from 'react';

export type CallConnectionUiState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'poor'
  | 'failed';

const mapStates = (
  connectionState?: string,
  iceState?: string,
): CallConnectionUiState => {
  if (connectionState === 'failed' || iceState === 'failed') {
    return 'failed';
  }
  if (
    connectionState === 'disconnected' ||
    iceState === 'disconnected' ||
    iceState === 'checking'
  ) {
    return 'reconnecting';
  }
  if (connectionState === 'connected' && iceState === 'connected') {
    return 'connected';
  }
  if (iceState === 'completed' && connectionState === 'connected') {
    return 'connected';
  }
  if (
    connectionState === 'connecting' ||
    iceState === 'new' ||
    iceState === 'checking'
  ) {
    return 'connecting';
  }
  return 'connecting';
};

export const useCallConnectionState = () => {
  const [uiState, setUiState] = useState<CallConnectionUiState>('connecting');

  const onConnectionStateChange = useCallback((state: string) => {
    setUiState(prev => {
      const next = mapStates(state, undefined);
      if (state === 'connected') return 'connected';
      if (state === 'disconnected') return 'reconnecting';
      if (state === 'failed') return 'failed';
      return prev === 'connected' ? prev : next;
    });
  }, []);

  const onIceConnectionStateChange = useCallback((iceState: string) => {
    setUiState(prev => {
      if (iceState === 'connected' || iceState === 'completed') {
        return 'connected';
      }
      if (iceState === 'failed') return 'failed';
      if (iceState === 'disconnected') return 'reconnecting';
      if (iceState === 'checking' && prev === 'connected') return 'reconnecting';
      return prev;
    });
  }, []);

  const resetConnectionState = useCallback(() => {
    setUiState('connecting');
  }, []);

  return {
    connectionUiState: uiState,
    onConnectionStateChange,
    onIceConnectionStateChange,
    resetConnectionState,
  };
};
