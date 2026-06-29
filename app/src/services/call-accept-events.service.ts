type CallAcceptListener = (callId: string) => void;

const listeners = new Set<CallAcceptListener>();

export const subscribeCallAcceptRequest = (listener: CallAcceptListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Returns true if at least one mounted call screen handled the accept. */
export const emitCallAcceptRequest = (callId: string): boolean => {
  if (!callId || listeners.size === 0) {
    return false;
  }
  listeners.forEach(listener => listener(callId));
  return true;
};
