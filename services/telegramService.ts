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
    throw new Error("請先在設定中填寫 Telegram Bot Token 和 Channel ID");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        // Using default parse_mode (plain text) to avoid markdown errors which are common
      })
    });

    const data: TelegramResponse = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram API Error: ${response.status}`);
    }
  } catch (error) {
    console.error("Telegram Send Error:", error);
    throw error;
  }
};