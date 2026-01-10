
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // التمرير التلقائي للأسفل
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth overscroll-contain">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-full text-gray-400 space-y-4 py-10">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
             <span className="text-4xl">👨‍🏫</span>
          </div>
          <div className="text-center px-6">
            <p className="text-lg font-bold text-indigo-900">أهلاً بك مع الاستاذ سورا!</p>
            <p className="text-[11px] text-gray-500 mt-1">أنا هنا لمساعدتك في المنهج اليمني. اكتب سؤالك أو أرسل صورة للواجب.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div 
            className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-indigo-100 rounded-bl-none'
            }`}
          >
            {msg.image && (
              <div className="mb-2 rounded-lg overflow-hidden border border-black/5">
                <img src={msg.image} alt="Uploaded" className="max-h-64 w-full object-contain bg-black/5" />
              </div>
            )}
            <div className="whitespace-pre-wrap leading-relaxed text-[13px] md:text-[15px] font-medium">
              {msg.text}
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                {msg.sources.map((chunk, idx) => chunk.web && (
                  <a 
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                  >
                    <span>🔗</span>
                    <span className="truncate max-w-[100px]">{chunk.web.title || "مرجع"}</span>
                  </a>
                ))}
              </div>
            )}

            <div className={`text-[8px] mt-2 font-bold opacity-40 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-end">
          <div className="bg-white border border-indigo-50 rounded-2xl p-3 rounded-bl-none shadow-sm flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[10px] text-indigo-600 font-black">جاري التفكير...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-6 w-full shrink-0" />
    </div>
  );
};

export default ChatWindow;
