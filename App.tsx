
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GradeLevel, Subject, ChatMessage, ChatSession, SessionMode, UserSubscription, ActivationCard, PlanOffer, AppSettings } from './types';
import { getAIResponse } from './geminiService';
import GradeSelector from './components/GradeSelector';
import ChatWindow from './components/ChatWindow';

const ADMIN_SECRET = "426624"; 
const FREE_MSG_LIMIT = 5;

const SUBJECT_ICONS: Record<string, string> = {
  'قرآن كريم': '🕋', 'تربية إسلامية': '🕌', 'علوم': '🧪', 'لغة عربية': '🖋️',
  'دراسات اجتماعية': '🌍', 'رياضيات': '📐', 'لغة إنجليزية': '🔤', 'فيزياء': '⚡', 'كيمياء': '⚗️',
  'أحياء': '🧬', 'تاريخ': '📜', 'جغرافيا': '🗺️', 'فلسفة ومنطق': '🧠', 'علم اجتماع': '👥', 'تربية وطنية': '🇾🇪'
};

const DEFAULT_PLANS: PlanOffer[] = [
  { 
    id: 'p1', 
    name: 'الباقة الماسية', 
    price: '4000', 
    durationDays: 30, 
    maxMessages: 500, 
    maxImages: 50, 
    maxWords: 50000, 
    color: 'indigo', 
    badge: 'الأكثر توفيراً',
    description: 'مثالية للطلاب الذين يرغبون في مراجعة شاملة لجميع الدروس مع الأستاذ سورا.',
    features: ['شرح المنهج كاملاً', 'فتح سجل المحادثات (PRO)', 'إرسال 50 صورة للواجبات', 'دعم فني سريع'] 
  },
  { 
    id: 'p2', 
    name: 'الباقة الملكية', 
    price: '9000', 
    durationDays: 60, 
    maxMessages: 2000, 
    maxImages: 200, 
    maxWords: 200000, 
    color: 'amber', 
    isPopular: true, 
    badge: 'باقة المتفوقين',
    description: 'الباقة الأقوى لطلاب الشهادات (9 و 12) مع ميزة الأتمتة الوزارية الشاملة.',
    features: ['الأتمتة الوزارية OMR', 'صلاحية لمدة شهرين', '2000 رسالة ذكاء اصطناعي', 'حل نماذج الامتحانات الوزارية'] 
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'select-grade' | 'select-subject' | 'chat' | 'admin' | 'billing' | 'sub-info'>('home');
  const [adminTab, setAdminTab] = useState<'stats' | 'cards' | 'offers' | 'ads'>('stats');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [tempGrade, setTempGrade] = useState<GradeLevel | null>(null);
  const [activeMode, setActiveMode] = useState<SessionMode>('learn');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const [plans, setPlans] = useState<PlanOffer[]>(DEFAULT_PLANS);
  const [cards, setCards] = useState<ActivationCard[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    announcement: "🔥 عرض الصيف: اشترك في الباقة الملكية واحصل على ميزات الأتمتة الوزارية مجاناً!",
    isMaintenance: false,
    supportNumber: "967771075146",
    showAds: true
  });

  const [subscription, setSubscription] = useState<UserSubscription>({ 
    planId: 'free', planName: 'مجانية', startDate: Date.now(),
    expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
    messagesUsed: 0, maxMessages: FREE_MSG_LIMIT, imagesUsed: 0, maxImages: 0, wordsUsed: 0, maxWords: 1000
  });

  const [activationCode, setActivationCode] = useState('');
  const isSubscribed = useMemo(() => subscription.planId !== 'free', [subscription]);

  // Admin Form States
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [manualCard, setManualCard] = useState({ code: '', name: 'باقة تفعيل', days: 30, messages: 1000, images: 100 });
  const [manualOffer, setManualOffer] = useState({ name: '', price: '', days: 30, msgs: 500, imgs: 50, color: 'indigo', popular: false, desc: '', features: '', badge: '' });

  useEffect(() => {
    const sCards = localStorage.getItem('sora_cards');
    if (sCards) setCards(JSON.parse(sCards));
    const sSub = localStorage.getItem('sora_sub');
    if (sSub) setSubscription(JSON.parse(sSub));
    const sSessions = localStorage.getItem('sora_sessions');
    if (sSessions) setSavedSessions(JSON.parse(sSessions));
    const sPlans = localStorage.getItem('sora_plans');
    if (sPlans) setPlans(JSON.parse(sPlans));
    const sSettings = localStorage.getItem('sora_settings');
    if (sSettings) setSettings(JSON.parse(sSettings));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleLogoutPlan = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج من الباقة والعودة للوضع المجاني؟')) {
      const freeSub = { 
        planId: 'free', planName: 'مجانية', startDate: Date.now(),
        expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 365,
        messagesUsed: 0, maxMessages: FREE_MSG_LIMIT, imagesUsed: 0, maxImages: 0, wordsUsed: 0, maxWords: 1000
      };
      setSubscription(freeSub);
      saveToStorage('sora_sub', freeSub);
      setView('home');
    }
  };

  const clearAllSessions = () => {
    if (confirm('هل تريد مسح جميع سجلات المحادثات نهائياً؟')) {
      savedSessions.forEach(s => localStorage.removeItem(`chat_${s.id}`));
      setSavedSessions([]);
      saveToStorage('sora_sessions', []);
    }
  };

  const handleAvatarClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      const nextCount = adminClicks + 1;
      if (nextCount >= 5) { setView('admin'); setAdminClicks(0); }
      else setAdminClicks(nextCount);
    } else { setAdminClicks(1); }
    setLastClickTime(now);
  };

  const handleSaveCard = () => {
    if (!manualCard.code) return alert("الكود مطلوب");
    let nextCards = [...cards];
    const cardData: ActivationCard = {
      code: manualCard.code.trim().toUpperCase(),
      isUsed: false, createdAt: Date.now(), planId: 'custom',
      details: { name: manualCard.name, durationDays: manualCard.days, maxMessages: manualCard.messages, maxImages: manualCard.images }
    };
    if (editingCard) {
      nextCards = nextCards.map(c => c.code === editingCard ? { ...c, ...cardData } : c);
      setEditingCard(null);
    } else {
      if (nextCards.find(c => c.code === cardData.code)) return alert("هذا الكود موجود مسبقاً");
      nextCards.push(cardData);
    }
    setCards(nextCards);
    saveToStorage('sora_cards', nextCards);
    setManualCard({ code: '', name: 'باقة تفعيل', days: 30, messages: 1000, images: 100 });
  };

  const handleSaveOffer = () => {
    if (!manualOffer.name || !manualOffer.price) return alert("الاسم والسعر مطلوبان");
    let nextPlans = [...plans];
    const offerData: PlanOffer = {
      id: editingOffer || Date.now().toString(),
      name: manualOffer.name, price: manualOffer.price,
      durationDays: manualOffer.days, maxMessages: manualOffer.msgs, maxImages: manualOffer.imgs,
      maxWords: 200000, color: manualOffer.color, isPopular: manualOffer.popular,
      description: manualOffer.desc, badge: manualOffer.badge,
      features: manualOffer.features.split(',').map(f => f.trim()).filter(f => f)
    };
    if (editingOffer) {
      nextPlans = nextPlans.map(p => p.id === editingOffer ? offerData : p);
      setEditingOffer(null);
    } else {
      nextPlans.push(offerData);
    }
    setPlans(nextPlans);
    saveToStorage('sora_plans', nextPlans);
    setManualOffer({ name: '', price: '', days: 30, msgs: 500, imgs: 50, color: 'indigo', popular: false, desc: '', features: '', badge: '' });
  };

  const openSession = (session: ChatSession) => {
    if (!isSubscribed) { setView('billing'); return; }
    setActiveSession(session);
    setActiveMode(session.mode);
    const savedMessages = localStorage.getItem(`chat_${session.id}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else { setMessages([]); }
    setView('chat');
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!isSubscribed) { setView('billing'); return; }
    if (!confirm('حذف هذه المحادثة؟')) return;
    const next = savedSessions.filter(s => s.id !== sessionId);
    setSavedSessions(next);
    saveToStorage('sora_sessions', next);
    localStorage.removeItem(`chat_${sessionId}`);
  };

  const useCard = () => {
    const card = cards.find(c => c.code === activationCode.toUpperCase() && !c.isUsed);
    if (!card) return alert("❌ الكود غير صحيح أو مستخدم مسبقاً");
    const nextSub: UserSubscription = {
      planId: card.planId, planName: card.details.name, startDate: Date.now(),
      expiryDate: Date.now() + (card.details.durationDays * 24 * 60 * 60 * 1000),
      messagesUsed: 0, maxMessages: card.details.maxMessages, imagesUsed: 0, maxImages: card.details.maxImages, wordsUsed: 0, maxWords: 200000
    };
    setSubscription(nextSub);
    saveToStorage('sora_sub', nextSub);
    const updatedCards = cards.map(c => c.code === card.code ? { ...c, isUsed: true } : c);
    setCards(updatedCards);
    saveToStorage('sora_cards', updatedCards);
    alert("🚀 تم تفعيل باقة البرو بنجاح!");
    setView('home');
  };

  const calculateTimeLeft = (expiry: number) => {
    const diff = expiry - Date.now();
    if (diff <= 0) return "منتهي";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} يوم و ${hours} ساعة`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage || isTyping) return;
    if (!isSubscribed && subscription.messagesUsed >= FREE_MSG_LIMIT) { setView('billing'); return; }
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: new Date(), image: selectedImage || undefined };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    const currentImg = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);
    try {
      const imgPart = currentImg ? { data: currentImg.split(',')[1], mimeType: 'image/jpeg' } : undefined;
      const res = await getAIResponse(newMsgs, activeSession!.grade, activeSession!.subject, activeSession!.mode, imgPart);
      const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', text: res.text, timestamp: new Date(), sources: res.sources };
      const finalMsgs = [...newMsgs, aiMsg];
      setMessages(finalMsgs);
      const updatedSessions = savedSessions.map(s => 
        s.id === activeSession!.id ? { ...s, lastUpdate: Date.now(), messageCount: finalMsgs.length, imageCount: finalMsgs.filter(m => m.image).length } : s
      );
      setSavedSessions(updatedSessions);
      saveToStorage('sora_sessions', updatedSessions);
      saveToStorage(`chat_${activeSession!.id}`, finalMsgs);
      setSubscription(prev => ({ ...prev, messagesUsed: prev.messagesUsed + 1, imagesUsed: currentImg ? prev.imagesUsed + 1 : prev.imagesUsed }));
    } catch (e) { alert("⚠️ خطأ في الاتصال."); } finally { setIsTyping(false); }
  };

  // Logic to show only 3 classes for ministerial mode
  const displayGrades = activeMode === 'ministerial' 
    ? [GradeLevel.MIDDLE_3, GradeLevel.SECONDARY_3_SCI, GradeLevel.SECONDARY_3_LIT]
    : Object.values(GradeLevel);

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center bg-slate-950 overflow-hidden font-sans rtl no-select">
      {settings.showAds && (
        <div className="w-full bg-indigo-900 text-white text-[10px] font-bold py-2 overflow-hidden whitespace-nowrap border-b border-indigo-700 z-50">
          <div className="animate-marquee inline-block px-4">{settings.announcement}</div>
        </div>
      )}

      <div className="w-full max-w-xl flex-1 flex flex-col bg-white overflow-hidden relative shadow-2xl">
        
        {view === 'admin' && (
          <div className="flex-1 overflow-y-auto bg-slate-900 text-white scrollbar-hide animate-fade flex flex-col pb-20">
            <header className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-50">
              <h2 className="text-xl font-black text-indigo-400">لوحة الإدارة - PRO</h2>
              <button onClick={() => { setView('home'); setAdminAuth(false); }} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black">خروج</button>
            </header>
            {!adminAuth ? (
              <div className="p-10 py-24 flex flex-col items-center space-y-8 text-center">
                <input type="password" placeholder="كود الإدارة" className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl text-center text-2xl w-full" onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.value === ADMIN_SECRET && setAdminAuth(true)} />
                <p className="text-slate-500 text-xs font-bold">أهلاً وليد، أدخل الرمز السري للتحكم في المنصة.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex bg-slate-800 p-1 sticky top-[77px] z-40">
                  <button onClick={() => setAdminTab('stats')} className={`flex-1 py-3 text-[9px] font-black rounded-lg ${adminTab === 'stats' ? 'bg-indigo-600' : ''}`}>الإحصائيات</button>
                  <button onClick={() => setAdminTab('cards')} className={`flex-1 py-3 text-[9px] font-black rounded-lg ${adminTab === 'cards' ? 'bg-indigo-600' : ''}`}>الكروت</button>
                  <button onClick={() => setAdminTab('offers')} className={`flex-1 py-3 text-[9px] font-black rounded-lg ${adminTab === 'offers' ? 'bg-indigo-600' : ''}`}>العروض</button>
                  <button onClick={() => setAdminTab('ads')} className={`flex-1 py-3 text-[9px] font-black rounded-lg ${adminTab === 'ads' ? 'bg-indigo-600' : ''}`}>الإعلانات</button>
                </div>
                <div className="p-6 space-y-8 animate-fade">
                   {adminTab === 'stats' && (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                           <p className="text-[10px] text-slate-400 mb-1">إجمالي الكروت</p>
                           <h4 className="text-4xl font-black">{cards.length}</h4>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                           <p className="text-[10px] text-slate-400 mb-1">العروض النشطة</p>
                           <h4 className="text-4xl font-black text-emerald-400">{plans.length}</h4>
                        </div>
                     </div>
                   )}
                   {adminTab === 'cards' && (
                     <div className="space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                           <h3 className="text-sm font-black text-indigo-400">{editingCard ? 'تعديل الكرت' : 'توليد كرت جديد'}</h3>
                           <input value={manualCard.code} onChange={e=>setManualCard({...manualCard, code: e.target.value})} placeholder="كود الكرت" className="w-full bg-black/30 p-3 rounded-xl text-xs" />
                           <div className="grid grid-cols-3 gap-2">
                              <input type="number" value={manualCard.messages} onChange={e=>setManualCard({...manualCard, messages: +e.target.value})} placeholder="رسائل" className="bg-black/30 p-3 rounded-lg text-[10px]" />
                              <input type="number" value={manualCard.images} onChange={e=>setManualCard({...manualCard, images: +e.target.value})} placeholder="صور" className="bg-black/30 p-3 rounded-lg text-[10px]" />
                              <input type="number" value={manualCard.days} onChange={e=>setManualCard({...manualCard, days: +e.target.value})} placeholder="أيام" className="bg-black/30 p-3 rounded-lg text-[10px]" />
                           </div>
                           <button onClick={handleSaveCard} className="w-full bg-indigo-600 py-3 rounded-xl font-black text-xs">{editingCard ? 'تحديث الكرت' : 'حفظ الكرت'}</button>
                           {editingCard && <button onClick={() => { setEditingCard(null); setManualCard({ code: '', name: 'باقة تفعيل', days: 30, messages: 1000, images: 100 }); }} className="w-full bg-slate-700 py-2 rounded-xl font-black text-[10px]">إلغاء التعديل</button>}
                        </div>
                        <div className="space-y-2">
                           {cards.map(c => (
                             <div key={c.code} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                                <div className="text-right">
                                   <span className="font-mono text-indigo-300 block">{c.code}</span>
                                   <p className="text-[8px] text-slate-500">{c.details.durationDays} يوم • {c.details.maxMessages} رسالة</p>
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className={`text-[9px] font-black px-2 py-1 rounded-full ${c.isUsed ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                      {c.isUsed ? 'مستخدم' : 'متاح'}
                                   </span>
                                   <div className="flex gap-2">
                                      <button onClick={() => { setEditingCard(c.code); setManualCard({ code: c.code, name: c.details.name, days: c.details.durationDays, messages: c.details.maxMessages, images: c.details.maxImages }); }} className="text-blue-400 text-[10px] font-black">تعديل</button>
                                      <button onClick={() => { if(confirm('حذف؟')) { const n = cards.filter(x=>x.code!==c.code); setCards(n); saveToStorage('sora_cards', n); } }} className="text-red-500 text-[10px] font-black">حذف</button>
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                   {adminTab === 'offers' && (
                     <div className="space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                           <h3 className="text-sm font-black text-emerald-400">{editingOffer ? 'تعديل العرض' : 'إدارة العروض والأسعار'}</h3>
                           <div className="grid grid-cols-2 gap-2">
                              <input value={manualOffer.name} onChange={e=>setManualOffer({...manualOffer, name: e.target.value})} placeholder="اسم الباقة" className="bg-black/30 p-3 rounded-lg text-xs" />
                              <input value={manualOffer.price} onChange={e=>setManualOffer({...manualOffer, price: e.target.value})} placeholder="السعر" className="bg-black/30 p-3 rounded-lg text-xs" />
                           </div>
                           <input value={manualOffer.badge} onChange={e=>setManualOffer({...manualOffer, badge: e.target.value})} placeholder="وسم العرض" className="w-full bg-black/30 p-3 rounded-lg text-[10px]" />
                           <textarea value={manualOffer.desc} onChange={e=>setManualOffer({...manualOffer, desc: e.target.value})} placeholder="وصف الباقة" className="w-full bg-black/30 p-3 rounded-lg text-[10px] h-16 resize-none" />
                           <input value={manualOffer.features} onChange={e=>setManualOffer({...manualOffer, features: e.target.value})} placeholder="المميزات (فصل بفاصلة ,)" className="w-full bg-black/30 p-3 rounded-lg text-[10px]" />
                           <div className="grid grid-cols-3 gap-2">
                               <input type="number" value={manualOffer.msgs} onChange={e=>setManualOffer({...manualOffer, msgs: +e.target.value})} placeholder="رسائل" className="bg-black/30 p-3 rounded-lg text-[10px]" />
                               <input type="number" value={manualOffer.days} onChange={e=>setManualOffer({...manualOffer, days: +e.target.value})} placeholder="أيام" className="bg-black/30 p-3 rounded-lg text-[10px]" />
                               <select value={manualOffer.color} onChange={e=>setManualOffer({...manualOffer, color: e.target.value})} className="bg-black/30 text-[10px] p-2 rounded">
                                  <option value="indigo">بنفسجي</option>
                                  <option value="amber">ذهبي</option>
                                  <option value="emerald">أخضر</option>
                               </select>
                           </div>
                           <button onClick={handleSaveOffer} className="w-full bg-emerald-600 py-3 rounded-xl font-black text-xs">{editingOffer ? 'تحديث الباقة' : 'حفظ الباقة الجديدة'}</button>
                           {editingOffer && <button onClick={() => { setEditingOffer(null); setManualOffer({ name: '', price: '', days: 30, msgs: 500, imgs: 50, color: 'indigo', popular: false, desc: '', features: '', badge: '' }); }} className="w-full bg-slate-700 py-2 rounded-xl font-black text-[10px]">إلغاء التعديل</button>}
                        </div>
                        <div className="space-y-2">
                           {plans.map(p => (
                             <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                                <span className="font-black text-xs">{p.name} - {p.price} ريال</span>
                                <div className="flex gap-4">
                                   <button onClick={() => { setEditingOffer(p.id); setManualOffer({ name: p.name, price: p.price, days: p.durationDays, msgs: p.maxMessages, imgs: p.maxImages, color: p.color, popular: p.isPopular||false, desc: p.description||'', features: p.features.join(','), badge: p.badge||'' }); }} className="text-blue-400 text-[10px] font-black">تعديل</button>
                                   <button onClick={() => { if(confirm('حذف؟')) { setPlans(plans.filter(x => x.id !== p.id)); saveToStorage('sora_plans', plans.filter(x => x.id !== p.id)); } }} className="text-red-500 text-[10px] font-black">حذف</button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                   {adminTab === 'ads' && (
                     <div className="space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                           <h3 className="text-sm font-black text-amber-400">إدارة الإعلانات والدعم</h3>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase">عرض شريط الإعلانات</span>
                              <button onClick={() => { setSettings({...settings, showAds: !settings.showAds}); saveToStorage('sora_settings', {...settings, showAds: !settings.showAds}); }} className={`w-10 h-5 rounded-full px-1 flex items-center ${settings.showAds ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                                 <div className="w-3 h-3 bg-white rounded-full"></div>
                              </button>
                           </div>
                           <textarea value={settings.announcement} onChange={e=>{setSettings({...settings, announcement: e.target.value}); saveToStorage('sora_settings', {...settings, announcement: e.target.value})}} className="w-full bg-black/30 p-4 rounded-xl text-xs h-32" />
                           <input value={settings.supportNumber} onChange={e=>{setSettings({...settings, supportNumber: e.target.value}); saveToStorage('sora_settings', {...settings, supportNumber: e.target.value})}} placeholder="رقم واتساب الدعم" className="w-full bg-black/30 p-3 rounded-xl text-xs" />
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'home' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-slate-50 scrollbar-hide animate-fade">
            <header className="flex justify-between items-center py-2">
               <div onClick={() => setView('sub-info')} className="bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black cursor-pointer shadow-lg active:scale-95 transition-all">
                 {subscription.planName} {isSubscribed ? '👑' : '⚡'}
               </div>
               <div className="flex gap-2">
                  <button onClick={() => window.open(`https://wa.me/${settings.supportNumber}`)} className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-md active:scale-90 transition-all">الدعم 💬</button>
                  <button onClick={() => setView('billing')} className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black shadow-md active:scale-90 animate-pulse">الباقات برو 💎</button>
               </div>
            </header>
            <div className="text-center space-y-4">
               <div onClick={handleAvatarClick} className="w-32 h-32 bg-indigo-600 rounded-[3rem] mx-auto flex items-center justify-center text-7xl shadow-2xl border-4 border-white cursor-pointer active:scale-95 transition-all">👨‍🏫</div>
               <div className="space-y-1">
                  <h1 className="text-4xl font-black text-indigo-950 tracking-tighter">الأستاذ سورا</h1>
                  <p className="text-indigo-600 font-bold text-[10px] bg-indigo-50 inline-block px-4 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">خبير المنهج اليمني 🇾🇪</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setActiveMode('learn'); setView('select-grade'); }} className="p-8 bg-white border-b-8 border-indigo-100 rounded-[2.5rem] shadow-xl space-y-3 active:scale-95 transition-all group">
                     <span className="text-5xl block group-hover:scale-110 transition-transform">📖</span>
                     <span className="text-xs font-black text-indigo-950">شرح الدروس</span>
                  </button>
                  <button onClick={() => { setActiveMode('test'); setView('select-grade'); }} className="p-8 bg-white border-b-8 border-emerald-100 rounded-[2.5rem] shadow-xl space-y-3 active:scale-95 transition-all group">
                     <span className="text-5xl block group-hover:scale-110 transition-transform">📝</span>
                     <span className="text-xs font-black text-emerald-950">اختبار قياسي</span>
                  </button>
               </div>
               <button onClick={() => isSubscribed ? (setActiveMode('ministerial'), setView('select-grade')) : setView('billing')} className={`p-8 rounded-[3rem] flex items-center justify-between px-10 shadow-2xl border-b-8 transition-all active:scale-95 ${isSubscribed ? 'bg-indigo-950 border-indigo-800 text-white' : 'bg-slate-200 border-slate-300 text-slate-400 grayscale'}`}>
                  <div className="text-right">
                    <h3 className="font-black text-xl flex items-center gap-2">الأتمتة الوزارية OMR {!isSubscribed && '🔒'}</h3>
                    <p className="text-[10px] font-bold opacity-70">نماذج الصف (9 و 12) المؤتمتة</p>
                  </div>
                  <span className="text-5xl">🏆</span>
               </button>
            </div>

            {savedSessions.length > 0 && (
               <div className="space-y-4 pb-20">
                  <div className="flex justify-between items-center px-4">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">السجل التعليمي (PRO)</h4>
                     <div className="flex gap-2">
                        {isSubscribed && (
                          <button onClick={clearAllSessions} className="bg-red-50 text-red-500 text-[9px] px-3 py-1 rounded-full font-black border border-red-100 hover:bg-red-500 hover:text-white transition-all">مسح السجل 🗑️</button>
                        )}
                        {!isSubscribed && <span className="bg-amber-100 text-amber-700 text-[9px] px-3 py-1 rounded-full font-black animate-pulse">ميزة مدفوعة 🔓</span>}
                     </div>
                  </div>
                  <div className="space-y-4">
                     {savedSessions.map(s => (
                       <div key={s.id} onClick={() => openSession(s)} className={`p-6 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] flex flex-col gap-4 shadow-xl cursor-pointer transition-all active:scale-95 relative overflow-hidden`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="text-4xl">{SUBJECT_ICONS[s.subject] || '📚'}</div>
                               <div className="text-right">
                                  <h5 className="font-black text-indigo-950 text-sm">{s.subject}</h5>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{s.grade}</p>
                               </div>
                            </div>
                            {isSubscribed && (
                               <button onClick={(e) => deleteSession(e, s.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-full text-lg shadow-sm hover:scale-110 active:scale-90 transition-all">🗑️</button>
                            )}
                          </div>
                          {!isSubscribed && <div className="absolute inset-0 bg-slate-100/30 flex items-center justify-center backdrop-blur-[2px]"><span className="text-2xl">🔒</span></div>}
                       </div>
                     ))}
                  </div>
               </div>
            )}
            <footer className="py-10 text-center opacity-40">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">جميع الحقوق محفوظة © Waleed Mohammed</p>
            </footer>
          </div>
        )}

        {view === 'select-grade' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 text-center animate-fade bg-white scrollbar-hide">
             <h3 className="text-2xl font-black text-indigo-950 pt-10">
               {activeMode === 'ministerial' ? 'اختر صف الشهادة 🎓' : 'في أي صف تدرس؟ 🎓'}
             </h3>
             <div className="grid grid-cols-2 gap-3 p-2">
               {displayGrades.map((grade) => (
                 <button key={grade} onClick={() => { setTempGrade(grade); setView('select-subject'); }} className="p-4 rounded-2xl border-2 transition-all text-xs font-black shadow-sm flex items-center justify-center text-center leading-tight bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 active:scale-95">{grade}</button>
               ))}
             </div>
             <button onClick={() => setView('home')} className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-14 py-4 rounded-3xl mb-10 shadow-sm active:scale-95 transition-all">الرجوع للرئيسية 🏠</button>
          </div>
        )}

        {view === 'select-subject' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8 text-center animate-fade bg-white scrollbar-hide">
             <h3 className="text-3xl font-black text-indigo-950 pt-10">اختر المادة التعليمية 📚</h3>
             <div className="grid grid-cols-2 gap-5 pb-10">
                {tempGrade && getSubjectsByGrade(tempGrade).map(sub => (
                  <button key={sub} onClick={() => {
                     const newSession: ChatSession = { id: Date.now().toString(), title: sub, subject: sub, grade: tempGrade, mode: activeMode, lastUpdate: Date.now(), messageCount: 1, imageCount: 0 };
                     setSavedSessions([newSession, ...savedSessions]);
                     saveToStorage('sora_sessions', [newSession, ...savedSessions]);
                     setActiveSession(newSession);
                     setMessages([{ id: 'w', role: 'model', timestamp: new Date(), text: `أهلاً بك! أنا الأستاذ سورا خبير مادة ${sub}. كيف يمكنني مساعدتك اليوم؟` }]);
                     setView('chat');
                  }} className="p-8 bg-white border-b-8 border-slate-100 rounded-[3.5rem] flex flex-col items-center gap-4 shadow-xl active:scale-95 transition-all group">
                     <span className="text-5xl group-hover:scale-110 transition-transform">{SUBJECT_ICONS[sub] || '📚'}</span>
                     <span className="font-black text-indigo-950 text-sm leading-tight">{sub}</span>
                  </button>
                ))}
             </div>
             <button onClick={() => setView('select-grade')} className="text-[11px] font-black text-white bg-slate-950 px-14 py-4 rounded-3xl mb-10 shadow-lg active:scale-95 transition-all">الرجوع لاختيار الصف ⬅️</button>
          </div>
        )}

        {view === 'chat' && activeSession && (
          <div className="flex flex-col h-full bg-slate-50 animate-fade">
             <header className="px-6 py-4 flex items-center justify-between bg-white shadow-md border-b z-30">
                <div className="flex items-center gap-3">
                   <button onClick={() => setView('home')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl text-xl active:scale-90 transition-all shadow-sm">⬅️</button>
                   <div className="text-right">
                      <h2 className="text-sm font-black text-indigo-950 leading-tight">{activeSession.subject}</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{activeSession.grade}</p>
                   </div>
                </div>
                <div className="bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-inner">
                   <span className="text-[10px] font-black text-indigo-600">💬 المتبقي: {subscription.maxMessages - subscription.messagesUsed}</span>
                </div>
             </header>
             <div className="flex-1 relative overflow-hidden"><ChatWindow messages={messages} isTyping={isTyping} /></div>
             <footer className="p-4 bg-white border-t z-30 shadow-2xl">
                <div className="flex items-end gap-3 bg-slate-100 p-2.5 rounded-[2.5rem] border-2 border-slate-200 shadow-inner">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                   }} />
                   <button onClick={() => isSubscribed ? fileInputRef.current?.click() : setView('billing')} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md active:scale-90 shrink-0 border border-indigo-50 ${isSubscribed ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                      <span className="text-2xl">{isSubscribed ? '📸' : '🔒'}</span>
                   </button>
                   <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="اسأل الأستاذ سورا..." className="flex-1 bg-transparent border-none focus:ring-0 font-bold p-3 text-sm text-right resize-none max-h-40 scrollbar-hide" rows={1} />
                   <button onClick={handleSendMessage} disabled={isTyping} className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl active:scale-90 shrink-0 transition-all">
                      {isTyping ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-xl">⬆️</span>}
                   </button>
                </div>
             </footer>
          </div>
        )}

        {view === 'billing' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-slate-50 scrollbar-hide animate-fade pb-10">
             <header className="text-center space-y-3 py-6 pt-12">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-md border-2 border-amber-200">💎</div>
                <h2 className="text-4xl font-black text-indigo-950 tracking-tighter">باقات التميز برو</h2>
                <p className="text-slate-400 font-bold text-xs px-10 leading-relaxed">افتح سجل المحادثات والأتمتة الوزارية الآن وكن من أوائل اليمن.</p>
             </header>

             <div className="space-y-10 pb-4">
                {plans.map(p => (
                  <div key={p.id} className={`p-8 rounded-[3.5rem] text-right shadow-2xl relative overflow-hidden transition-all bg-gradient-to-br border-4 border-white ${
                    p.color === 'amber' ? 'from-amber-500 to-orange-600 text-white' : 
                    p.color === 'indigo' ? 'from-indigo-700 to-blue-900 text-white' : 
                    p.color === 'emerald' ? 'from-emerald-600 to-teal-800 text-white' :
                    'from-rose-600 to-red-800 text-white'
                  }`}>
                    {p.isPopular && <div className="absolute top-8 -left-12 bg-white text-orange-600 px-14 py-2 -rotate-45 font-black text-[10px] shadow-lg uppercase tracking-widest">الأكثر طلباً 🔥</div>}
                    <div className="flex justify-between items-start mb-2">
                       <span className="bg-white/20 backdrop-blur-md text-white text-[9px] px-3 py-1 rounded-full font-black border border-white/20 uppercase tracking-widest">{p.badge}</span>
                    </div>
                    <h3 className="text-3xl font-black mb-1 leading-none">{p.name}</h3>
                    <p className="text-[10px] font-bold opacity-90 mb-6 leading-relaxed line-clamp-3">{p.description}</p>
                    <div className="text-5xl font-black mb-8 flex items-center gap-3 leading-none">
                       <span>{p.price}</span>
                       <div className="flex flex-col items-start">
                          <span className="text-sm opacity-80 font-bold">ريال</span>
                          <span className="text-[9px] opacity-60 font-bold uppercase tracking-tighter">مدة {p.durationDays} يوم</span>
                       </div>
                    </div>
                    <ul className="space-y-3 mb-10 pr-2">
                       {p.features.map((f, i) => <li key={i} className="text-[12px] font-bold flex items-center gap-3 justify-end"><span>{f}</span> <span className="text-white/40">⚡</span></li>)}
                    </ul>
                    <button onClick={() => window.open(`https://wa.me/${settings.supportNumber}?text=أريد الاشتراك في باقة ${p.name}`)} className="bg-white text-slate-900 w-full py-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all text-sm hover:bg-slate-50">تواصل للاشتراك 💬</button>
                  </div>
                ))}
             </div>

             <div className="bg-white p-8 rounded-[3rem] border-4 border-dashed border-indigo-100 space-y-5 shadow-lg">
                <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">تفعيل كرت الاشتراك 🗝️</p>
                <input value={activationCode} onChange={(e) => setActivationCode(e.target.value)} placeholder="000000" className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-center font-black text-3xl focus:border-indigo-500 outline-none uppercase placeholder:text-slate-100 transition-all tracking-[0.5em]" />
                <button onClick={useCard} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black active:scale-95 transition-all shadow-xl hover:bg-black">تفعيل العضوية برو 🚀</button>
             </div>
             
             <button onClick={() => setView('home')} className="block mx-auto text-[11px] font-black text-slate-400 underline py-6 mb-10 active:scale-95">العودة للرئيسية 🏠</button>
          </div>
        )}

        {view === 'sub-info' && (
           <div className="flex-1 p-8 space-y-6 text-center animate-fade bg-slate-50 scrollbar-hide overflow-y-auto pb-20">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-indigo-100 rounded-[3rem] mx-auto flex items-center justify-center text-5xl shadow-inner border border-indigo-200">👤</div>
                {isSubscribed && <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-lg border-2 border-white text-xs">👑</div>}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-indigo-950 tracking-tighter">حساب الطالب برو</h2>
                <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">ID: SORA-{subscription.startDate.toString().slice(-6)}</p>
              </div>

              <div className="space-y-4">
                 {/* Main Plan Status */}
                 <div className="p-6 bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-sm flex justify-between items-center text-right">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 mb-1 uppercase opacity-60 tracking-widest">حالة الاشتراك الحالية</p>
                       <p className="text-xl font-black text-indigo-600">{subscription.planName}</p>
                       <p className="text-[9px] text-slate-400 font-bold">بدأت في: {new Date(subscription.startDate).toLocaleDateString('ar-YE')}</p>
                    </div>
                    {isSubscribed && (
                       <button onClick={handleLogoutPlan} className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[9px] font-black border border-red-100 active:scale-90 shadow-sm">إلغاء الاشتراك 🚪</button>
                    )}
                 </div>

                 {/* Usage Bars */}
                 <div className="p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl space-y-5 text-right">
                    <p className="text-[10px] font-black text-slate-400 mb-1 uppercase opacity-80 tracking-widest">إحصائيات الاستهلاك 📊</p>
                    
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-indigo-600">{subscription.messagesUsed} / {subscription.maxMessages}</span>
                          <span className="text-slate-500">استهلاك الرسائل</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(100, (subscription.messagesUsed / subscription.maxMessages) * 100)}%` }}></div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-emerald-600">{subscription.imagesUsed} / {subscription.maxImages}</span>
                          <span className="text-slate-500">استهلاك الصور</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, (subscription.imagesUsed / Math.max(1, subscription.maxImages)) * 100)}%` }}></div>
                       </div>
                    </div>
                 </div>

                 {/* Dates Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg text-right">
                       <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">الرسائل المتبقية</p>
                       <p className="text-2xl font-black text-indigo-600">{Math.max(0, subscription.maxMessages - subscription.messagesUsed)}</p>
                    </div>
                    <div className="p-5 bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg text-right">
                       <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">تاريخ الانتهاء</p>
                       <p className="text-xs font-black text-amber-600">{new Date(subscription.expiryDate).toLocaleDateString('ar-YE')}</p>
                       <p className="text-[8px] font-bold text-slate-400 mt-1">({calculateTimeLeft(subscription.expiryDate)})</p>
                    </div>
                 </div>

                 {/* Support Info */}
                 <div className="p-6 bg-indigo-900 rounded-[2.5rem] text-white text-right space-y-3 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-10 -translate-y-10"></div>
                    <h4 className="text-sm font-black">الدعم الفني المباشر 📞</h4>
                    <p className="text-[10px] font-medium opacity-80 leading-relaxed">إذا واجهتك أي مشكلة في التفعيل أو كان لديك استفسار، تواصل معنا فوراً برقم المعرف الخاص بك.</p>
                    <button onClick={() => window.open(`https://wa.me/${settings.supportNumber}?text=معرف الطالب الخاص بي هو: SORA-${subscription.startDate.toString().slice(-6)}`)} className="w-full bg-white text-indigo-900 py-3 rounded-2xl font-black text-[11px] active:scale-95 transition-all">مراسلة الدعم 💬</button>
                 </div>
              </div>
              
              <footer className="pt-6 pb-10 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإصدار 2.5.0 - برو</p>
                <button onClick={() => setView('home')} className="w-full bg-slate-950 text-white py-5 rounded-[2.5rem] font-black text-lg shadow-xl active:scale-95 transition-all hover:bg-black">العودة للرئيسية 🏠</button>
              </footer>
           </div>
        )}
      </div>
    </div>
  );
};

const getSubjectsByGrade = (grade: GradeLevel): Subject[] => {
  const commonIslamic: Subject[] = ['قرآن كريم', 'تربية إسلامية'];
  const primary: Subject[] = [...commonIslamic, 'لغة عربية', 'رياضيات', 'علوم', 'دراسات اجتماعية'];
  const middle: Subject[] = [...commonIslamic, 'لغة عربية', 'رياضيات', 'علوم', 'تاريخ', 'جغرافيا', 'تربية وطنية', 'لغة إنجليزية'];
  
  const secondaryIslamic: Subject[] = ['قرآن كريم', 'إيمان', 'فقه وحديث', 'سيرة'];
  const secondaryArabic: Subject[] = ['قراءة', 'نحو وصرف', 'نصوص وبلاغة'];

  if (grade.includes('ابتدائي')) return primary;
  if (grade.includes('إعدادي')) return middle;
  if (grade === GradeLevel.SECONDARY_1) return [...secondaryIslamic, ...secondaryArabic, 'رياضيات', 'علوم', 'تاريخ', 'جغرافيا', 'لغة إنجليزية'];

  // Strict track separation logic
  if (grade.includes('علمي')) {
    return [...secondaryIslamic, ...secondaryArabic, 'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة إنجليزية'];
  }
  
  if (grade.includes('أدبي')) {
    return [...secondaryIslamic, ...secondaryArabic, 'تاريخ', 'جغرافيا', 'فلسفة ومنطق', 'علم اجتماع', 'لغة إنجليزية'];
  }

  return primary;
};

export default App;
