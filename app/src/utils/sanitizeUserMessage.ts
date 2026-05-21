const TECHNICAL_PATTERNS = [
  /ECONNABORTED/gi,
  /ETIMEDOUT/gi,
  /ERR_NETWORK/gi,
  /timeout of \d+ms exceeded/gi,
  /AxiosError/gi,
  /Network Error/gi,
];

export const sanitizeUserMessage = (value: any): any => {
  if (typeof value === 'string') {
    let message = value.replace(/error/gi, 'issue');
    for (const pattern of TECHNICAL_PATTERNS) {
      message = message.replace(pattern, '').trim();
    }
    if (!message) {
      return 'Something went wrong. Please try again.';
    }
    return message;
  }
  return value;
};

export const sanitizeAlertPayload = (title?: any, message?: any, buttons?: any[]) => {
  const sanitizedTitle = sanitizeUserMessage(title);
  const sanitizedMessage = sanitizeUserMessage(message);
  const sanitizedButtons = Array.isArray(buttons)
    ? buttons.map(button => ({
        ...button,
        text: sanitizeUserMessage(button?.text),
      }))
    : buttons;

  return { sanitizedTitle, sanitizedMessage, sanitizedButtons } as const;
};
