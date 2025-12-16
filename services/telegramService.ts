interface TelegramResponse {
  ok: boolean;
  description?: string;
}

export const sendToTelegram = async (
  botToken: string,
  chatId: string,
  text: string
): Promise<void> => {
  if (!botToken || !chatId) {
    throw new Error("Telegram 設定不完整 (缺少 Token 或 Chat ID)");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      })
    });

    const data: TelegramResponse = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram API Error: ${response.status}`);
    }
  } catch (error) {
    console.error("Telegram Send Error:", error);
    throw error; // Re-throw to handle in UI
  }
};