import { GoogleGenAI } from "@google/genai";
import process from "node:process";

const API_KEY = process.env.API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PREFERRED_MODEL = process.env.PREFERRED_MODEL || "gemini-3-pro-preview"; // 預設使用高品質 Pro
const FORCE_MODE = process.env.FORCE_MODE ? process.env.FORCE_MODE.trim().toLowerCase() : null;

if (!API_KEY) {
  console.error("❌ 缺少 API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const retryOperation = async (operation, retries = 10, delay = 5000) => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error.status === 503 || error.message?.includes('503'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

async function run() {
  try {
    const options = { timeZone: "Asia/Taipei" };
    const now = new Date();
    const hourFormatter = new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', hour12: false });
    const currentHour = parseInt(hourFormatter.format(now));
    
    let isMorningSession = currentHour < 12;
    if (FORCE_MODE === 'morning') isMorningSession = true;
    else if (FORCE_MODE === 'evening') isMorningSession = false;

    console.log(`🚀 [${PREFERRED_MODEL}] 執行${isMorningSession ? '🌅 早報' : '🌇 晚報'}任務...`);

    // 1. 識別主題
    const trendPrompt = `Identify the single most critical tech/stock event for a ${isMorningSession ? 'morning summary of US markets' : 'evening summary of Asian markets'}. Return only the topic with relevant emojis.`;
    
    const trendResp = await retryOperation(() => ai.models.generateContent({
      model: PREFERRED_MODEL,
      contents: trendPrompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    }));
    
    const topic = trendResp.text.trim().replace(/^["']|["']$/g, '');
    console.log(`✅ 選定主題: ${topic}`);

    // 2. 生成深度分析內容
    // 只有 3 系列支援 Thinking 預算
    const isPro = PREFERRED_MODEL.includes("pro");
    const canThink = PREFERRED_MODEL.includes("gemini-3") || PREFERRED_MODEL.includes("gemini-2.5");

    const contentPrompt = `
      You are a World-Class FinTech Analyst. Write a detailed report in Traditional Chinese about "${topic}".
      EMOJI RULES: 
      - Use RICH Emojis for every section header.
      - Make the post visually dynamic and professional.
      
      Structure:
      - 🏷️ 標題
      - 📈 市場概況 (關鍵數據)
      - 🗞️ 重點拆解 (核心新聞剖析)
      - 💡 深度洞察 (分析全球供應鏈與資金流向邏輯，至少 150 字)
      - 🔭 展望與 Hasthags
    `;

    const contentResp = await retryOperation(() => ai.models.generateContent({
      model: PREFERRED_MODEL,
      contents: contentPrompt,
      config: { 
        tools: [{ googleSearch: {} }],
        // 如果是 Pro 版則開啟思考預算，生成更專業的深度內容
        thinkingConfig: (canThink && isPro) ? { thinkingBudget: 15000 } : undefined
      }
    }));

    const postContent = contentResp.text;
    
    // 3. 發送至 Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: postContent })
      });
      console.log("✅ 專業深度報告已發布 📡");
    }

    // 4. 配圖指令 (輔助發文)
    const imagePromptResp = await retryOperation(() => ai.models.generateContent({
      model: PREFERRED_MODEL,
      contents: `Create a professional Midjourney prompt (English) for: "${topic}". Cinematic, financial data visual, high-tech --ar 16:9`,
    }));
    
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🎨 [AI 配圖建議]\n\n\`${imagePromptResp.text.trim()}\`` })
      });
    }

    console.log("🎉 任務成功完成！");
  } catch (error) {
    console.error("❌ 錯誤:", error);
    process.exit(1);
  }
}

run();