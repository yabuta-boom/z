import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, User, Headset, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocalMessage {
  id: string;
  text: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: Date;
}

const SAMPLE_RESPONSES = [
  "Thank you for reaching out! Our team will get back to you shortly.",
  "Great question! You can browse our available vehicles on the Fleet page.",
  "We're here to help! For urgent matters, please call us directly.",
  "Yes, we offer flexible rental periods. Check our pricing on the vehicle details page.",
  "Your message has been received. A support agent will assist you soon.",
  "Thanks for your inquiry! You can also visit our Contact page for more info.",
];

export const ChatWidget = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!message.trim() || !profile) return;

    const msgText = message;
    const userMsg: LocalMessage = {
      id: `msg-${++idCounter.current}`,
      text: msgText,
      senderName: profile.name,
      isAdmin: false,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');

    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      const reply: LocalMessage = {
        id: `msg-${++idCounter.current}`,
        text: SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)],
        senderName: 'Zoe Support',
        isAdmin: true,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, reply]);
    }, delay);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "w-[calc(100vw-32px)] sm:w-[350px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col transition-all duration-300",
              isMinimized ? "w-[calc(100vw-32px)] sm:w-[250px]" : "w-[calc(100vw-32px)] sm:w-[350px]"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Headset size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t('chat.support')}</p>
                  <p className="text-[10px] opacity-80 font-medium">{t('chat.online')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label={isMinimized ? t('chat.maximize') : t('chat.minimize')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  {isMinimized ? <Maximize2 size={16} aria-hidden="true" /> : <Minimize2 size={16} aria-hidden="true" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  aria-label={t('chat.close')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50"
                >
                  {!user ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                      <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                        <User size={40} aria-hidden="true" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-gray-800 text-lg">{t('chat.loginToChat')}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t('chat.loginDesc')}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/login');
                        }}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-lg shadow-blue-200"
                      >
                        {t('chat.loginNow')}
                      </Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <MessageSquare size={32} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{t('chat.chatWithSupport')}</p>
                        <p className="text-xs text-muted-foreground">{t('chat.chatDesc')}</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.isAdmin ? "self-start" : "self-end items-end"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-2xl text-sm font-medium shadow-sm",
                          msg.isAdmin 
                            ? "bg-white text-gray-800 rounded-tl-none border border-gray-100" 
                            : "bg-blue-600 text-white rounded-tr-none"
                        )}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {user && (
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                    <Input 
                      name="chatMessage"
                      autoComplete="off"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('chat.typeMessage')}
                      className="rounded-xl h-12 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      aria-label={t('chat.send')}
                      className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0 shadow-lg shadow-blue-200"
                    >
                      <Send size={18} aria-hidden="true" />
                    </Button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        aria-label={isOpen ? t('chat.close') : t('chat.open')}
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500",
          isOpen ? "bg-gray-800 rotate-90" : "bg-gradient-to-br from-blue-500 to-indigo-600"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
};
