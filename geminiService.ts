
import { GoogleGenAI } from "@google/genai";
import { GradeLevel, Subject, GroundingChunk, SessionMode, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIResponse = async (
  history: ChatMessage[],
  grade: GradeLevel, 
  subject: Subject,
  mode: SessionMode = 'learn',
  useSearch: boolean = false
): Promise<{ text: string, sources?: GroundingChunk[] }> => {
  
  const model = "gemini-3-pro-preview";
  
  // تحويل تاريخ الرسائل لصيغة يفهمها Gemini
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      ...(msg.image ? [{ inlineData: { mimeType: "image/jpeg", data: msg.image.split(',')[1] } }] : []),
      { text: msg.text }
    ]
  }));

  const curriculumFocus = `
    أنت "الأستاذ سورا"، خبير المنهج اليمني.
    المرحلة: ${grade}
    المادة: ${subject}
    
    يجب أن تلتزم كلياً بمواضيع كتاب الوزارة اليمني لهذا الصف.
  `;

  let modeInstruction = "";
  if (mode === 'test') {
    modeInstruction = `
      أنت الآن في "وضع الاختبار":
      1. انظر لآخر سؤال طرحته (إذا وجد في التاريخ).
      2. إذا كانت رسالة الطالب الأخيرة هي "إجابة" على سؤالك:
         - قيم الإجابة فوراً (صح ✅ أو خطأ ❌).
         - اشرح لماذا هي صحيحة أو خاطئة بناءً على المنهج اليمني.
         - ثم اطرح السؤال التالي.
      3. إذا لم يكن هناك سؤال سابق، ابدأ بطرح السؤال الأول في موضوع محدد من منهج ${subject} لصف ${grade}.
      4. لا تطرح أكثر من سؤال واحد في المرة الواحدة.
    `;
  } else {
    modeInstruction = `
      أنت في "وضع الشرح":
      - اشرح المفاهيم بتبسيط.
      - ساعد في حل المسائل والواجبات.
      - اربط المعلومات بالحياة اليومية في اليمن.
    `;
  }

  const systemInstruction = `
    ${curriculumFocus}
    ${modeInstruction}
    - لهجتك ودودة ومشجعة.
    - إذا سألك الطالب عن شيء من خارج منهج ${grade}، اعتذر بلطف وركز على مقرره.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    return { 
      text: response.text || "عذراً، حدث خطأ في معالجة الإجابة.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
