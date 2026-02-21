import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Phone, ExternalLink, PhoneCall } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logAIQuery } from '../lib/analytics';
import { CRISIS_HOTLINES } from '../lib/constants';
import type { Resource } from '../lib/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  resources?: Resource[];
}

/** Minimal shape the proxy returns */
interface OllamaResponse {
  reply: string;
}

/* ------------------------------------------------------------------ */
/*  Ollama backend helper                                              */
/* ------------------------------------------------------------------ */

const CHAT_API = import.meta.env.VITE_CHAT_API;

const SYSTEM_PROMPT = `You are Fulton Care Connect AI — a helpful, empathetic assistant that connects Fulton County, Georgia residents with free and low-cost community resources (food, housing, healthcare, mental health, employment, transportation, legal aid, education, and financial assistance).

Rules:
• Only provide information and resources that are within Fulton County, GA.
• When asked about services, return only Fulton County government pages, local offices, or providers physically located in Fulton County.
• If you cannot find a Fulton County answer, say: "I don't have Fulton County information for that — would you like general Fulton County area guidance or help locating a local Fulton County contact?"
• Do not suggest resources from other counties.
• Always be kind, concise, and encouraging.
• When the user describes a need, recommend the matching resources that are provided to you in the context.
• If a crisis keyword is detected the UI already shows an alert — reinforce it and provide 988 / 911 info.
• If you don't know the answer, say so honestly and suggest calling 211.
• Never fabricate resource names, addresses, or phone numbers.`;

async function askOllama(
  conversationHistory: { role: string; content: string }[],
  resourceContext: string,
): Promise<string> {
  const systemMessage = {
    role: 'system',
    content: `${SYSTEM_PROMPT}\n\n--- Directory resources related to the user's question ---\n${resourceContext || 'No matching directory resources found.'}`,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [systemMessage, ...conversationHistory],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama proxy error: ${res.status}`);
    }

    const data: OllamaResponse = await res.json();
    return data.reply;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The AI is taking too long — please try a shorter question.');
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  Rich message renderer (links → buttons, phones → call buttons)     */
/* ------------------------------------------------------------------ */

/** Regex for URLs — matches http(s) and bare www. links */
const URL_RE = /https?:\/\/[^\s)\]>]+|www\.[^\s)\]>]+/gi;

/** Regex for US phone numbers like (404) 330-6085, 404-330-6085, 877-473-3478 */
const PHONE_RE = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

/**
 * Pre-process AI text to strip markdown link syntax and leftover brackets
 * around URLs so the button renderer gets clean text.
 *
 * Handles:
 *   [label](http://…)  →  http://…
 *   [http://…]          →  http://…
 *   (http://…)          →  http://…
 */
function cleanLinkSyntax(text: string): string {
  // Markdown links: [any text](url) → url
  text = text.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '$2');
  // Bracketed URLs: [url] → url
  text = text.replace(/\[(https?:\/\/[^\]\s]+)\]/g, '$1');
  text = text.replace(/\[(www\.[^\]\s]+)\]/g, '$1');
  // Parenthesized URLs: (url) → url  (only when clearly wrapping a URL)
  text = text.replace(/\((https?:\/\/[^\s)]+)\)/g, '$1');
  text = text.replace(/\((www\.[^\s)]+)\)/g, '$1');
  return text;
}

function RichMessage({ text }: { text: string }) {
  const cleaned = cleanLinkSyntax(text);
  // Split text into segments: plain text, URL buttons, and phone buttons
  const segments: { type: 'text' | 'url' | 'phone'; value: string }[] = [];

  // Combine both patterns to find all matches in order
  const combined = new RegExp(`(${URL_RE.source})|(${PHONE_RE.source})`, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(cleaned)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: cleaned.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // URL match
      segments.push({ type: 'url', value: match[1] });
    } else {
      // Phone match
      segments.push({ type: 'phone', value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push any remaining text
  if (lastIndex < cleaned.length) {
    segments.push({ type: 'text', value: cleaned.slice(lastIndex) });
  }

  return (
    <div className="whitespace-pre-wrap space-y-1">
      {segments.map((seg, i) => {
        if (seg.type === 'url') {
          const href = seg.value.startsWith('http') ? seg.value : `https://${seg.value}`;
          // Show a friendly label from the hostname
          let label = seg.value;
          try {
            label = new URL(href).hostname.replace(/^www\./, '');
          } catch { /* keep raw */ }
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors mx-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {label}
            </a>
          );
        }

        if (seg.type === 'phone') {
          const digits = seg.value.replace(/[^0-9]/g, '');
          return (
            <a
              key={i}
              href={`tel:${digits}`}
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors mx-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {seg.value}
            </a>
          );
        }

        // Plain text — render bold markdown (**text**)
        const parts = seg.value.split(/\*\*(.+?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIHelp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your Fulton Care Connect AI assistant.\n\nTell me what kind of help you need and I'll search our directory and give you personalised recommendations.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  /* ---- send handler ---- */

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMessage: Message = { role: 'user', content: userText };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      /* --- crisis detection (still client-side for instant response) --- */
      const crisisKeywords = [
        'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
        'emergency', 'danger', 'crisis', 'abuse', 'violence', 'overdose',
      ];
      const hasCrisis = crisisKeywords.some((kw) => userText.toLowerCase().includes(kw));

      if (hasCrisis) {
        const crisisMsg: Message = {
          role: 'assistant',
          content:
            "⚠️ I'm concerned about your safety. If you are in immediate danger, please call **911**. For mental health crisis support, call or text **988** (Suicide & Crisis Lifeline) 24/7.\n\nLet me also search for resources that might help…",
        };
        setMessages((prev) => [...prev, crisisMsg]);
      }

      logAIQuery(userText);

      /* --- directory search for context --- */
      let resources: Resource[] = [];
      let resourceContext = '';

      try {
        const { data: embeddings } = await supabase
          .from('resource_embeddings')
          .select('resource_id, content, resources (*)')
          .textSearch('tsv', userText.split(' ').join(' | '), {
            type: 'websearch',
            config: 'english',
          })
          .limit(10);

        if (embeddings && embeddings.length > 0) {
          resources = embeddings.map((e: any) => e.resources).filter(Boolean);
          resources = resources.slice(0, 10);

          // Build a context string the LLM can reference
          resourceContext = resources
            .map(
              (r, i) =>
                `${i + 1}. ${r.name} | ${r.category} | ${r.address ?? ''} | Phone: ${r.phone ?? 'N/A'} | Services: ${r.services ?? ''} | Hours: ${r.hours ?? 'N/A'} | Eligibility: ${r.eligibility ?? 'N/A'}`,
            )
            .join('\n');
        }
      } catch {
        // Supabase unavailable — Ollama can still respond generically
      }

      /* --- build conversation history for Ollama --- */
      const history = [
        ...messages.filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: userText },
      ];

      /* --- call Ollama via proxy --- */
      const reply = await askOllama(history, resourceContext);

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        resources: resources.length > 0 ? resources : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            `I had trouble connecting to the AI service. Please make sure the backend is reachable at ${CHAT_API}.\n\nIn the meantime you can browse the directory or call **211** for assistance.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ---- render ---- */

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Help Assistant</h1>
          <p className="text-gray-600 text-sm">
            Powered by Llama&nbsp;3.2 — ask me anything about Fulton County resources
          </p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#2563eb] text-white rounded-br-sm'
                    : 'bg-[#fb923c]/15 text-gray-900 rounded-bl-sm'
                }`}
              >
                <RichMessage text={message.content} />

                {message.resources && message.resources.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-white rounded-lg p-4 text-gray-900 shadow-sm"
                      >
                        <h3 className="font-semibold mb-2">{resource.name}</h3>

                        {resource.services && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {resource.services}
                          </p>
                        )}

                        <div className="space-y-1 text-sm">
                          {resource.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#2563eb]" />
                              <a
                                href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                                className="text-[#2563eb] hover:underline"
                              >
                                {resource.phone}
                              </a>
                            </div>
                          )}
                          {resource.address && (
                            <p className="text-gray-600">{resource.address}</p>
                          )}
                          {resource.hours && (
                            <p className="text-gray-600">
                              <strong>Hours:</strong> {resource.hours}
                            </p>
                          )}
                          {resource.eligibility && (
                            <p className="text-gray-600">
                              <strong>Eligibility:</strong> {resource.eligibility}
                            </p>
                          )}
                        </div>

                        <a
                          href={`/resource/${resource.id}`}
                          className="text-[#2563eb] hover:underline text-sm font-medium inline-block mt-2"
                        >
                          View full details →
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#fb923c]/15 rounded-2xl px-5 py-3 rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Emergency?</strong> Call 911 for immediate danger or 988 for mental health
              crisis.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here…"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Crisis hotlines */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {CRISIS_HOTLINES.map((hotline) => (
          <div key={hotline.phone} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{hotline.name}</h3>
            <a
              href={`tel:${hotline.phone}`}
              className="text-2xl font-bold text-red-600 hover:underline"
            >
              {hotline.phone}
            </a>
            <p className="text-sm text-gray-600 mt-1">{hotline.description}</p>
            <p className="text-xs text-gray-500 mt-1">{hotline.available}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AIHelp;
