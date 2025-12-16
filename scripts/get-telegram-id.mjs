import process from "node:process";

const token = process.argv[2];

if (!token) {
  console.log("\n❌ 請提供 Bot Token");
  console.log("使用方式: npm run find-id <您的BotToken>\n");
  process.exit(1);
}

async function run() {
  console.log(`\n🔄 正在重置並搜尋所有頻道 (Token: ${token.substring(0, 10)}...)...`);
  
  try {
    // 1. 清除 Webhook
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);

    // 2. 獲取更新
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();

    if (!data.ok) {
      console.error(`\n❌ API 錯誤: ${data.description}`);
      return;
    }

    // 3. 找出所有相關的頻道 (使用 Map 去除重複)
    const channels = new Map();

    data.result.forEach(u => {
      const chat = u.channel_post?.chat || u.message?.chat || u.my_chat_member?.chat;
      if (chat && (chat.type === 'channel' || chat.type === 'supergroup')) {
        channels.set(chat.id, chat); // 用 ID 當 key，自動去重複
      }
    });

    if (channels.size === 0) {
      console.log("\n⚠️  連線成功，但尚未偵測到任何頻道訊息。");
      console.log("---------------------------------------------------");
      console.log("請確保您已經：");
      console.log("1. 建立新頻道");
      console.log("2. 將機器人加入為「管理員 (Admin)」");
      console.log("3. 在新頻道內發送了一則文字訊息 (例如: hello)");
      console.log("---------------------------------------------------\n");
      return;
    }

    console.log(`\n✅ 成功偵測到 ${channels.size} 個頻道！\n`);
    console.log("===================================================");

    // 4. 列出所有找到的頻道
    for (const [id, chat] of channels) {
      const title = chat.title || "未命名頻道";
      console.log(`📌 頻道名稱: ${title}`);
      console.log(`🆔 頻道 ID:  ${id}`);
      
      // 嘗試發送確認訊息
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: id,
            text: `✅ 綁定成功！\n這是頻道「${title}」\nID: ${id}`
          })
        });
        console.log(`👉 已發送確認訊息到此頻道`);
      } catch (e) {
        console.log(`⚠️ 無法發送訊息 (可能是權限不足)`);
      }
      console.log("---------------------------------------------------");
    }
    console.log("請選擇您剛建立的那個頻道的 ID (通常是 -100 開頭)");
    console.log("===================================================\n");

  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
  }
}

run();