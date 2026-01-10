
import { GoogleGenAI } from "@google/genai";
import { GradeLevel, Subject, GroundingChunk, SessionMode, ChatMessage } from "./types";

export const getAIResponse = async (
  history: ChatMessage[],
  grade: GradeLevel, 
  subject: Subject,
  mode: SessionMode = 'learn',
  imagePart?: { data: string, mimeType: string }
): Promise<{ text: string, sources?: GroundingChunk[] }> => {
  
  if (!process.env.API_KEY) return { text: "⚠️ خطأ فني: يرجى التواصل مع الإدارة." };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = "gemini-3-pro-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [
      { text: msg.text },
      ...(msg.image ? [{ inlineData: { data: msg.image.split(',')[1], mimeType: 'image/jpeg' } }] : [])
    ]
  }));

  if (imagePart) {
    const lastMsg = contents[contents.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      lastMsg.parts.push({
        inlineData: { data: imagePart.data, mimeType: imagePart.mimeType }
      });
    }
  }

  // Strict Track Enforcement
  const isScientific = grade.includes('علمي');
  const isLiterary = grade.includes('أدبي');
  const trackInfo = isScientific ? "القسم العلمي" : isLiterary ? "القسم الأدبي" : "التعليم الأساسي";

  let modeSpecificInstruction = "";
  if (mode === 'learn') {
    modeSpecificInstruction = `
      الوضع الحالي: [شرح الدروس].
      مهمتك: شرح وتبسيط المنهج اليمني. التزم بمحتوى ${trackInfo} فقط.
    `;
  } else if (mode === 'test') {
    modeSpecificInstruction = `
      الوضع الحالي: [اختبار قياسي].
      مهمتك: تقييم الطالب بأسئلة متنوعة ضمن منهج ${subject} لصف ${grade}.
    `;
  } else if (mode === 'ministerial') {
    modeSpecificInstruction = `
      الوضع الحالي: [الأتمتة الوزارية OMR].
      مهمتك: تقديم نماذج اختبارات وزارية يمنية نهائية بنظام الأتمتة.
      قاعدة ذهبية: يجب أن تكون جميع الأسئلة بنظام الاختيار من متعدد، وتكون الخيارات مرقمة بـ (أ، ب، ج، د) حصراً.
      تأكد أن الأسئلة مطابقة تماماً لمستوى الصعوبة وتوزيع الدرجات في امتحانات الشهادة (تاسع أو ثالث ثانوي) في اليمن.
    `;
  }

  const systemInstruction = `
    أنت "الأستاذ سورا"، خبير المنهج اليمني الأول.
    المرحلة: ${grade} | المسار: ${trackInfo} | المادة: ${subject}
    ${modeSpecificInstruction}

    قواعد عامة:
    - الهوية: جميع الحقوق محفوظة لـ Waleed Mohammed.
    - المنهج: يمني رسمي (صنعاء وعدن).
    - الأسلوب: مهني، دقيق، ومشجع للطالب.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: { 
        systemInstruction, 
        temperature: mode === 'ministerial' ? 0.2 : 0.7, 
        tools: [{ googleSearch: {} }]
      },
    });
    
    return { 
      text: response.text || "عذراً، لم أستطع معالجة هذا الطلب.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
    };
  } catch (e: any) {
    console.error(e);
    return { text: "⚠️ هناك ضغط على الخدمة، يرجى المحاولة بعد لحظات." };
  }
};
