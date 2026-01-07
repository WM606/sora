
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GradeLevel, Subject, ChatMessage, ChatSession } from './types';
import { getAIResponse } from './geminiService';
import GradeSelector from './components/GradeSelector';
import ChatWindow from './components/ChatWindow';

const SUBJECT_DETAILS: Record<Subject, { icon: string, color: string }> = {
  'قرآن كريم': { icon: '🕋', color: 'bg-emerald-600' },
  'تربية إسلامية': { icon: '🕌', color: 'bg-teal-600' },
  'لغة عربية': { icon: '🖋️', color: 'bg-amber-600' },
  'رياضيات': { icon: '📐', color: 'bg-blue-500' },
  'علوم': { icon: '🧪', color: 'bg-green-500' },
  'فيزياء': { icon: '⚡', color: 'bg-cyan-600' },
  'كيمياء': { icon: '⚗️', color: 'bg-rose-500' },
  'أحياء': { icon: '🧬', color: 'bg-lime-600' },
  'لغة إنجليزية': { icon: '🔤', color: 'bg-purple-500' },
  'دراسات اجتماعية': { icon: '🌍', color: 'bg-orange-500' },
  'أخرى': { icon: '✨', color: 'bg-slate-500' }
};

const STORAGE_PREFIX = 'sora_session_v25_';
const SESSIONS_LIST_KEY = 'sora_index_v25';
const WHATSAPP_LINK = 'https://wa.me/967771075146';

const App: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [view, setView] = useState<'home' | 'select-grade' | 'select-subject' | 'chat'>('home');
  const [tempGrade, setTempGrade] = useState<GradeLevel | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(SESSIONS_LIST_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setSavedSessions(parsed.sort((a: any, b: any) => b.lastUpdate - a.lastUpdate));
      } catch (e) {
        setSavedSessions([]);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      const key = `${STORAGE_PREFIX}${activeSession.id}`;
      const savedChat = localStorage.getItem(key);
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(parsed);
        } catch (e) {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      setView('chat');
    }
  }, [activeSession]);

  useEffect(() => {
    if (activeSession && messages.length > 0) {
      const key = `${STORAGE_PREFIX}${activeSession.id}`;
      localStorage.setItem(key, JSON.stringify(messages));
      
      const updated = savedSessions.map(s => 
        s.id === activeSession.id ? { ...s, lastUpdate: Date.now() } : s
      );
      setSavedSessions(updated);
      localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(updated));
    }
  }, [messages, activeSession]);

  const startNewLesson = (grade: GradeLevel, subject: Subject) => {
    const sessionId = `lesson_${Date.now()}`;
    const newSession: ChatSession = {
      id: sessionId,
      title: `${subject} - ${grade}`,
      subject,
      grade,
      lastUpdate: Date.now()
    };

    const newList = [newSession, ...savedSessions];
    setSavedSessions(newList);
    localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(newList));
    setActiveSession(newSession);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("هل تريد حذف سجل هذا الدرس نهائياً؟")) {
      localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
      const updated = savedSessions.filter(s => s.id !== id);
      setSavedSessions(updated);
      localStorage.setItem(SESSIONS_LIST_KEY, JSON.stringify(updated));
      if (activeSession?.id === id) {
        setActiveSession(null);
        setView('home');
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !activeSession || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText || (selectedImage ? "اشرح لي هذه الصورة" : ""),
      image: selectedImage || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    const currentImage = selectedImage;
    const searchEnabled = useSearch;
    
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);
    setError(null);

    try {
      const { text, sources } = await getAIResponse(
        currentInput || "اشرح محتوى الصورة",
        activeSession.grade,
        activeSession.subject,
        currentImage || undefined,
        searchEnabled
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date(),
        sources: sources,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setError("فشل الاتصال بالأستاذ سورا.");
    } finally {
      setIsTyping(false);
    }
  };

  if (view === 'chat' && activeSession) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <header className="bg-white border-b border-indigo-100 px-4 py-3 shadow-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActiveSession(null); setView('home'); }} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-indigo-600"
            >
              <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="text-right">
              <h1 className="font-black text-indigo-950 text-xs md:text-sm leading-none flex items-center gap-2">
                {SUBJECT_DETAILS[activeSession.subject].icon} {activeSession.subject}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{activeSession.grade}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href={WHATSAPP_LINK} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-black hover:bg-emerald-100 transition-all"
            >
              دعم واتساب
            </a>
            <button onClick={() => {if(window.confirm('مسح محادثة هذا الدرس؟')){setMessages([]); localStorage.removeItem(`${STORAGE_PREFIX}${activeSession.id}`);}}} className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">مسح</button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <ChatWindow messages={messages} isTyping={isTyping} />
        </main>

        <footer className="bg-white border-t border-indigo-50 p-4 pb-6 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-3">
            {selectedImage && (
              <div className="relative inline-block animate-in zoom-in-90">
                <img src={selectedImage} className="w-16 h-16 rounded-xl border-2 border-indigo-500 object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}
            <div className="flex items-center justify-between">
               <button onClick={() => setUseSearch(!useSearch)} className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${useSearch ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                 {useSearch ? 'البحث نشط' : 'تفعيل البحث'}
               </button>
               <span className="text-[9px] text-slate-400 font-bold italic">يتم الحفظ تلقائياً 💾</span>
            </div>
            <div className="flex items-end gap-2 bg-slate-100 rounded-3xl p-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <label className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer transition-transform hover:scale-110">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                   const file = e.target.files?.[0];
                   if(file){ const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
                }} />
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اسأل الأستاذ سورا..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 resize-none font-bold"
                rows={1}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              />
              <button onClick={handleSendMessage} disabled={(!inputText.trim() && !selectedImage) || isTyping} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-all shadow-md active:scale-90 disabled:bg-slate-300 flex-shrink-0">
                {isTyping ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/20 rounded-full -ml-40 -mb-40 blur-3xl"></div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden border-4 border-white/20 animate-fade-in flex flex-col md:flex-row min-h-[580px] z-10">
        
        {/* الجانب الأيمن: القائمة الجانبية */}
        <div className="md:w-72 bg-indigo-950 p-5 flex flex-col text-white">
          <div className="flex items-center justify-between mb-5">
             <h2 className="text-base font-black">أرشيف الدروس 📚</h2>
             <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg">{savedSessions.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
            {savedSessions.length === 0 ? (
              <div className="text-center py-12 opacity-30">
                <p className="text-[10px] font-bold italic">سجل دروسك فارغ حالياً</p>
              </div>
            ) : (
              savedSessions.map((s) => (
                <div key={s.id} className="group relative flex items-center gap-2 animate-in slide-in-from-right-2">
                  <button 
                    onClick={() => setActiveSession(s)}
                    className="flex-1 text-right p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all flex items-center gap-3 overflow-hidden"
                  >
                    <span className="text-xl flex-shrink-0">{SUBJECT_DETAILS[s.subject].icon}</span>
                    <div className="overflow-hidden">
                       <p className="text-[11px] font-black truncate">{s.subject}</p>
                       <p className="text-[9px] text-indigo-400 font-bold truncate">{s.grade}</p>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="p-2 bg-red-600/10 hover:bg-red-600 rounded-xl text-red-400 hover:text-white transition-all border border-red-600/10"
                    title="حذف"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
             <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="bg-emerald-600/20 text-emerald-400 p-3 rounded-2xl border border-emerald-600/30 font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all text-center">
                💬 تواصل واتساب
             </a>
          </div>
        </div>

        {/* الجانب الأيسر: منطقة الاختيار والبدء */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
            {view === 'home' && (
              <div className="text-center animate-in zoom-in-95 space-y-6">
                 <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl mx-auto border-4 border-white">🇾🇪</div>
                 <div className="space-y-2">
                   <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter">الأستاذ سورا</h1>
                   <p className="text-indigo-600 font-bold text-sm md:text-base">مساعدك التعليمي الذكي في المنهج اليمني</p>
                 </div>
                 <button 
                   onClick={() => setView('select-grade')}
                   className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                 >
                   <span>✨</span> بدء درس جديد
                 </button>
              </div>
            )}

            {view === 'select-grade' && (
              <div className="w-full max-w-lg flex flex-col h-full animate-in slide-in-from-left-4">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setView('home')} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-black text-sm">
                    <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    رجوع
                  </button>
                  <h3 className="text-base font-black text-slate-700">اختر صفك الدراسي:</h3>
                  <div className="w-10"></div>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-3xl border border-slate-100 p-2 shadow-inner scrollbar-hide mb-4">
                  <GradeSelector onSelect={(g) => { setTempGrade(g); setView('select-subject'); }} />
                </div>
              </div>
            )}

            {view === 'select-subject' && (
              <div className="w-full max-w-lg flex flex-col h-full animate-in slide-in-from-left-4">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setView('select-grade')} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-black text-sm">
                    <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    الصفوف
                  </button>
                  <div className="text-center">
                     <h3 className="text-sm font-black text-slate-700">اختر مادة الدرس:</h3>
                     <p className="text-[9px] text-indigo-500 font-black bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">{tempGrade}</p>
                  </div>
                  <div className="w-10"></div>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 p-1 scrollbar-hide mb-4">
                  {Object.keys(SUBJECT_DETAILS).map((sub) => (
                    <button
                      key={sub}
                      onClick={() => tempGrade && startNewLesson(tempGrade, sub as Subject)}
                      className="p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-[11px] hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 group shadow-sm"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{SUBJECT_DETAILS[sub as Subject].icon}</span>
                      <span className="text-slate-700">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* تذييل الصفحة الموحد داخل منطقة العمل */}
          <div className="p-6 border-t border-slate-50 text-center space-y-1">
             <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-300">
               <span>🇾🇪 الأستاذ سورا</span>
               <span>•</span>
               <span>تطوير: وليد محمد</span>
             </div>
             <p className="text-[8px] text-slate-200 font-bold uppercase tracking-widest">Sora Intelligent Learning Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
