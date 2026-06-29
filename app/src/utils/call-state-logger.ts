type CallStateRole = 'Caller' | 'Receiver' | 'Navigation' | 'Firestore' | 'Render';

type CallStateLogParams = {
  callId?: string;
  role: CallStateRole;
  event: string;
  status?: string;
  screen?: string;
  isCaller?: boolean;
  nativeCallUi?: boolean;
  source?: string;
  extra?: Record<string, unknown>;
};

export const logCallState = ({
  callId,
  role,
  event,
  status = '-',
  screen = '-',
  isCaller,
  nativeCallUi,
  source,
  extra,
}: CallStateLogParams): void => {
  const id = callId || 'unknown';
  const line = [
    `CALL ${id}`,
    role,
    event,
    `status=${status}`,
    `screen=${screen}`,
    `isCaller=${isCaller ?? '-'}`,
    `nativeCallUi=${nativeCallUi ?? '-'}`,
    source ? `source=${source}` : null,
    extra ? JSON.stringify(extra) : null,
  ]
    .filter(Boolean)
    .join(' | ');

  console.log(`📞 ${line}`);
};
