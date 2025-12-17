import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerateRequest, GeneratedResult, Platform, GroundingSource, AppSettings } from "../types";
import { sendToTelegram } from "./telegramService";

// Helper to lazily initialize the AI client
const getAiClient = (apiKey?: string) => {
  // Priority: Explicit key > Environment variable
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key 未設定。請點擊右上角「設定」按鈕輸入 Gemini API Key，或在專案 .env 檔案中設定。");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Helper function to retry operations on 503 (Overloaded) errors
 * Uses exponential backoff strategy
 */
const retryOperation = async <T>(
  operation: () => Promise<T>, 
  retries = 5, 
  delay = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isOverloaded = error.message?.includes('503') || 
                         error.message?.includes('overloaded') || 
                         error.status === 503 ||
                         error.code === 503;
                         
    if (retries > 0 && isOverloaded) {
      console.warn(`⚠️ API Overloaded (503). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2); // Double the delay for next retry
    }
    throw error;
  }
};

export const getTrendingTopics = async (apiKey?: string): Promise<string[]> => {
  const today = new Date().toLocaleDateString("zh-TW", { 
    timeZone: "Asia/Taipei",
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const prompt = `
    Identify 6 current trending specific keywords, stock tickers, or short news headlines for today (${today}).
    
    Focus Areas:
    1. Global Technology sector (AI, Semi, SaaS, EV).
    2. Stock Markets: Primary focus on US & Taiwan.
       - CRITICAL: Also include significant movers from Japan, Europe (e.g. ASML, SAP), or China if they impact the global tech supply chain.
    
    Use the "Google Search" tool to ensure the data is absolutely real-time.
    
    Requirements:
    - Return ONLY the topics separated by a semicolon ';'.
    - Example Output: NVIDIA Blackwell;台積電法說;比特幣價格;日經指數新高;ASML財報;聯準會降息
    - Do not add any introductory text, numbering, or bullet points.
    - Keep each topic concise (under 15 characters if possible).
  `;

  try {
    const ai = getAiClient(apiKey);
    
    // Wrap in retry logic
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    }));

    const text = response.text || "";
    // Clean up and split by semicolon, filter empty
    const topics = text.split(';')
      .map(t => t.trim().replace(/['"\[\]]/g, '')) // Remove quotes or brackets if model adds them
      .filter(t => t.length > 0)
      .slice(0, 6); // Cap at 6
    
    if (topics.length === 0) throw new Error("No topics found");
    return topics;

  } catch (error) {
    console.error("Trending fetch error:", error);
    // Fallback if API fails, allow UI to continue rendering
    return ["NVIDIA AI", "台積電", "比特幣", "美股大盤", "日經指數", "AI 手機"];
  }
};

export const generatePost = async (request: GenerateRequest, apiKey?: string): Promise<GeneratedResult> => {
  const { topic, platform, tone, imageStyle } = request;

  // Initialize client here to catch errors gracefully
  const ai = getAiClient(apiKey);

  // Get current date in a readable format for the AI
  const today = new Date().toLocaleDateString("zh-TW", { 
    timeZone: "Asia/Taipei",
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  // Logic to adjust instruction based on platform
  let formatInstruction = '';
  
  if (platform === Platform.InstantMessaging) {
    formatInstruction = `
      - Format: Optimized for Instant Messaging Apps (Telegram).
      - **VISUAL STYLE**: STRICTLY USE EMOJIS for bullet points. Do NOT use standard dots (•) or dashes (-).
      - Recommended Emojis: 🔹, 🔸, 🚀, 📉, 💡, ✅, 📌.
      - Structure:
        1. Start with a catchy header like 【📊 市場快訊】 or 【🚀 科技重點】.
        2. Use Emojis (e.g., 🔹) for every list item to improve readability on small screens.
        3. **CRITICAL**: Include a dedicated "Deep Insight (深度觀點)" section. 
           - Do NOT limit this to one sentence. 
           - Provide a rich analysis (3-4 sentences) explaining the structural impact, money flow, or supply chain ripple effects.
           - Tell the user "Why this matters" and "Who really benefits".
        4. Keep it concise (under 600 words).
        5. End with a clear actionable thought.
    `;
  } else {
    formatInstruction = `
      - Format: Optimized for ${platform}.
      - **VISUAL STYLE**: Use Emojis (🔹, 🔸, 🚀) instead of standard bullet points to make the post engaging.
      - LinkedIn: Professional, structured (Hook -> Analysis -> Deep Insight -> Conclusion).
      - Twitter/X: Concise, punchy, thread-like.
      - Facebook: Engaging, expert tone.
      - **CRITICAL**: For all platforms, include a "Deep Insight" paragraph that explains the "Why" and "So What" simply yet profoundly. Do not be superficial.
    `;
  }

  // Construct a specialized prompt for financial/tech context
  const systemInstruction = `
    You are a World-Class Senior Financial Analyst and Technology Expert.
    
    CURRENT CONTEXT:
    - Today's Date: ${today}.
    - When searching for "latest price" or "news", assume the user means relative to ${today} or the most recent market close.
    - STRICT DATE CHECK: Do NOT invent news for future dates. Verify the year and month.
    
    YOUR EXPERTISE:
    1. Technology Sector (AI, Semiconductors, SaaS, Hardware).
    2. Global Financial Markets (US, Taiwan, Japan, Europe, China, Crypto).
    
    YOUR WRITING STYLE:
    - Insightful: Do not just list facts. Explain the mechanism (e.g., "Yields up means tech valuation down because...").
    - **Global Perspective**: While focusing on US/Taiwan, explicitly link events to other regions if relevant (e.g., "ASML's drop in Netherlands dragged down US chip equipment stocks").
    - Accessible: Use simple analogies for complex financial concepts.
    - **Visuals**: You love using Emojis to organize points. You hate boring bullet points.
    
    YOUR TASK:
    1. Generate a high-quality post based on: "${topic}" using the "Google Search" tool for latest data.
    2. Generate an "Image Generation Prompt" suitable for Midjourney or DALL-E 3 that visualizes this topic.

    OUTPUT STRUCTURE:
    [The Content of the Post]
    ---IMAGE_PROMPT---
    [The English Image Prompt]

    CONTENT GUIDELINES:
    - Language: Traditional Chinese (繁體中文) for the post.
    - Style: ${tone}.
    ${formatInstruction}
    - Always cite recent events.
    - If the topic involves stock prices, verify the latest data.

    IMAGE PROMPT GUIDELINES:
    - Language: English (Must be in English).
    - Style: ${imageStyle}. 
    - Requirement: Ensure the prompt explicitly describes visuals matching this style.
    - Structure: Subject + Environment + Art Style + Lighting/Color + Aspect Ratio.
  `;

  const prompt = `Topic: "${topic}"`;

  try {
    // Wrap in retry logic
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.5, // Reduced temperature for better factual accuracy
      },
    }));

    const rawText = response.text || "無法生成內容，請稍後再試。";
    
    // Split content and image prompt
    const parts = rawText.split('---IMAGE_PROMPT---');
    const content = parts[0].trim();
    const imagePrompt = parts.length > 1 ? parts[1].trim() : undefined;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Fix Type Error: Explicitly cast filtered array to GroundingSource[]
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((source: GroundingSource | null): source is GroundingSource => source !== null);

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return {
      content,
      imagePrompt,
      sources: uniqueSources,
      timestamp: new Date().toLocaleString("zh-TW", { 
        timeZone: "Asia/Taipei",
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
      platform: platform 
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
       if (error.message.includes("API_KEY")) throw new Error("請檢查 API Key 是否正確設定。");
    }
    throw error;
  }
};

/**
 * 手動觸發自動發文流程 (模擬 daily-auto-post.mjs 的行為)
 * 供前端「設定」頁面的按鈕呼叫
 */
export const runManualAutoPost = async (settings: AppSettings, logCallback: (msg: string) => void) => {
  const ai = getAiClient(settings.geminiApiKey);

  logCallback("🚀 開始執行自動化模擬流程...");
  
  // 1. Determine Time Context
  const now = new Date();
  const options = { timeZone: "Asia/Taipei" };
  const today = now.toLocaleDateString("zh-TW", { ...options, year: 'numeric', month: 'long', day: 'numeric' });
  const weekday = now.toLocaleDateString("zh-TW", { ...options, weekday: 'long' });
  const currentHour = parseInt(now.toLocaleTimeString("en-US", { ...options, hour: 'numeric', hour12: false }));
  
  const isMorningSession = currentHour < 12;
  const reportType = isMorningSession ? "早報 (美股/政策)" : "晚報 (台股/科技)";
  logCallback(`🕒 偵測時間: ${currentHour}點 - 執行【${reportType}】模式`);

  // 2. Define Instructions (Mirrored from .mjs)
  const insightInstruction = `
    關於「深度觀點 (Deep Insight)」的寫作要求：
    - **核心目標**：提供一段豐富且具邏輯的分析 (約 80-120 字)。不要只寫新聞摘要。
    - **分析維度 (請涵蓋以下 2-3 點)**：
      1. **資金流向**：這筆錢從哪裡流出？流向哪裡？(例如：避險資金流向比特幣、或從傳產流向 AI)。
      2. **產業鏈連動**：這則新聞對上游/下游有什麼連鎖反應？(例如：輝達晶片賣得好 -> 台積電 CoWoS 產能吃緊 -> 測試介面廠受惠)。
      3. **預期修正**：市場原本預期什麼？現在這件事發生後，市場預期會怎麼改變？
    - **風格**：專業、犀利，像是避險基金經理人的內部備忘錄。
  `;

  let reportTitleType = "";
  let marketFocusInstruction = "";
  let contentGenerationInstruction = "";

  if (isMorningSession) {
     reportTitleType = "🇺🇸 全球財經早報";
     marketFocusInstruction = `
      🎯 搜尋重點 (早報 - 美股/全球):
      1. **美股收盤數據**: 昨天晚上的美股三大指數 (S&P 500, Nasdaq, Dow) 收盤表現。
      2. **全球/美國政策**: 聯準會 (Fed) 官員談話、美國經濟數據(CPI/NFP)。
      3. **國際市場**: 歐洲主要指數 (DAX, FTSE) 若有重大波動需提及。
      4. **國際科技巨頭**: NVIDIA, Apple, Microsoft, Tesla, AMD, ASML, TSMC ADR。
      注意：現在是台灣早上，你要報導的是「剛結束的美國交易時段」以及「歐洲收盤狀況」。
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
    reportTitleType = "🇹🇼 台灣/亞洲科技晚報";
    marketFocusInstruction = `
      🎯 搜尋重點 (晚報 - 台股/亞洲科技):
      1. **台股盤後分析**: 今日加權指數 (TWSE)、櫃買指數 (TPEX) 收盤狀況與外資動向。
      2. **台灣科技產業 (柯基分析)**: 
         - 重點鎖定：半導體供應鏈 (台積電、CoWoS、先進封裝)。
         - AI 伺服器供應鏈 (廣達、緯創、鴻海)。
      3. **亞洲市場連動**: 
         - 日本 (Nikkei): 半導體設備股 (Tokyo Electron)。
         - 韓國 (Kospi): 記憶體 (Samsung, SK Hynix)。
         - 中國/香港: 若有重大科技監管或經濟刺激政策。
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

  // 3. Find Trend
  logCallback("🔍 正在 AI 搜尋市場熱點...");
  const trendPrompt = `
    Current Date: ${today} (${weekday}).
    Based on the following instruction, identify the single most critical market topic right now:
    ${marketFocusInstruction}
    CONSTRAINTS:
    - Use Google Search to verify what actually happened in the specific session.
    - Return ONLY the topic name as a concise string.
  `;
  
  // Wrap in retry logic
  const trendResp = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: trendPrompt,
    config: { tools: [{ googleSearch: {} }], temperature: 0.3 }
  }));
  
  let topic = trendResp.text?.trim() || "今日市場重點";
  topic = topic.replace(/^["']|["']$/g, '').replace(/^Topic:\s*/i, '').replace(/\.$/, '');
  logCallback(`✅ 鎖定主題: ${topic}`);

  // 4. Generate Content
  logCallback("✍️ 正在撰寫深度分析貼文...");
  const contentPrompt = `
    Current Date: ${today} (${weekday}).
    Topic: "${topic}"
    INSTRUCTION:
    ${contentGenerationInstruction}
    GENERAL RULES:
    - Language: Traditional Chinese (Taiwan).
    - Tone: Professional, Concise, Insightful.
    - **VISUAL FORMAT**: Use Emojis (e.g., 🔹, 🔸, 🚀, 📉, 💡) as bullet points. Do NOT use standard dots (•).
    - Length: Keep it under 600 words.
    - Data Accuracy: Use Google Search.
  `;

  // Wrap in retry logic
  const contentResp = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contentPrompt,
    config: { tools: [{ googleSearch: {} }] }
  }));

  const postContent = contentResp.text || "";

  // 5. Send Messages
  logCallback("📨 準備發送訊息...");
  const errors: string[] = [];

  if (settings.telegramBotToken && settings.telegramChatId) {
    try {
      await sendToTelegram(settings.telegramBotToken, settings.telegramChatId, postContent);
      logCallback("✅ Telegram 主文發送成功");
    } catch (e) {
      errors.push(`TG Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  } else {
    logCallback("⚠️ Telegram 未設定，跳過");
  }

  // 6. Image Prompt
  logCallback("🎨 生成配圖指令中...");
  // Image prompt generation is less critical, maybe allow fail or retry fewer times?
  // Let's use standard retry for consistency.
  const imagePromptResp = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Create a high-quality Midjourney prompt (in English) for: "${topic}". 
      Style: Cyberpunk.
      Context: ${isMorningSession ? "Wall Street" : "Taiwan Tech"}.
      Return ONLY the prompt string.
    `,
  }));
  const imagePrompt = `🎨 建議配圖指令 (Cyberpunk):\n\n\`${(imagePromptResp.text || "").trim()}\``;

  if (settings.telegramBotToken && settings.telegramChatId) {
     await sendToTelegram(settings.telegramBotToken, settings.telegramChatId, imagePrompt).catch(() => {});
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  
  logCallback("🎉 模擬流程執行完畢！");
  return postContent;
};