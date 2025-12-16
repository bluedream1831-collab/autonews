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

export const sendToLine = async (
  accessToken: string,
  userId: string,
  text: string
): Promise<void> => {
  if (!accessToken || !userId) {
    throw new Error("Line 設定不完整 (缺少 Access Token 或 User ID)");
  }

  // 使用 CORS Proxy 或直接呼叫 (注意：Line API 有 CORS 限制，若在純前端執行可能會被瀏覽器擋下，
  // 建議在本地開發或特定環境使用。若部署到 Vercel 等平台，建議透過 Server Function 轉發。)
  // 為了演示方便，這裡直接呼叫，若遇 CORS 錯誤請使用 Allow CORS 插件或後端轉發。
  const url = `https://api.line.me/v2/bot/message/push`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: text }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Line API Error: ${response.status} - ${errText}`);
    }
  } catch (error) {
    console.error("Line Send Error:", error);
    throw error;
  }
};