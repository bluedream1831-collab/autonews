import { GoogleGenAI } from "@google/genai";
import process from "node:process";

// 1. 初始化設定
const API_KEY = process.env.API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 定義與前端一致的風格列表
const IMAGE_STYLES = [
  'Cyberpunk (賽博龐克)',
  'Minimalist (極簡主義)',
  '3D Isometric (3D 等距)',
  'Editorial (新聞插畫)',
  'Abstract Data (抽象數據)',
  'Photorealistic (寫實攝影)'
];

if (!API_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ 缺少必要的環境變數");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// 2. 獲取並發送內容的主邏輯
async function run() {
  try {
    console.log("🚀 開始執行自動化發文流程...");
    
    // 取得台灣時間資訊
    const now = new Date();
    const options = { timeZone: "Asia/Taipei" };
    const today = now.toLocaleDateString("zh-TW", { ...options, year: 'numeric', month: 'long', day: 'numeric' });
    const weekday = now.toLocaleDateString("zh-TW", { ...options, weekday: 'long' });
    const currentHour = parseInt(now.toLocaleTimeString("en-US", { ...options, hour: 'numeric', hour12: false }));
    
    // 判斷是早報還是晚報 (以中午 12 點為界線)
    const isMorningSession = currentHour < 12;
    
    // 設定不同時段的策略
    let marketFocus = "";
    let reportTitleType = "";
    
    if (isMorningSession) {
      console.log(`🌞 偵測為早報時段 (現在 ${currentHour} 點) - 鎖定美股與全球政策`);
      reportTitleType = "🇺🇸 全球財經早報";
      // 根據需求：美股為主 + 歐美政策 (美國優先)
      marketFocus = `
        Focus Areas (MORNING EDITION - GLOBAL & US):
        1. US Stock Market Analysis (S&P 500, Nasdaq, Dow Jones) - The session that JUST closed.
        2. Key Economic Policies & Central Bank Actions:
           - Priority: US Fed (Interest rates, Powell speeches, Inflation data).
           - Secondary: European policies (ECB) or geopolitical shifts affecting global markets.
        3. Global Tech Giants Watch (NVIDIA, Apple, Tesla, Microsoft).
        
        Note: Focus on how "Western policies" and "US Market performance" set the tone for the day.
      `;
    } else {
      console.log(`🌙 偵測為晚報時段 (現在 ${currentHour} 點) - 鎖定台股與亞洲科技`);
      reportTitleType = "🇹🇼 台灣/亞洲科技晚報";
      // 根據需求：亞洲股市(台灣為主) + 亞洲科技(台灣科技產業分析為主)
      marketFocus = `
        Focus Areas (AFTERNOON EDITION - ASIA & TAIWAN TECH):
        1. Taiwan Stock Market (TWSE/TPEX) Closing Review.
        2. DEEP DIVE: Taiwan Tech Industry Analysis (The "Asian Tech" Sector).
           - Focus on: Semiconductors (TSMC ecosystem), AI Servers, IC Design.
           - Look for: Supply chain news, monthly revenue reports, or tech breakthroughs.
        3. Asian Market Context: Brief mention of Japan (Nikkei) or Korea if they impacted Taiwan's tech sector today.
      `;
    }

    // 隨機選擇風格
    const randomStyle = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)];

    // 步驟 A: 找出時段熱點
    console.log("🔍 正在搜尋市場熱點...");
    const trendPrompt = `
      Current Date: ${today} (${weekday}).
      
      Identify the single most critical market driver based on the following focus:
      ${marketFocus}

      CONSTRAINTS:
      - STRICTLY check the date. 
      - If Morning: Report on the US close that happened a few hours ago (overnight Taipei time).
      - If Afternoon: Report on the Asian/Taiwan session that just finished today.
      - Return ONLY the topic name as a plain string.
    `;
    
    const trendResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: trendPrompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });
    
    let topic = trendResp.text.trim();
    // 清理多餘符號
    topic = topic.replace(/^["']|["']$/g, '').replace(/^Topic:\s*/i, '').replace(/\.$/, '');
    
    if (!topic) throw new Error("無法獲取有效的主題");
    console.log(`✅ 鎖定主題: ${topic}`);

    // 步驟 B: 生成貼文
    console.log("✍️ 正在撰寫分析貼文...");
    const contentPrompt = `
      You are a specialized Financial Bot creating a daily briefing for Telegram.
      
      CONTEXT:
      - Report Type: ${reportTitleType}
      - Today's Date: ${today} (${weekday}).
      - Topic: "${topic}".
      
      TASK:
      Write a concise, high-impact market update.
      Use Google Search to get the REAL-TIME data for this specific session.
      
      FORMAT FOR TELEGRAM:
      1. Header: ${reportTitleType} | ${topic}
      2. Time: Display the actual date/time of the event.
      3. Key Data: Bullet points with specific numbers (Prices, %, Revenue).
      4. Insight: Why this matters (Policy impact / Tech trend).
      5. Action: Bullish/Bearish/Wait sentiment.
      6. Tags: #Stock #Tech #${topic.replace(/\s+/g, '')}
      
      CONSTRAINTS:
      - Language: Traditional Chinese (Taiwan).
      - Length: Under 300 words.
      - No bold markdown (**), use brackets [] for emphasis.
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
    
    // 步驟 D: 生成 Image Prompt
    console.log("🎨 正在生成 AI 繪圖指令...");
    const imagePromptResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Create a high-quality Midjourney prompt (in English) to visualize: "${topic}". 
        Style: ${randomStyle}.
        Context: ${isMorningSession ? "US Market & Western Policy" : "Taiwan Tech Industry & Semiconductors"}.
        Structure: Subject + Environment + Art Style + Lighting + --ar 16:9.
        Return ONLY the prompt string.
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

// Telegram 發送函數
async function sendToTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
    })
  });

  if (!response.ok) {
    console.error(`Telegram Send Failed: ${response.statusText}`);
  }
}

run();