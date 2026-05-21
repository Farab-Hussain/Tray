let activeChatId: string | null = null;

export const setActiveChatId = (chatId: string | null) => {
  activeChatId = chatId;
};

export const getActiveChatId = () => activeChatId;

export const isChatActive = (chatId: string) => activeChatId === chatId;
