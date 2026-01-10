import React, { useState, useEffect } from 'react';
import { GradeLevel, Subject, ChatMessage, ChatSession, SessionMode } from './types';
import { getAIResponse } from './geminiService';
import GradeSelector from './components/GradeSelector';
import ChatWindow from './components/ChatWindow';

const SUBJECT_DETAILS: Record<Subject, { icon: string }> = {
  'قرآن كريم': { icon: '🕋' }, 'تربية إسلامية': { icon: '🕌' }, 'لغة عربية': { icon: '🖋️' },
  'رياضيات': { icon: '📐' }, 'علوم': { icon: '🧪' }, 'دراسات اجتماعية': { icon: '🌍' },
  'جغرافيا': { icon: '🗺️' }, 'تاريخ': { icon: '📜' }, 'تربية وطنية': { icon: '🇾🇪' },
  'لغة إنجليزية': { icon: '🔤' }, 'إيمان': { icon: '✨' }, 'فقه وحديث': { icon: '📖' },
  'سيرة': { icon: '🐎' }, 'قراءة': { icon: '📚' }, 'نحو وصرف': { icon: '🔍' },
  'بلاغة': { icon: '🗣️' }, 'مجتمع': { icon: '👥' }, 'أحياء': { icon: '🧬' },
  'فيزياء': { icon: '⚡' }, 'كيمياء': { icon: '⚗️' }, 'نصوص وبلاغة': { icon: '📝' },
  'فلسفة ومنطق': { icon: '🧠' }, 'علم اجتماع': { icon: '🏘️' }, 'أخرى': { icon: '🪄' }
};

const DEV_WHATSAPP = "https://wa.me/967771075146";

const App: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [view, setView] = useState<'home' | 'select-grade' | 'select-subject' | 'chat'>('home');
  const [tempGrade, setTempGrade] = useState<GradeLevel | null>(null);
  const [activeMode, setActiveMode] = useState<SessionMode>('learn');

  useEffect(() => {
    const data = localStorage.getItem('sora_sessions_v2');
    if (data) {
      try {
        setSavedSessions(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      const savedChat = localStorage.getItem(`chat_${activeSession.id}`);
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } catch (e) {
          setMessages([]);
        }
      } else {
        setMessages([]);
        setTimeout(() => {
           handleSendMessage(activeSession.mode === 'test' ? "أهلاً بك! ابدأ اختباري في المنهج اليمني الآن." : "مرحباً يا أستاذ سورا، ساعدني في شرح درسي اليوم.", true);
        }, 100);
      }
      setView('chat');
    }
  }, [activeSession]);

  const startNewSession = (grade: GradeLevel, subject: Subject) => {
    const session: ChatSession = {
      id: `s_${Date.now()}`,
      title: `${subject}`,
      subject, grade, mode: activeMode,
      lastUpdate: Date.now()
    };
    const newList = [session, ...savedSessions];
    setSavedSessions(newList);
    localStorage.setItem('sora_sessions_v2', JSON.stringify(newList));
    setActiveSession(session);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
      const newList = savedSessions.filter(s => s.id !== sessionId);
      setSavedSessions(newList);
      localStorage.setItem('sora_sessions_v2', JSON.stringify(newList));
      localStorage.removeItem(`chat_${sessionId}`);
      if (activeSession?.id === sessionId) {
        goBackHome();
      }
    }
  };

  const clearAllHistory = () => {
    if (confirm('⚠️ هل أنت متأكد من مسح جميع المحادثات نهائياً؟')) {
      savedSessions.forEach(s => localStorage.removeItem(`chat_${s.id}`));
      setSavedSessions([]);
      localStorage.setItem('sora_sessions_v2', JSON.stringify([]));
      goBackHome();
    }
  };

  const goBackHome = () => {
    setActiveSession(null);
    setMessages([]);
    setView('home');
  };

  const handleSendMessage = async (textOverride?: string, isAuto: boolean = false) => {
    const text = textOverride || inputText;
    if (!text.trim() && !selectedImage) return;
    if (!activeSession) return;
    if (isTyping && !isAuto) return;

    let updatedHistory = [...messages];

    if (!isAuto) {
      const uMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text, image: selectedImage || undefined, timestamp: new Date() };
      updatedHistory = [...updatedHistory, uMsg];
      setMessages(updatedHistory);
      setInputText(''); 
      setSelectedImage(null);
    } else {
      const autoMsg: ChatMessage = { id: `auto_${Date.now()}`, role: 'user', text, timestamp: new Date() };
      updatedHistory = [autoMsg];
      setMessages(updatedHistory);
    }

    setIsTyping(true);
    try {
      const res = await getAIResponse(updatedHistory, activeSession.grade, activeSession.subject, activeSession.mode);
      const aMsg: ChatMessage = { id: `a_${Date.now()}`, role: 'model', text: res.text, timestamp: new Date(), sources: res.sources };
      
      setMessages(prev => {
        const finalMessages = [...prev, aMsg];
        localStorage.setItem(`chat_${activeSession.id}`, JSON.stringify(finalMessages));
        return finalMessages;
      });
    } catch (e: any) { 
      console.error(e);
      const errorMsg: ChatMessage = { id: `err_${Date.now()}`, role: 'model', text: "❌ فشل الاتصال. تأكد من إعداد API_KEY بشكل صحيح.", timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally { 
      setIsTyping(false); 
    }
  };

  const getSubjectsByGrade = (grade: GradeLevel): Subject[] => {
    // المنهج اليمني: الابتدائي
    if (grade.includes('ابتدائي')) {
      return ['قرآن كريم', 'تربية إسلامية', 'لغة عربية', 'رياضيات', 'علوم', 'دراسات اجتماعية'];
    }
    
    // المنهج اليمني: القسم الأدبي (ثاني وثالث ثانوي) - تقسيم دقيق
    if (grade === GradeLevel.SECONDARY_2_LIT || grade === GradeLevel.SECONDARY_3_LIT) {
      return [
        'قرآن كريم', 'إيمان', 'فقه وحديث', 'سيرة', // تفصيل التربية الإسلامية
        'نحو وصرف', 'قراءة', 'نصوص وبلاغة', // تفصيل اللغة العربية
        'لغة إنجليزية', 'تاريخ', 'جغرافيا', 'علم اجتماع', 'فلسفة ومنطق'
      ];
    }
    
    // المنهج اليمني: القسم العلمي (ثاني وثالث ثانوي)
    if (grade.includes('علمي')) {
      return ['قرآن كريم', 'تربية إسلامية', 'لغة عربية', 'لغة إنجليزية', 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء'];
    }
    
    // المنهج اليمني: الإعدادي وأول ثانوي
    return ['قرآن كريم', 'تربية إسلامية', 'لغة عربية', 'لغة إنجليزية', 'رياضيات', 'علوم', 'تاريخ', 'جغرافيا', 'مجتمع'];
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center overflow-hidden p-0 sm:p-4">
      <div className="glass-card w-full max-w-6xl h-full flex flex-col md:flex-row overflow-hidden border-0 sm:border sm:border-white/40 sm:rounded-[2.5rem] shadow-2xl relative">
        
        {/* Sidebar (Desktop Only) */}
        <div className="hidden md:flex w-72 bg-indigo-950/40 backdrop-blur-xl p-6 flex-col text-white shrink-0 border-l border-white/10">
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🇾🇪</div>
            <h1 className="font-black text-xl tracking-tighter">الأستاذ سورا</h1>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide no-select">
            <div className="flex items-center justify-between mb-2 px-2">
               <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">محادثاتك</h3>
               {savedSessions.length > 0 && (
                 <button onClick={clearAllHistory} className="text-[10px] text-red-400 hover:text-red-200 font-black transition-colors">مسح الكل</button>
               )}
            </div>
            {savedSessions.length === 0 ? (
              <p className="text-[10px] text-white/30 text-center py-10">السجل فارغ</p>
            ) : (
              savedSessions.map(s => (
                <div key={s.id} className="group relative px-2">
                  <button onClick={() => setActiveSession(s)} className={`w-full text-right p-4 rounded-2xl transition-all flex items-center gap-3 text-xs font-bold active:scale-95 ${activeSession?.id === s.id ? 'bg-white/20 border border-white/20' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}>
                    <span className="text-xl">{SUBJECT_DETAILS[s.subject]?.icon || '📚'}</span>
                    <div className="overflow-hidden flex-1">
                      <p className="truncate">{s.subject}</p>
                      <p className="text-[9px] text-indigo-300 opacity-60">{s.grade}</p>
                    </div>
                  </button>
                  <button onClick={(e) => deleteSession(e, s.id)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-red-500/20 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <a href={DEV_WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600/80 hover:bg-emerald-600 p-4 rounded-2xl text-[11px] font-black transition-all shadow-lg active:scale-95">
               <span>💬</span> تواصل مع المطور
            </a>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-white/10">
          {view === 'chat' && activeSession ? (
            <div className="flex flex-col h-full overflow-hidden">
              <header className="px-6 py-4 flex items-center justify-between border-b border-black/5 shrink-0 bg-white/80 backdrop-blur-xl z-30 sticky top-0">
                <div className="flex items-center gap-4">
                  <button onClick={goBackHome} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                  <div className="overflow-hidden">
                    <h2 className="text-sm font-black text-indigo-950 truncate">{activeSession.subject}</h2>
                    <p className="text-[10px] text-slate-500 font-bold truncate">{activeSession.grade}</p>
                  </div>
                </div>
                <button onClick={(e) => deleteSession(e, activeSession.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
              </header>
              <div className="flex-1 relative overflow-hidden bg-slate-50/30">
                <ChatWindow messages={messages} isTyping={isTyping} />
              </div>
              <footer className="p-4 bg-white/90 border-t border-black/5 backdrop-blur-xl shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="max-w-4xl mx-auto">
                  {selectedImage && (
                    <div className="mb-2 relative inline-block animate-in zoom-in-95">
                      <img src={selectedImage} className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500 shadow-md" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  )}
                  <div className="flex items-end gap-3 bg-slate-100/80 p-2 rounded-2xl shadow-inner border border-black/5 focus-within:bg-white transition-all">
                    <label className="p-3 text-slate-400 cursor-pointer hover:text-indigo-600 active:scale-90 transition-all"><input type="file" className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f);}}} /><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></label>
                    <textarea value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="أجب على السؤال أو اسأل الأستاذ..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold resize-none p-2 min-h-[44px] max-h-32" rows={1} onKeyDown={(e)=>e.key==='Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} />
                    <button onClick={()=>handleSendMessage()} disabled={isTyping || (!inputText.trim() && !selectedImage)} className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-slate-300 active:scale-95 transition-all shrink-0">{isTyping ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"/> : <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}</button>
                  </div>
                </div>
              </footer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide px-6 py-8 md:p-12">
              {view === 'home' && (
                <div className="flex flex-col items-center justify-start min-h-full space-y-10 animate-fade">
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2.2rem] flex items-center justify-center text-white text-5xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] animate-bounce shrink-0">👨‍🏫</div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-indigo-950 tracking-tighter">الأستاذ سورا</h2>
                    <p className="text-slate-600 font-bold text-xs md:text-lg italic">خبير المناهج الدراسية اليمنية</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-2">
                    <button onClick={()=>{setActiveMode('learn'); setView('select-grade');}} className="p-6 glass-card border-2 border-indigo-100 rounded-[2.5rem] hover:border-indigo-500 transition-all text-center group active:scale-95">
                      <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">📖</span>
                      <h3 className="text-xs md:text-lg font-black text-indigo-950 leading-tight">شرح الدروس</h3>
                    </button>
                    <button onClick={()=>{setActiveMode('test'); setView('select-grade');}} className="p-6 glass-card border-2 border-orange-100 rounded-[2.5rem] hover:border-orange-500 transition-all text-center group active:scale-95">
                      <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">✅</span>
                      <h3 className="text-xs md:text-lg font-black text-orange-950 leading-tight">اختبر نفسك</h3>
                    </button>
                  </div>

                  <div className="w-full max-w-2xl px-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/5 pb-2 px-2">
                       <h3 className="text-xs font-black text-indigo-950">المحادثات الأخيرة</h3>
                       {savedSessions.length > 0 && (
                         <button onClick={clearAllHistory} className="text-[10px] text-red-500 font-black px-3 py-1 bg-red-50 rounded-full hover:bg-red-100 transition-colors">مسح السجل</button>
                       )}
                    </div>
                    {savedSessions.length === 0 ? (
                      <div className="p-10 text-center glass-card rounded-3xl opacity-60">
                         <p className="text-xs font-bold text-slate-400">لا يوجد محادثات سابقة. ابدأ الآن!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-10">
                        {savedSessions.slice(0, 10).map(s => (
                          <div key={s.id} className="relative group">
                            <button onClick={() => setActiveSession(s)} className="w-full p-4 glass-card rounded-2xl flex items-center gap-3 text-right hover:border-indigo-500 transition-all active:scale-95 group/btn overflow-hidden pr-4 pl-12">
                              <span className="text-2xl shrink-0">{SUBJECT_DETAILS[s.subject]?.icon || '📚'}</span>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-black text-slate-800 truncate">{s.subject}</p>
                                <p className="text-[9px] text-slate-500 font-bold truncate">{s.grade}</p>
                              </div>
                            </button>
                            <button onClick={(e) => deleteSession(e, s.id)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 bg-red-100 text-red-600 rounded-xl md:opacity-0 md:group-hover:opacity-100 transition-all z-10 active:scale-90 shadow-sm border border-red-200">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'select-grade' && (
                <div className="animate-fade pb-10">
                  <button onClick={goBackHome} className="mb-8 flex items-center gap-2 text-indigo-600 font-black text-sm hover:translate-x-1 transition-transform"> <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> العودة للرئيسية</button>
                  <h3 className="text-2xl sm:text-3xl font-black text-indigo-950 mb-8 text-center underline decoration-indigo-200 underline-offset-8">في أي صف دراسي أنت؟</h3>
                  <GradeSelector onSelect={(g)=>{setTempGrade(g); setView('select-subject');}} />
                </div>
              )}

              {view === 'select-subject' && (
                <div className="animate-fade pb-10">
                  <button onClick={()=>setView('select-grade')} className="mb-8 flex items-center gap-2 text-indigo-600 font-black text-sm hover:translate-x-1 transition-transform"><svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> تغيير الصف</button>
                  <h3 className="text-2xl sm:text-3xl font-black text-indigo-950 mb-2 text-center">اختر المادة</h3>
                  <p className="text-center text-slate-500 font-bold mb-10 bg-indigo-50 inline-block px-4 py-1 rounded-full mx-auto w-fit block">المنهج اليمني: {tempGrade}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {tempGrade && getSubjectsByGrade(tempGrade).map(sub=>(
                      <button key={sub} onClick={()=>startNewSession(tempGrade, sub)} className="p-7 glass-card rounded-[2rem] border border-white/40 flex flex-col items-center gap-4 hover:bg-white hover:scale-105 hover:shadow-xl transition-all active:scale-95 group">
                        <span className="text-5xl group-hover:animate-bounce transition-all">{SUBJECT_DETAILS[sub]?.icon || '📚'}</span>
                        <span className="text-xs font-black text-slate-700 text-center leading-tight">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;