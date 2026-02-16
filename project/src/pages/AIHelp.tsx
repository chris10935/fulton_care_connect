import { useState } from 'react';
import { Send, AlertCircle, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logAIQuery } from '../lib/analytics';
import { CRISIS_HOTLINES, FULTON_ZIP_CODES } from '../lib/constants';
import type { Resource } from '../lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  resources?: Resource[];
}

export function AIHelp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to help you find community resources in Fulton County. Tell me what kind of help you need, and I'll search the directory for you. You can also specify a ZIP code to find resources near you.",
    },
  ]);
  const [input, setInput] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const crisisKeywords = [
        'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
        'emergency', 'danger', 'crisis', 'abuse', 'violence', 'overdose'
      ];

      const hasCrisisKeyword = crisisKeywords.some((keyword) =>
        input.toLowerCase().includes(keyword)
      );

      if (hasCrisisKeyword) {
        const crisisMessage: Message = {
          role: 'assistant',
          content: `I'm concerned about your safety. If you are in immediate danger, please call 911. For mental health crisis support, call or text 988 (Suicide & Crisis Lifeline) 24/7.\n\nLet me also search for resources that might help you...`,
        };
        setMessages((prev) => [...prev, crisisMessage]);
      }

      logAIQuery(input, zipCode || undefined);

      const { data: embeddings, error: embError } = await supabase
        .from('resource_embeddings')
        .select(`
          resource_id,
          content,
          resources (*)
        `)
        .textSearch('tsv', input.split(' ').join(' | '), {
          type: 'websearch',
          config: 'english',
        })
        .limit(10);

      if (embError) throw embError;

      let resources: Resource[] = [];

      if (embeddings && embeddings.length > 0) {
        resources = embeddings
          .map((emb: any) => emb.resources)
          .filter(Boolean);

        if (zipCode && FULTON_ZIP_CODES.includes(zipCode)) {
          resources = resources.filter((r) => r.zip_code === zipCode);
        }

        resources = resources.slice(0, 10);
      }

      if (resources.length === 0) {
        const fallbackMessage: Message = {
          role: 'assistant',
          content: `I couldn't find any matching resources in the Fulton Care Connect directory for your search. Here are some options:\n\n• Call 211 for general community resources and referrals (24/7)\n• Call or text 988 for mental health crisis support (24/7)\n• Visit our directory to browse all available resources\n\nPlease try rephrasing your question or search our full directory.`,
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      } else {
        const responseContent = `I found ${resources.length} resource${resources.length > 1 ? 's' : ''} that may help you:\n\n**Important:** Please call ahead to confirm hours and eligibility before visiting.`;

        const responseMessage: Message = {
          role: 'assistant',
          content: responseContent,
          resources,
        };
        setMessages((prev) => [...prev, responseMessage]);
      }
    } catch (error) {
      console.error('Error searching resources:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: 'I encountered an error searching for resources. Please try again or browse the directory manually. You can also call 211 for assistance finding community resources.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Help Assistant</h1>
          <p className="text-gray-600 text-sm">
            Ask me to help you find community resources in Fulton County
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code (optional)
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter your ZIP code"
              maxLength={5}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.resources && message.resources.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.resources.map((resource) => (
                      <div key={resource.id} className="bg-white rounded-lg p-4 text-gray-900 shadow-sm">
                        <h3 className="font-semibold mb-2">{resource.name}</h3>

                        {resource.services && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resource.services}</p>
                        )}

                        <div className="space-y-1 text-sm">
                          {resource.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#2563eb]" />
                              <a href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`} className="text-[#2563eb] hover:underline">
                                {resource.phone}
                              </a>
                            </div>
                          )}

                          {resource.address && (
                            <p className="text-gray-600">{resource.address}</p>
                          )}

                          {resource.hours && (
                            <p className="text-gray-600"><strong>Hours:</strong> {resource.hours}</p>
                          )}

                          {resource.eligibility && (
                            <p className="text-gray-600"><strong>Eligibility:</strong> {resource.eligibility}</p>
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
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Emergency?</strong> Call 911 for immediate danger or 988 for mental health crisis.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {CRISIS_HOTLINES.map((hotline) => (
          <div key={hotline.phone} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{hotline.name}</h3>
            <a href={`tel:${hotline.phone}`} className="text-2xl font-bold text-red-600 hover:underline">
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
