import { GoogleGenAI } from "@google/genai";
import process from "node:process";

// 1. 初始化設定
const API_KEY = process.env.API_KEY;
// Telegram 設定
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
// 強制模式 (透過 GitHub Actions 輸入傳入): 'morning' | 'evening' | undefined
const FORCE_MODE = process.env.FORCE_MODE ? process.env.FORCE_MODE.trim().toLowerCase() : null;

// 定義與前端一致的風格列表
const IMAGE_STYLES = [
  'Cyberpunk (賽博龐克)',
  'Minimalist (極簡主義)',
  '3D Isometric (3D 等距)',
  'Editorial (新聞插畫)',
  'Abstract Data (抽象數據)',
  'Photorealistic (寫實攝影)'
];

if (!API_KEY) {
  console.error("❌ 缺少 API_KEY。請檢查 GitHub Secrets 設定。");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * 強化版重試機制 (Robust Retry)
 * 針對 Google 503 Overloaded 錯誤進行高強度重試
 * 最大重試: 10 次 (約可覆蓋 3-5 分鐘的當機時間)
 */
const retryOperation = async (operation, retries = 10, delay = 5000) => {
  try {
    return await operation();
  } catch (error) {
    const isOverloaded = error.message?.includes('503') || 
                         error.message?.includes('overloaded') || 
                         error.status === 503 ||
                         error.code === 503;
                         
    if (retries > 0 && isOverloaded) {
      console.warn(`⚠️ API 塞車中 (503 Overloaded)。將在 ${delay/1000} 秒後重試... (剩餘嘗試: ${retries} 次)`);
      
      // 等待
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 指數退避 (Exponential Backoff)，但設定上限為 60 秒
      const nextDelay = Math.min(delay * 1.5, 60000); 
      return retryOperation(operation, retries - 1, nextDelay);
    }
    throw error;
  }
};

// 2. 獲取並發送內容的主邏輯
async function run() {
  try {
    console.log("🚀 開始執行自動化發文流程...");
    
    // 取得台灣時間資訊
    const now = new Date();
    const options = { timeZone: "Asia/Taipei" };
    
    console.log(`🌍 Server UTC Time: ${now.toISOString()}`);
    console.log(`🇹🇼 Target Timezone: Asia/Taipei`);

    const today = now.toLocaleDateString("zh-TW", { ...options, year: 'numeric', month: 'long', day: 'numeric' });
    const weekday = now.toLocaleDateString("zh-TW", { ...options, weekday: 'long' });
    const timeStr = now.toLocaleTimeString("en-US", { ...options, hour: 'numeric', minute: 'numeric', hour12: false });
    
    // 使用 Intl.DateTimeFormat 確保獲取正確的當地小時數 (0-23)
    const hourFormatter = new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', hour12: false });
    const currentHour = parseInt(hourFormatter.format(now));
    
    console.log(`📅 日期: ${today} (${weekday})`);
    console.log(`🕒 台灣時間: ${currentHour} 點 (${timeStr})`);

    // ==========================================
    // 判斷早報/晚報 (支援強制模式)
    // ==========================================
    let isMorningSession = currentHour < 12;

    if (FORCE_MODE === 'morning') {
      console.log("⚡ [強制模式] 啟動：強制執行「早報」流程");
      isMorningSession = true;
    } else if (FORCE_MODE === 'evening') {
      console.log("⚡ [強制模式] 啟動：強制執行「晚報」流程");
      isMorningSession = false;
    } else {
      console.log(`🤖 [自動偵測]：當前為 ${isMorningSession ? '上午' : '下午'}，執行「${isMorningSession ? '早報' : '晚報'}」流程`);
    }

    // ==========================================
    // 定義早報與晚報的詳細腳本 (Script Structure)
    // ==========================================
    
    let reportTitleType = "";
    let marketFocusInstruction = "";
    let contentGenerationInstruction = "";

    const insightInstruction = `
      關於「深度觀點 (Deep Insight)」的寫作要求：
      - **核心目標**：提供一段豐富且具邏輯的分析 (約 100-150 字)。不要只寫新聞摘要。
      - **分析維度 (請涵蓋以下 2-3 點)**：
        1. **資金流向**：這筆錢從哪裡流出？流向哪裡？(例如：避險資金流向比特幣、或從傳產流向 AI)。
        2. **產業鏈連動**：這則新聞對上游/下游有什麼連鎖反應？(例如：輝達晶片賣得好 -> 台積電 CoWoS 產能吃緊 -> 測試介面廠受惠)。
        3. **預期修正**：市場原本預期什麼？現在這件事發生後，市場預期會怎麼改變？
      - **風格**：專業、犀利，像是避險基金經理人的內部備忘錄。
    `;

    if (isMorningSession) {
      // --- 早報設定 ---
      console.log(`🌞 執行目標: 🇺🇸 全球財經早報`);
      reportTitleType = "🇺🇸 全球財經早報";
      
      marketFocusInstruction = `
        🎯 搜尋重點 (早報 - 美股/全球):
        1. **美股收盤數據**: 昨天晚上的美股三大指數 (S&P 500, Nasdaq, Dow) 收盤表現。
        2. **全球/美國政策**: 聯準會 (Fed) 官員談話、利率決策、美國非農/CPI 數據、或拜登政府針對科技/晶片的最新禁令或補貼。
        3. **國際科技巨頭**: NVIDIA, Apple, Microsoft, Tesla, AMD 在美股盤中的表現與新聞。
        
        注意：現在是台灣早上，你要報導的是「剛結束的美國交易時段」。
      `;

      contentGenerationInstruction = `
        你是一位華爾街資深分析師。請針對「美股收盤」與「全球政策」撰寫早報。
        
        【寫作架構】：
        1. **標題**: [${reportTitleType}] + 具吸引力的核心主題 (例如：Fed 放鴿，科技股噴出)
        2. **美股收盤**: 列出 S&P500, Nasdaq 的漲跌幅 (精確到小數點後兩位)。
        3. **總經/政策**: 解釋為何發生此波動？(殖利率、通膨、地緣政治)。
        4. **巨頭動態**: 點評 1-2 檔關鍵美股 (如 NVDA, TSLA, AAPL)。
        5. **深度觀點 (Insight)**: ${insightInstruction}
        6. **今日展望**: 對稍後開盤的亞洲/台股市場的具體影響。
      `;

    } else {
      // --- 晚報設定 ---
      console.log(`🌙 執行目標: 🇹🇼 台灣/亞洲科技晚報`);
      reportTitleType = "🇹🇼 台灣/亞洲科技晚報";
      
      marketFocusInstruction = `
        🎯 搜尋重點 (晚報 - 台股/亞洲科技):
        1. **台股盤後分析**: 今日加權指數 (TWSE)、櫃買指數 (TPEX) 收盤狀況與外資動向。
        2. **台灣科技產業 (柯基分析)**: 
           - 重點鎖定：半導體供應鏈 (台積電、CoWoS、先進封裝)。
           - AI 伺服器供應鏈 (廣達、緯創、鴻海)。
           - IC 設計 (聯發科、瑞昱)。
        3. **亞洲市場連動**: 若日經 (Nikkei) 或韓股 (Kospi) 有大漲跌，請一併提及。
        
        注意：現在是台灣下午，你要報導的是「剛結束的亞洲/台灣交易時段」。
      `;

      contentGenerationInstruction = `
        你是一位專精於台灣半導體與科技供應鏈的產業分析師。請針對「台股盤後」與「科技產業」撰寫晚報。
        
        【寫作架構】：
        1. **標題**: [${reportTitleType}] + 具吸引力的核心主題 (例如：台積電領軍，AI 供應鏈齊揚)
        2. **台股數據**: 加權指數漲跌點數與成交量。
        3. **產業焦點**: 深入分析今日強勢族群 (AI 硬體、消費性電子、半導體設備)。
        4. **關鍵個股**: 點名 2-3 檔今日指標股的表現與新聞原因。
        5. **深度觀點 (Insight)**: ${insightInstruction}
        6. **籌碼/展望**: 外資態度與明日操作建議。
      `;
    }

    // 隨機選擇風格
    const randomStyle = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)];

    // 步驟 A: 找出時段熱點 (Trend Identification)
    console.log("🔍 [Step 1] 正在搜尋市場熱點...");
    const trendPrompt = `
      Current Date: ${today} (${weekday}).
      
      Based on the following instruction, identify the single most critical market topic right now:
      ${marketFocusInstruction}

      CONSTRAINTS:
      - Use Google Search to verify what actually happened in the specific session (US Close for morning, Taiwan Close for afternoon).
      - Return ONLY the topic name as a concise string (e.g., "NVIDIA財報創高", "台積電法說會", "聯準會降息一碼").
    `;
    
    // 使用強化版 retryOperation
    const trendResp = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: trendPrompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    }));
    
    let topic = trendResp.text.trim();
    topic = topic.replace(/^["']|["']$/g, '').replace(/^Topic:\s*/i, '').replace(/\.$/, '');
    
    if (!topic) throw new Error("無法獲取有效的主題");
    console.log(`✅ 鎖定主題: ${topic}`);

    // 步驟 B: 生成貼文 (Content Generation)
    console.log("✍️ [Step 2] 正在撰寫分析貼文...");
    const contentPrompt = `
      Current Date: ${today} (${weekday}).
      Topic: "${topic}"

      INSTRUCTION:
      ${contentGenerationInstruction}
      
      GENERAL RULES:
      - Language: Traditional Chinese (Taiwan).
      - Tone: Professional, Concise, Insightful.
      - Format: Use bullet points (•) for readability.
      - Length: Keep it under 600 words (to allow for richer insight).
      - Tags: Add relevant hashtags at the bottom (#Stock #Tech ...).
      - Data Accuracy: Use Google Search to ensure prices and percentages are from TODAY's session.
    `;

    // 使用強化版 retryOperation
    const contentResp = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentPrompt,
      config: { tools: [{ googleSearch: {} }] }
    }));

    const postContent = contentResp.text;
    
    // 步驟 C: 發送訊息 (Telegram)
    console.log("📨 [Step 3] 正在傳送 Telegram 訊息...");
    
    const promises = [];

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      promises.push(sendToTelegram(postContent).then(() => console.log("✅ Telegram 主文發送成功")));
    } else {
      console.log("⚠️ 未設定 Telegram Token，跳過發送。");
    }

    await Promise.all(promises);
    
    // 步驟 D: 生成 Image Prompt 並發送
    console.log("🎨 [Step 4] 正在生成 AI 繪圖指令...");
    const imagePromptResp = await retryOperation(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Create a high-quality Midjourney prompt (in English) to visualize: "${topic}". 
        Style: ${randomStyle}.
        Context: ${isMorningSession ? "Wall Street, US Policy, Global Finance" : "Taiwan Tech, Semiconductors, Futuristic Factory"}.
        Structure: Subject + Environment + Art Style + Lighting + --ar 16:9.
        Return ONLY the prompt string.
      `,
    }));
    
    const imagePrompt = `🎨 建議配圖指令 (${randomStyle}):\n\n\`${imagePromptResp.text.trim()}\``;
    
    const promptPromises = [];
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) promptPromises.push(sendToTelegram(imagePrompt));
    await Promise.all(promptPromises);

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
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
  });
  if (!response.ok) {
      const err = await response.text();
      console.error(`Telegram Send Failed: ${response.status} ${response.statusText}`, err);
  }
}

run();