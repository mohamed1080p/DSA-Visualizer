import { useCallback, useEffect, useMemo, useRef, useState, memo, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Trash2, X, Bot, User, Zap, ArrowDown } from 'lucide-react';
import api from '../api/axios';

/* ───────────────────────── types ───────────────────────── */
type ChatRole = 'user' | 'assistant';

interface ChatbotProps {
  floating?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

interface ChatResponse {
  reply: string;
}

/* ───────────────────────── constants ───────────────────────── */
const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content: 'Hi! I\'m your DSA tutor. Ask me about data structures, algorithms, complexity analysis, or interview prep.',
  timestamp: Date.now(),
};

const STARTER_PROMPTS = [
  { icon: '🔍', text: 'Explain binary search step by step' },
  { icon: '🌳', text: 'Compare DFS and BFS with examples' },
  { icon: '📊', text: 'When should I use a hash map vs a tree?' },
  { icon: '⚡', text: 'Help me understand Big-O notation' },
];

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}-${Date.now()}`;

/* ───────────────────────── simple markdown ───────────────────────── */
function renderMarkdown(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
      const code = match ? match[2].trim() : part.slice(3, -3).trim();
      const lang = match?.[1] || '';
      return (
        <div key={i} className="chat-code-block">
          {lang && <div className="chat-code-lang">{lang}</div>}
          <pre><code>{code}</code></pre>
        </div>
      );
    }

    // Process inline markdown
    const lines = part.split('\n');
    return lines.map((line, j) => {
      // Headers
      if (line.startsWith('### ')) return <h4 key={`${i}-${j}`} style={{ margin: '0.5rem 0 0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>{line.slice(4)}</h4>;
      if (line.startsWith('## ')) return <h3 key={`${i}-${j}`} style={{ margin: '0.6rem 0 0.3rem', fontSize: '1rem', fontWeight: 700 }}>{line.slice(3)}</h3>;
      if (line.startsWith('# ')) return <h2 key={`${i}-${j}`} style={{ margin: '0.6rem 0 0.3rem', fontSize: '1.1rem', fontWeight: 700 }}>{line.slice(2)}</h2>;

      // Bullet points
      if (line.match(/^[\-\*]\s/)) {
        return <div key={`${i}-${j}`} style={{ paddingLeft: '1rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{processInline(line.slice(2))}</div>;
      }
      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\.\s/)?.[1];
        return <div key={`${i}-${j}`} style={{ paddingLeft: '1.2rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary-color)', fontWeight: 600 }}>{num}.</span>{processInline(line.replace(/^\d+\.\s/, ''))}</div>;
      }

      if (line.trim() === '') return <div key={`${i}-${j}`} style={{ height: '0.4rem' }} />;
      return <div key={`${i}-${j}`}>{processInline(line)}</div>;
    });
  });
}

function processInline(text: string) {
  // Bold, inline code, italic
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="chat-inline-code">{p.slice(1, -1)}</code>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

/* ───────────────────────── message bubble ───────────────────────── */
const MessageBubble = memo(({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 8, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}
    >
      <div className="chat-bubble-avatar">
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className="chat-bubble-content">
        {isUser ? message.content : renderMarkdown(message.content)}
      </div>
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

/* ───────────────────────── typing indicator ───────────────────────── */
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    className="chat-bubble chat-bubble-bot"
  >
    <div className="chat-bubble-avatar"><Bot size={14} /></div>
    <div className="chat-typing-dots">
      <span style={{ animationDelay: '0ms' }} />
      <span style={{ animationDelay: '150ms' }} />
      <span style={{ animationDelay: '300ms' }} />
    </div>
  </motion.div>
);

/* ───────────────────────── main component ───────────────────────── */
const Chatbot = ({ floating = false, onClose }: ChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const showStarters = messages.length <= 1 && !loading;

  useEffect(() => {
    if (!floating) document.title = 'AI Tutor — DSA Visualizer';
  }, [floating]);

  /* auto-scroll */
  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  /* scroll-to-bottom button visibility */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  }, []);

  /* auto-resize textarea */
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  /* send message */
  const sendMessage = useCallback(async (messageText?: string) => {
    const content = (messageText ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const allMessages = [...messages, userMsg];
      const response = await api.post<ChatResponse>('/chatbot/message', {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
      }, { signal: controller.signal });

      if (!controller.signal.aborted) {
        setMessages(prev => [...prev, {
          id: nextId(),
          role: 'assistant',
          content: response.data.reply,
          timestamp: Date.now(),
        }]);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return;
      const fallback = error?.response?.data || 'Ollama is unavailable right now. Make sure the Ollama server is running.';
      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'assistant',
        content: String(fallback),
        timestamp: Date.now(),
      }]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [input, loading, messages]);

  /* reset */
  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([{ ...INITIAL_MESSAGE, id: nextId(), timestamp: Date.now() }]);
    setInput('');
    setLoading(false);
  }, []);

  /* cleanup on unmount */
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); void sendMessage(); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  /* ─────── floating layout ─────── */
  if (floating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="chat-float-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="chat-float-panel"
        >
          {/* header */}
          <div className="chat-float-header">
            <div className="chat-float-header-left">
              <div className="chat-float-logo"><Bot size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>DSA Tutor</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="chat-status-dot" /> Powered by Ollama
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={resetChat} className="chat-icon-btn" title="Clear chat"><Trash2 size={15} /></button>
              <button onClick={onClose} className="chat-icon-btn" title="Close"><X size={15} /></button>
            </div>
          </div>

          {/* messages */}
          <div className="chat-float-messages" ref={scrollRef} onScroll={handleScroll}>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
            ))}
            <AnimatePresence>{loading && <TypingIndicator />}</AnimatePresence>
            <div ref={endRef} />

            {showStarters && (
              <div className="chat-starters">
                {STARTER_PROMPTS.map(p => (
                  <button key={p.text} className="chat-starter-btn" onClick={() => void sendMessage(p.text)}>
                    <span>{p.icon}</span> {p.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showScrollBtn && (
            <button className="chat-scroll-btn" onClick={scrollToBottom}><ArrowDown size={14} /></button>
          )}

          {/* input */}
          <form onSubmit={handleSubmit} className="chat-float-input">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className="chat-textarea"
            />
            <button type="submit" disabled={!canSend} className="chat-send-btn">
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  }

  /* ─────── full-page layout ─────── */
  return (
    <div className="container" style={{ maxWidth: 1100 }}>
      {/* page header */}
      <div className="glass-panel" style={{ padding: '2rem 2.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-color)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Sparkles size={16} /> AI-Powered Tutor
            </div>
            <h1 className="heading-lg" style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Chat with your DSA tutor</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '55ch' }}>
              Ask coding, algorithm, and data structure questions — get practical answers powered by Ollama.
            </p>
          </div>
          <button onClick={resetChat} className="btn btn-secondary">
            <Trash2 size={16} /> New conversation
          </button>
        </div>
      </div>

      {/* chat area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '72vh' }}>
          {/* messages */}
          <div className="chat-page-messages" ref={scrollRef} onScroll={handleScroll}>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
            ))}
            <AnimatePresence>{loading && <TypingIndicator />}</AnimatePresence>
            <div ref={endRef} />
          </div>

          {showScrollBtn && (
            <button className="chat-scroll-btn" onClick={scrollToBottom}><ArrowDown size={14} /></button>
          )}

          {/* input */}
          <form onSubmit={handleSubmit} className="chat-page-input">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about BFS, DP, complexity, or debugging strategies..."
              rows={1}
              className="chat-textarea"
            />
            <button type="submit" disabled={!canSend} className="chat-send-btn chat-send-btn-lg">
              <Send size={18} />
              Send
            </button>
          </form>
        </div>

        {/* sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.2rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} color="var(--secondary-color)" /> Quick prompts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p.text}
                  onClick={() => void sendMessage(p.text)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                >
                  <span>{p.icon}</span> {p.text}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.72rem', border: '1px solid var(--surface-border)' }}>Enter</kbd> to send · <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: '0.72rem', border: '1px solid var(--surface-border)' }}>Shift+Enter</kbd> new line
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Chatbot;