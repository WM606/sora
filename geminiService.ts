import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GradeLevel, Subject, GroundingChunk } from "./types";

// استخدم import.meta.env للوصول لمتغيرات البيئة في Vite
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const getAIResponse = async (
  prompt: string, 
  grade: GradeLevel, 
  subject: Subject,
  base64Image?: string,
  useSearch: boolean = false
): Promise<{ text: string, sources?: GroundingChunk[] }> => {

  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    أنت معلم خصوصي يمني ذكي وخبير جداً. اسمك "الاستاذ سورا".
    مهمتك الأساسية هي مساعدة الطالب في فهم الدروس وحل المشكلات التعليمية بناءً على **المنهج الدراسي اليمني** حصراً.
    المستوى الدراسي للطالب: ${grade}.
    المادة: ${subject}.

    القواعد الصارمة:
    1. التزم تماماً بمفاهيم ومصطلحات المنهج اليمني.
    2. إذا كان الطالب في المرحلة الابتدائية، استخدم لغة بسيطة جداً، مشجعة، واستخدم الرموز التعبيرية (Emojis).
    3. إذا كان الطالب في المرحلة الثانوية، كن أكثر تفصيلاً ودقة علمية ووضح كيفية الورود في الاختبارات الوزارية اليمنية إن أمكن.
    4. اشرح الحل خطوة بخطوة، لا تعطه الإجابة النهائية مباشرة.
    5. إذا أرسل صورة، قم بتحليلها بدقة واشرح ما فيها.
    6. استخدم لغة عربية فصيحة وبسيطة بلمسة ودودة تناسب الطالب اليمني.
    7. عند تفعيل البحث، اعتمد على المصادر الموثوقة التي تتحدث عن التعليم في اليمن.
  `;

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1] || base64Image
        }
      });
    }

    const config: any = {
      systemInstruction,
      temperature: 0.7,
      topP: 0.95,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config,
    });

    const text = response.text || "عذراً، لم أستطع توليد استجابة حالياً.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, sources };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("حدث خطأ في الاتصال بالاستاذ سورا. حاول مرة أخرى.");
  }
};
