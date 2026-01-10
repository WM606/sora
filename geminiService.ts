
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
    return { text: "⚠️ خطأ: مفتاح الـ API غير موجود. يرجى إعداده في ملف .env أو تصديره في تيرمكس عبر أمر export API_KEY=مفتاحك" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview"; // موديل أسرع وأكثر استقراراً للموبايل
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      ...(msg.image ? [{ inlineData: { mimeType: "image/jpeg", data: msg.image.split(',')[1] } }] : []),
      { text: msg.text }
    ]
  }));

  const systemInstruction = `
    أنت "الأستاذ سورا"، خبير المنهج اليمني.
    المرحلة: ${grade} | المادة: ${subject}
    
    التعليمات:
    1. التزم بمنهج وزارة التربية والتعليم في اليمن.
    2. في وضع التعلم (Learn): اشرح بتبسيط.
    3. في وضع الاختبار (Test): اطرح سؤالاً واحداً وقيم إجابة الطالب.
    4. استخدم الرموز التعبيرية لجعل الحوار ممتعاً.
    5. لا تجب على أسئلة خارج نطاق الدراسة.
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
    if (error.message?.includes("403")) errorMessage = "⚠️ خطأ 403: مفتاح الـ API غير صالح أو محظور.";
    if (error.message?.includes("429")) errorMessage = "⚠️ ضغط كبير على الخدمة، انتظر دقيقة وحاول مجدداً.";
    
    return { text: errorMessage };
  }
};
