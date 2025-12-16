import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GeneratedResult, Platform, GroundingSource } from "../types";

// Helper to lazily initialize the AI client
const getAiClient = (apiKey?: string) => {
  // Priority: Explicit key > Environment variable
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key 未設定。請點擊右上角「設定」按鈕輸入 Gemini API Key，或在專案 .env 檔案中設定。");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const getTrendingTopics = async (apiKey?: string): Promise<string[]> => {
  const today = new Date().toLocaleDateString("zh-TW", { year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `
    Identify 6 current trending specific keywords, stock tickers, or short news headlines for today (${today}).
    
    Focus Areas:
    1. Global Technology sector (AI, Semi, SaaS).
    2. Stock Markets: Mainly US & Taiwan, but also include major events in Japan, Europe, or Crypto if significant.
    
    Use the "Google Search" tool to ensure the data is absolutely real-time.
    
    Requirements:
    - Return ONLY the topics separated by a semicolon ';'.
    - Example Output: NVIDIA Blackwell;台積電法說;比特幣價格;日經指數新高;OpenAI Sora;聯準會降息
    - Do not add any introductory text, numbering, or bullet points.
    - Keep each topic concise (under 15 characters if possible).
  `;

  try {
    const ai = getAiClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

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
  const today = new Date().toLocaleDateString("zh-TW", { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // Logic to adjust instruction based on platform
  let formatInstruction = '';
  
  if (platform === Platform.InstantMessaging) {
    formatInstruction = `
      - Format: Optimized for Instant Messaging Apps (Line/Telegram).
      - Structure:
        1. Start with a catchy header like 【📊 市場快訊】 or 【🚀 科技重點】.
        2. Use bullet points (•) for readability on small screens.
        3. NO bold markdown (**text**) if possible, as Line does not support it well. Use bracket indicators instead like [重點].
        4. Keep it concise (under 400 words).
        5. End with a clear actionable thought or observation.
      - Emojis: Use generously to separate sections.
    `;
  } else {
    formatInstruction = `
      - Format: Optimized for ${platform}.
      - LinkedIn: Professional, structured (Hook -> Analysis -> Conclusion), use bullet points, moderate emojis.
      - Twitter/X: Concise, punchy, maybe a thread structure (1/x), hashtags.
      - Facebook: Engaging, slightly more conversational but still expert, questions to drive comments.
      - 方格子 (Vocus) / Blog: Longer form, detailed analysis, h2/h3 headers, clear structure. Use markdown for styling.
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
    2. Global Financial Markets (US, Taiwan, Japan, Europe, Crypto).
    
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.5, // Reduced temperature for better factual accuracy
      },
    });

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
      timestamp: new Date().toLocaleTimeString(),
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