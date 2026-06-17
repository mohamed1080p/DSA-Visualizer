import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { apiJson } from '../lib/api-client';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '@/context/use-auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatBot() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm DSA Visualizer's AI assistant. Need help understanding a data structure or debugging your code?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!isAuthenticated) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Please sign in to use the AI chat assistant.',
        },
      ]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await apiJson<{ reply: string }>('/api/Chatbot/message', {
        method: 'POST',
        auth: true,
        json: { messages: updatedMessages },
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process that request right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              trackEvent('ai_bot_opened');
            }}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-shadow"
          >
            <Bot className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-background">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[85vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-background/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold">DSA Visualizer AI</h3>

                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={cn(
                      "flex w-max max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === 'user'
                        ? "self-end bg-primary text-primary-foreground rounded-tr-sm"
                        : "self-start bg-background border border-border rounded-tl-sm"
                    )}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex w-max max-w-[85%] self-start items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-2.5 text-sm"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground animate-pulse">Thinking...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-background/50 p-4">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {!isAuthenticated && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Sign in to send messages to the assistant.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
