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

  // 修改：使用相對路徑 /telegram-api，透過 vercel.json 或 vite.config.ts 進行代理
  // 原本直接呼叫 https://api.telegram.org 會被瀏覽器 CORS 擋下
  const url = `/telegram-api/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      })
    });

    // 嘗試解析 JSON，如果解析失敗通常代表代理設定有誤或網路問題
    let data: TelegramResponse;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error(`無法解析伺服器回應 (${response.status})。可能是 CORS 代理設定尚未生效，請重新部署。`);
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram API Error: ${response.status}`);
    }
  } catch (error) {
    console.error("Telegram Send Error:", error);
    throw error; // Re-throw to handle in UI
  }
};