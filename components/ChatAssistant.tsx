import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, ChatSession } from '../types';
import { geminiService } from '../services/geminiService';
import { Send, User, Loader2, Sparkles, History, Plus, MessageSquare, Trash2, X, ChevronLeft } from 'lucide-react';
import { Logo } from './Logo';

interface ChatAssistantProps {
  userProfile: UserProfile;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const WELCOME_MESSAGE: ChatMessage = {
    id: 'welcome',
    role: 'model',
    text: `Hai ${userProfile.name}! Aku Glowy, beauty bestie kamu! ✨🌸 Aku siap bantu kamu curhat soal kulit, bahas skincare ingredients, atau atur rutinitas CTMP. Hari ini kulit kamu lagi gimana?`,
    timestamp: new Date()
  };

  // --- Load History from Local Storage on Mount ---
  useEffect(() => {
    const savedSessions = localStorage.getItem('glowyze_chat_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }

    setMessages([WELCOME_MESSAGE]);
    geminiService.startChat(userProfile);
  }, [userProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (messages.length <= 1 && messages[0]?.id === 'welcome') return;

    let updatedSessions = [...sessions];
    const now = Date.now();

    if (currentSessionId) {
      updatedSessions = updatedSessions.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: messages, lastModified: now }
          : s
      );
    } else {
      const newId = Date.now().toString();
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg 
        ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')) 
        : 'New Chat';

      const newSession: ChatSession = {
        id: newId,
        title: title,
        lastModified: now,
        messages: messages
      };
      
      updatedSessions.push(newSession);
      setCurrentSessionId(newId);
    }

    updatedSessions.sort((a, b) => b.lastModified - a.lastModified);
    
    setSessions(updatedSessions);
    localStorage.setItem('glowyze_chat_sessions', JSON.stringify(updatedSessions));

  }, [messages, currentSessionId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await geminiService.sendMessage(userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    geminiService.startChat(userProfile);
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    geminiService.startChat(userProfile, session.messages);
    setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('glowyze_chat_sessions', JSON.stringify(updated));
    
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const suggestions = [
    "Cara hilangkan bekas jerawat?",
    "Rekomendasi serum brightening",
    "Kenapa kulitku berminyak banget?",
    "Urutan skincare pagi yang benar"
  ];

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-meteor">{part.slice(2, -2)}</strong>;
      }
      
      const italicParts = part.split(/(\*.*?\*|_.*?_)/g);
      return (
        <span key={index}>
          {italicParts.map((subPart, subIndex) => {
             const isStar = subPart.startsWith('*') && subPart.endsWith('*');
             const isUnderscore = subPart.startsWith('_') && subPart.endsWith('_');
             
             if ((isStar || isUnderscore) && subPart.length > 2) {
                return <em key={subIndex} className="italic text-slate-600 dark:text-meteor/80">{subPart.slice(1, -1)}</em>;
             }
             return subPart;
          })}
        </span>
      );
    });
  };

  const formatText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        return <div key={i} className="h-2" />;
      }

      if (trimmed.startsWith('#')) {
         const content = trimmed.replace(/^#+\s*/, '');
         return <h3 key={i} className="text-sm font-heading font-bold text-slate-900 dark:text-meteor mt-3 mb-1">{parseInline(content)}</h3>;
      }

      if (trimmed.startsWith('> ')) {
        const content = trimmed.replace(/^>\s*/, '');
        return (
          <div key={i} className="border-l-4 border-ocean-600/50 pl-3 my-2 italic text-slate-600 dark:text-meteor/70">
            {parseInline(content)}
          </div>
        );
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[\*\-•]\s*/, '');
        return (
          <div key={i} className="flex gap-2 mb-1 pl-1">
            <span className="text-ocean-600 dark:text-ocean-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
            <span className="leading-relaxed">{parseInline(content)}</span>
          </div>
        );
      }

      if (/^\d+\./.test(trimmed)) {
         const match = trimmed.match(/^(\d+)\.\s+(.*)/);
         if (match) {
            return (
              <div key={i} className="flex gap-2 mb-1 pl-1">
                <span className="font-bold text-ocean-600 dark:text-ocean-400 min-w-[1rem]">{match[1]}.</span>
                <span className="leading-relaxed">{parseInline(match[2])}</span>
              </div>
            )
         }
      }

      return (
        <p key={i} className="mb-1 leading-relaxed">
          {parseInline(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-galaxy relative overflow-hidden">
      
      {/* --- HISTORY SIDEBAR OVERLAY --- */}
      <div 
        className={`absolute inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          showHistory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowHistory(false)}
      />

      <div className={`absolute top-0 bottom-0 left-0 w-3/4 max-w-xs bg-white dark:bg-galaxy shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-100 dark:border-slate-800 flex flex-col ${
        showHistory ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
           <h3 className="font-heading font-bold text-slate-900 dark:text-meteor text-lg">Chat History</h3>
           <button onClick={() => setShowHistory(false)} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition">
             <ChevronLeft size={24} className="text-slate-600 dark:text-meteor" />
           </button>
        </div>

        <div className="p-4">
           <button 
             onClick={startNewChat}
             className="w-full py-3 bg-ocean-600 dark:bg-ocean-500 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-ocean-700 transition"
           >
             <Plus size={18} /> New Chat
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
           {sessions.length === 0 ? (
             <div className="text-center text-slate-400 mt-10 text-sm">
               No history yet. <br/>Start talking to Glowy!
             </div>
           ) : (
             sessions.map(session => (
               <div 
                 key={session.id}
                 onClick={() => loadSession(session)}
                 className={`group p-3 rounded-xl cursor-pointer border transition-all ${
                   currentSessionId === session.id
                     ? 'bg-ocean-50 dark:bg-ocean-900/30 border-ocean-600 dark:border-ocean-500 shadow-sm'
                     : 'bg-white/40 dark:bg-white/5 border-transparent hover:bg-slate-50 dark:hover:bg-white/10'
                 }`}
               >
                 <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare size={14} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-ocean-600' : 'text-slate-400'}`}/>
                      <span className={`font-medium text-sm truncate w-32 ${currentSessionId === session.id ? 'text-ocean-700 dark:text-ocean-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {session.title}
                      </span>
                   </div>
                   <button 
                     onClick={(e) => deleteSession(e, session.id)}
                     className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
                 <p className="text-[10px] text-slate-400 pl-6">
                   {new Date(session.lastModified).toLocaleDateString()}
                 </p>
               </div>
             ))
           )}
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="p-4 bg-white/80 dark:bg-galaxy/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* LOGO DI SINI */}
          <div className="w-10 h-10 rounded-full bg-ocean-50 dark:bg-ocean-900/30 flex items-center justify-center border border-ocean-100 dark:border-ocean-800 shadow-sm p-1">
            <Logo showText={false} className="w-full h-full" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-slate-900 dark:text-white">Glowy Assistant</h2>
            <p className="text-xs text-ocean-600 dark:text-ocean-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 block animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition relative group"
          title="Chat History"
        >
          <History size={20} />
          {sessions.length > 0 && !currentSessionId && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-galaxy"></span>
          )}
        </button>
      </div>

      {/* --- MESSAGES --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 ${
              msg.role === 'user' ? 'bg-ocean-600 text-white' : 'bg-white dark:bg-slate-800'
            }`}>
              {msg.role === 'user' ? (
                <User size={18} className="text-white" />
              ) : (
                <div className="w-full h-full p-1">
                   <Logo showText={false} className="w-full h-full" />
                </div>
              )}
            </div>
            
            {/* Bubble */}
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-ocean-600 text-white rounded-br-none shadow-ocean-600/10' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
            }`}>
              <div className="markdown-text">
                {formatText(msg.text)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2">
             <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 p-1">
              <Logo showText={false} className="w-full h-full" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-[1.5rem] rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
               <Loader2 className="animate-spin text-ocean-600 dark:text-ocean-400" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- QUICK SUGGESTIONS --- */}
      {messages.length < 3 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => { setInput(s); handleSend(); }} 
                className="whitespace-nowrap px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-ocean-600 dark:text-ocean-400 rounded-full text-xs font-semibold shadow-sm hover:bg-ocean-50 dark:hover:bg-ocean-900/20 hover:border-ocean-600 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- INPUT --- */}
      <div className="p-4 bg-white/80 dark:bg-galaxy/80 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md sticky bottom-0">
        <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 focus-within:border-ocean-600 focus-within:ring-1 focus-within:ring-ocean-600/30 transition">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Glowy about your skin..."
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-full text-white transition ${
              !input.trim() || isLoading ? 'bg-slate-200 dark:bg-slate-700 text-white/50' : 'bg-ocean-600 hover:bg-ocean-700 shadow-lg shadow-ocean-600/20'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
