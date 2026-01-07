
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
             <span className="text-5xl">👨‍🏫</span>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-indigo-900">أهلاً بك مع الاستاذ سورا!</p>
            <p className="text-sm text-gray-500 mt-2">أنا هنا لمساعدتك في المنهج اليمني بكل سهولة.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
        >
          <div 
            className={`max-w-[90%] md:max-w-[75%] rounded-2xl p-4 shadow-sm relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-indigo-100 rounded-bl-none'
            }`}
          >
            {msg.image && (
              <img 
                src={msg.image} 
                alt="Uploaded" 
                className="mb-3 rounded-lg max-h-80 w-full object-contain border-2 border-white/20 bg-black/5"
              />
            )}
            <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base mb-2">
              {msg.text}
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-indigo-600 mb-2 flex items-center">
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  المصادر والمراجع:
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((chunk, idx) => chunk.web && (
                    <a 
                      key={idx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center"
                    >
                      {chunk.web.title || "مصدر خارجي"}
                      <svg className="w-2 h-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-end">
          <div className="bg-white border border-indigo-50 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center space-x-3 space-x-reverse">
            <div className="flex space-x-1 space-x-reverse">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
            </div>
            <span className="text-xs text-indigo-500 font-bold">الاستاذ سورا يبحث ويحضر لك الإجابة...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
