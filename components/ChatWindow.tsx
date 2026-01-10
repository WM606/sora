
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-y-auto px-4 pb-12 pt-4 space-y-6 scroll-smooth scrollbar-hide flex flex-col"
    >
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-8 py-20 animate-fade">
          <div className="w-28 h-28 bg-white rounded-[3rem] shadow-xl flex items-center justify-center border-2 border-indigo-50">
             <span className="text-6xl">👨‍🏫</span>
          </div>
          <div className="text-center px-8">
            <h3 className="text-xl font-black text-indigo-950 mb-2 tracking-tighter">مرحباً بك في فصلك الذكي!</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed">أنا الأستاذ سورا، رفيقك في المنهج اليمني. اسألني عن أي درس أو أرسل صورة لواجبك وسأقوم بمساعدتك فوراً.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade`}
        >
          <div 
            className={`max-w-[88%] rounded-[2.5rem] p-5 shadow-sm border-2 transition-all ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-none' 
                : 'bg-white text-slate-800 border-white rounded-bl-none shadow-indigo-100/20'
            }`}
          >
            {msg.image && (
              <div className="mb-4 rounded-[1.8rem] overflow-hidden border-4 border-white shadow-md bg-slate-100 select-none pointer-events-none cursor-default">
                <img 
                  src={msg.image} 
                  alt="Lesson" 
                  className="w-full h-auto max-h-[350px] object-contain pointer-events-none" 
                  onLoad={scrollToBottom}
                />
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed text-sm font-bold tracking-tight">
              {msg.text}
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {msg.sources.map((chunk, idx) => chunk.web && (
                  <a 
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] bg-slate-50 text-indigo-600 px-3 py-1.5 rounded-full font-black border border-indigo-50"
                  >
                    🔗 مرجع رسمي
                  </a>
                ))}
              </div>
            )}
            <div className={`text-[8px] mt-2 font-black opacity-30 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-end animate-fade">
          <div className="bg-white border-2 border-indigo-50 p-4 rounded-[1.8rem] rounded-bl-none shadow-lg flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">سورا يكتب...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-10 w-full shrink-0" />
    </div>
  );
};

export default ChatWindow;
