import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ArrowRight,
  Globe,
  Loader2,
  HelpCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionLink?: string | null;
  actionText?: string | null;
  suggestions?: string[];
  timestamp: string;
}

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect' },
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
];

const DEFAULT_SUGGESTIONS = [
  'How do I post a job?',
  'Bidding ON vs OFF?',
  'How does Worker Navigation work?',
  'How to get verified?',
  'Payment & Escrow security',
];

export default function FloatingAIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your NearWork AI Assistant. I can help you with posting jobs, bidding vs recommendations, worker navigation, verification, and payments. Feel free to ask in Telugu, Tamil, Hindi, or English!',
      suggestions: DEFAULT_SUGGESTIONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language: language === 'auto' ? undefined : language,
        }),
      });

      if (!res.ok) throw new Error('Assistant API returned an error');

      const json = await res.json();
      const data = json.data;

      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: data.reply || 'Here is what I found for your request.',
        actionLink: data.action_link,
        actionText: data.action_text,
        suggestions: data.suggestions || DEFAULT_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Graceful offline fallback
      const fallbackMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'The AI assistant service is temporarily reconnecting. Here are quick tips:\n• To post a job: Tap the "+" button on your home screen.\n• To track workers: Check your job card after assigning a pro.\n• To verify your account: Visit Settings > Verification.\n• For payments: Funds are held securely in Escrow until you approve.',
        actionLink: '/customer/post-job',
        actionText: 'Post a Job',
        suggestions: DEFAULT_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher button (Clean minimal style) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-10 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 border border-blue-500/20 transition-all group"
          aria-label="NearWork AI Assistant"
        >
          <div className="relative">
            <Bot className="h-4 w-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <span className="font-semibold text-xs tracking-tight">
            AI Assistant
          </span>
        </motion.button>
      </div>

      {/* Floating Chat Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 md:bottom-20 right-3 md:right-6 w-[calc(100vw-24px)] md:w-[420px] max-h-[82vh] h-[600px] bg-background/95 backdrop-blur-xl border border-primary/25 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 truncate">
                    NearWork AI Assistant
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-primary/10 text-primary">
                      4 Languages
                    </Badge>
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Telugu • Tamil • English • Hindi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-7 text-[11px] px-2 rounded-lg border-border/80 bg-background/60 w-[110px]">
                    <Globe className="h-3 w-3 mr-1 opacity-70" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code} className="text-xs">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick chips carousel */}
            <div className="p-2 border-b border-border/40 bg-muted/20 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              {DEFAULT_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-background border border-border/70 hover:border-primary/50 text-foreground/80 hover:text-primary whitespace-nowrap transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/70 text-foreground border border-border/50 rounded-bl-none'
                    }`}
                  >
                    {m.text}

                    {/* Interactive deep-link action CTA if provided */}
                    {m.actionLink && m.actionText && (
                      <div className="mt-2.5 pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant={m.sender === 'user' ? 'secondary' : 'default'}
                          className="h-8 text-[11px] font-bold rounded-lg w-full gap-1.5 shadow-sm"
                          onClick={() => {
                            setIsOpen(false);
                            navigate(m.actionLink!);
                          }}
                        >
                          {m.actionText}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 px-1 mt-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>AI Assistant is writing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 border-t border-border bg-background/80 flex items-center gap-2"
            >
              <Input
                placeholder="Ask in Telugu, Tamil, English, or Hindi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-10 text-xs rounded-xl bg-muted/40 border-border"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-xl shrink-0 bg-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
