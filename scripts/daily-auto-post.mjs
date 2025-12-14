import { GoogleGenAI } from "@google/genai";
import process from "node:process";

// 1. 初始化設定
const API_KEY = process.env.API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 定義與前端一致的風格列表，讓機器人隨機挑選
const IMAGE_STYLES = [
  'Cyberpunk (賽博龐克)',
  'Minimalist (極簡主義)',
  '3D Isometric (3D 等距)',
  'Editorial (新聞插畫)',
  'Abstract Data (抽象數據)',
  'Photorealistic (寫實攝影)'
];

if (!API_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ 缺少必要的環境變數 (API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// 2. 獲取並發送內容的主邏輯
async function run() {
  try {
    console.log("🚀 開始執行自動化發文流程...");
    
    const today = new Date().toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" });
    
    // 隨機選擇今日風格
    const randomStyle = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)];
    console.log(`🎨 今日隨機配圖風格: ${randomStyle}`);

    // 步驟 A: 找出今日熱點
    console.log("🔍 正在搜尋今日市場熱點...");
    const trendPrompt = `
      Identify the single most critical and impactful event happening TODAY (${today}) in the Global Tech (AI/Semi) or US/Taiwan Stock Market.
      Examples: "NVIDIA Earnings", "TSMC Monthly Revenue", "Fed Rate Decision", "Apple Product Launch".
      Requirement: Return ONLY the topic name as a plain string. No explanations.
    `;
    
    const trendResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: trendPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const topic = trendResp.text.trim();
    console.log(`✅ 鎖定主題: ${topic}`);

    // 步驟 B: 生成 Telegram 專用貼文
    console.log("✍️ 正在撰寫分析貼文...");
    const contentPrompt = `
      You are a specialized Financial Bot creating a daily briefing for Telegram.
      
      TASK:
      Write a concise, high-impact market update about: "${topic}".
      Use Google Search to get the specific numbers/data from today (${today}).
      
      FORMAT FOR TELEGRAM:
      1. Header: Use specific emoji + Title (e.g., 🚨 ${topic} 快訊).
      2. Key Data: Bullet points with numbers (Price changes, Revenue %, etc.).
      3. Insight: One sentence on why this matters.
      4. Action: Bullish/Bearish/Wait sentiment.
      5. Tags: #Stock #Tech #${topic.replace(/\s/g, '')}
      
      CONSTRAINTS:
      - Language: Traditional Chinese (Taiwan).
      - Length: Under 300 words.
      - No bold markdown (**), use brackets [] for emphasis.
      - Tone: Professional but engaging.
    `;

    const contentResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentPrompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const postContent = contentResp.text;
    
    // 步驟 C: 發送到 Telegram
    console.log("📨 正在傳送至 Telegram...");
    await sendToTelegram(postContent);
    
    // 步驟 D: 生成並發送 Image Prompt
    console.log("🎨 正在生成 AI 繪圖指令...");
    const imagePromptResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Create a high-quality Midjourney prompt (in English) to visualize this news topic: "${topic}". 
        
        Style Requirement: ${randomStyle}.
        
        Instructions:
        - Ensure the prompt explicitly describes visuals matching this style.
        - Structure: Subject + Environment + Art Style + Lighting/Color + Aspect Ratio (--ar 16:9).
        - Return ONLY the prompt string.
      `,
    });
    
    const imagePrompt = `🎨 建議配圖指令 (${randomStyle}):\n\n\`${imagePromptResp.text.trim()}\``;
    await sendToTelegram(imagePrompt);

    console.log("🎉 流程執行完畢！");

  } catch (error) {
    console.error("❌ 發生錯誤:", error);
    process.exit(1);
  }
}

// 3. Telegram 發送函數
async function sendToTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown' 
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error("Telegram API Error:", errData);
    // 不拋出錯誤，避免因為發送失敗導致整個 Action 顯示失敗 (若有需要可自行調整)
    console.error(`Telegram Send Failed: ${response.statusText}`);
  }
}

run();