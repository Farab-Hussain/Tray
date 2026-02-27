export const sanitizeUserMessage = (value: any): any => {
  if (typeof value === 'string') {
    return value.replace(/error/gi, 'issue');
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
