
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerateRequest, GeneratedResult, GroundingSource, AppSettings, AIModel } from "../types";
import { sendToTelegram } from "./telegramService";

const getAiClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("❌ API Key 未設定。請點擊右上角「⚙️ 設定」輸入 API Key。");
  }
  return new GoogleGenAI({ apiKey: key });
};

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
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * 獲取即時熱搜關鍵字 - 已更新為強制繁體中文翻譯
 */
export const getTrendingTopics = async (apiKey?: string): Promise<string[]> => {
  const today = new Date().toLocaleDateString("zh-TW", { 
    timeZone: "Asia/Taipei",
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const prompt = `
    Identify 6 current trending keywords for today (${today}) in Global Tech/Stocks (US, TW, JP, EU). 
    
    CRITICAL INSTRUCTIONS:
    1. Output MUST be in Professional Traditional Chinese (Taiwan terminology).
    2. Example translations: 'Fed' -> '聯準會', 'Earnings' -> '財報', 'Weight stocks' -> '權值股'.
    3. Return ONLY semicolon separated strings. 
    4. Use 1-2 relevant emojis for each keyword.
  `;

  try {
    const ai = getAiClient(apiKey);
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.5 },
    }));

    const text = response.text || "";
    const topics = text.split(';').map(t => t.trim()).filter(t => t.length > 0).slice(0, 6);
    return topics.length > 0 ? topics : ["NVIDIA AI 領漲 🚀", "台積電 2330 展望 🏗️", "比特幣突破行情 🧡", "聯準會降息預期 🏦", "日經指數新高 🇯🇵", "AI 手機新趨勢 📱"];
  } catch (error) {
    return ["NVIDIA AI 領漲 🚀", "台積電 2330 展望 🏗️", "比特幣突破行情 🧡", "聯準會降息預期 🏦", "日經指數新高 🇯🇵", "AI 手機新趨勢 📱"];
  }
};

export const generatePost = async (request: GenerateRequest, apiKey?: string, modelPreference: AIModel = AIModel.Pro): Promise<GeneratedResult> => {
  const { topic, platform, tone } = request;
  const ai = getAiClient(apiKey);

  const isPro = modelPreference === AIModel.Pro;
  const canThink = modelPreference.includes('gemini-3') || modelPreference.includes('gemini-2.5');

  const systemInstruction = `
    You are a World-Class Senior Financial Analyst. 
    TASK: Write a professional analysis in Traditional Chinese (Taiwan) about "${topic}".
    
    CORE REQUIREMENT:
    - Use Google Search to find the latest real-time data, prices, or news.
    - If using Gemini 3 Pro, perform deep cross-referencing between search results.
    
    EMOJI RULES: 
    1. Every section must start with an emoji.
    2. Use 🚀 for growth, ⚠️ for risk, 💡 for insights.
    
    CONTENT STRUCTURE:
    - 🏷️ [標題]
    - 📊 [盤勢焦點] (包含最新數據)
    - 🔍 [重點解析] (條列核心新聞)
    - 💡 [深度洞察] (分析全球連動與資金邏輯，必須具備推理深度)
    - 🏁 [投資觀點] 
    
    ---IMAGE_PROMPT--- [English MJ prompt]
  `;

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: modelPreference,
      contents: `Topic: "${topic}", Tone: ${tone}. Use Google Search for the most recent updates.`,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: (canThink && isPro) ? { thinkingBudget: 16000 } : undefined,
        temperature: isPro ? 0.3 : 0.7,
      },
    }));

    const rawText = response.text || "無法生成內容";
    const parts = rawText.split('---IMAGE_PROMPT---');
    const content = parts[0].trim();
    const imagePrompt = parts.length > 1 ? parts[1].trim() : undefined;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((source: GroundingSource | null): source is GroundingSource => source !== null);

    return {
      content,
      imagePrompt,
      sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i),
      timestamp: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }),
      platform: platform 
    };
  } catch (error) {
    throw error;
  }
};

export const runManualAutoPost = async (settings: AppSettings, logCallback: (msg: string) => void) => {
  const ai = getAiClient(settings.geminiApiKey);
  const model = settings.preferredModel || AIModel.Pro;
  const isPro = model === AIModel.Pro;
  const canThink = model.includes('gemini-3') || model.includes('gemini-2.5');
  
  logCallback(`🚀 啟動專業引擎: ${model}`);
  
  const now = new Date();
  const options = { timeZone: "Asia/Taipei" };
  const currentHour = parseInt(now.toLocaleTimeString("en-US", { ...options, hour: 'numeric', hour12: false }));
  const isMorningSession = currentHour < 12;

  logCallback(`🕒 時段判斷: ${isMorningSession ? "🌅 晨間全球總結" : "🌇 亞洲/歐洲盤後分析"}`);

  const trendPrompt = `Use Google Search. Identify the single most critical tech/stock event for a ${isMorningSession ? "Morning" : "Evening"} report. Return only the topic in Traditional Chinese (Taiwan) with relevant emojis.`;
  
  const trendResp = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
    model: model,
    contents: trendPrompt,
    config: { 
      tools: [{ googleSearch: {} }], 
      temperature: 0.2,
      thinkingConfig: (canThink && isPro) ? { thinkingBudget: 8000 } : undefined
    }
  }));
  
  const topic = trendResp.text?.trim() || "市場熱點 📈";
  logCallback(`✅ 鎖定主題: ${topic}`);

  const contentPrompt = `Perform deep research on "${topic}". Write a professional analysis in Traditional Chinese (Taiwan). Must include latest numbers from Google Search.`;

  const contentResp = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
    model: model,
    contents: contentPrompt,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: (canThink && isPro) ? { thinkingBudget: 24000 } : undefined
    }
  }));

  const postContent = contentResp.text || "";
  if (settings.telegramBotToken && settings.telegramChatId) {
    await sendToTelegram(settings.telegramBotToken, settings.telegramChatId, postContent);
    logCallback("✅ 報告已發送至 Telegram 📡");
  }

  return postContent;
};
