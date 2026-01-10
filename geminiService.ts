import { GoogleGenAI } from "@google/genai";
import { GradeLevel, Subject, GroundingChunk, SessionMode, ChatMessage } from "./types";

export const getAIResponse = async (
  history: ChatMessage[],
  grade: GradeLevel, 
  subject: Subject,
  mode: SessionMode = 'learn'
): Promise<{ text: string, sources?: GroundingChunk[] }> => {
  
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("API_KEY is missing");
    return { text: "⚠️ خطأ: مفتاح الـ API غير موجود.\n\n- إذا كنت تستخدم Vercel: أضف API_KEY في Environment Variables.\n- إذا كنت تستخدم Termux: نفذ الأمر export API_KEY=مفتاحك قبل التشغيل." };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-2.5-flash-lite-latest";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      ...(msg.image ? [{ inlineData: { mimeType: "image/jpeg", data: msg.image.split(',')[1] } }] : []),
      { text: msg.text }
    ]
  }));

  const systemInstruction = `
    أنت "الأستاذ سورا"، خبير المناهج اليمنية.
    المرحلة: ${grade} | المادة: ${subject}
    أنت الآن في وضع: ${mode === 'learn' ? 'الشرح التعليمي' : 'الاختبار التقييمي'}
    
    التعليمات:
    1. التزم بمنهج وزارة التربية والتعليم في اليمن.
    2. كن مشجعاً وودوداً جداً مع الطالب.
    3. استخدم الرموز التعبيرية (Emoji) بكثرة.
    4. في وضع الاختبار، اطرح سؤالاً واحداً فقط في كل مرة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    return { 
      text: text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    let errorMessage = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    const errStr = error.toString();
    
    if (errStr.includes("403")) errorMessage = "⚠️ خطأ 403: مفتاح الـ API غير صالح أو منطقتك الجغرافية محظورة (جرب VPN).";
    if (errStr.includes("429")) errorMessage = "⚠️ ضغط كبير على الخدمة، انتظر دقيقة وحاول مجدداً.";
    
    return { text: errorMessage };
  }
};