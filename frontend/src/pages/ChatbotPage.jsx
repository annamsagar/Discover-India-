import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FiSend, FiRefreshCw, FiZap, FiUser, FiMap, FiMessageSquare } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const SUGGESTIONS = [
  { icon: '🏖️', text: 'Plan a 5-day Goa beach trip' },
  { icon: '🏔️', text: 'Ladakh trip for beginners' },
  { icon: '🏰', text: 'Rajasthan royal tour itinerary' },
  { icon: '🌴', text: 'Best Kerala backwater route' },
  { icon: '💰', text: 'Budget trip under ₹15,000' },
  { icon: '🐯', text: 'Top wildlife sanctuaries in India' },
]

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `🇮🇳 **Namaste! I'm India Guide**, your AI travel companion.

I can help you plan your perfect India trip! Let me ask a few quick questions to get started, or you can just describe what you have in mind.

✨ **Try saying:**
- "Plan a 5-day trip to Kerala"
- "I want to visit Rajasthan in October with a budget of ₹20,000"
- "What are the best places near Jaipur?"

How can I help you explore India today?`,
}

const PLANNING_SYSTEM_CONTEXT = `You are "India Guide", an expert AI tourism assistant for the "Discover India" platform.
Your role is to help travellers plan trips to India. Be conversational and ask clarifying questions one at a time.
When a user wants to plan a trip, gather: (1) destination(s), (2) number of days, (3) budget, (4) travel style (cultural/adventure/relaxation/luxury), (5) starting city.
Ask missing info naturally, one question at a time. Once you have enough info, provide a detailed day-by-day plan with:
- Morning / Afternoon / Evening activities
- Approximate costs in INR
- Local food suggestions
- Transport tips between places
- Nearby places to explore

When listing places, always include their approximate region or address for map context.
Keep responses warm, enthusiastic and well-formatted using markdown bold and bullet points.`

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<span class="flex gap-2"><span class="text-saffron-400 flex-shrink-0">•</span><span>$1</span></span>')
    .replace(/\n/g, '<br/>')
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-5 animate-fade-in`}>
      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-lg ${
        isUser
          ? 'bg-gradient-to-br from-saffron-400 to-saffron-600 text-white'
          : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'
      }`}>
        {isUser ? <FiUser className="w-4 h-4" /> : <FiZap className="w-4 h-4" />}
      </div>

      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-saffron-500 to-saffron-600 text-white rounded-tr-sm shadow-lg shadow-saffron-500/20'
          : 'glass-card border border-white/10 text-slate-200 rounded-tl-sm'
      }`}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          <span
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
        <FiZap className="w-4 h-4 text-white" />
      </div>
      <div className="glass-card border border-white/10 px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-saffron-400"
            style={{ animation: `chatBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [conversationId, setConvId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build history for the AI (exclude the initial system message, format for API)
  const buildHistory = (msgs) => {
    return msgs
      .filter((_, i) => i > 0) // skip initial greeting
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  }

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (message) => {
      const history = buildHistory(messages)
      return api.post('/chatbot/chat', {
        message,
        conversationId,
        history,
      })
    },
    onSuccess: ({ data }) => {
      setConvId(data.conversationId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I ran into a problem. Please try again in a moment.',
      }])
    },
  })

  const handleSend = (text) => {
    const msg = (text ?? input).trim()
    if (!msg || isPending) return
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    sendMessage(msg)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE])
    setConvId(null)
    setInput('')
  }

  const handleGoToPlanner = () => navigate('/planner')

  return (
    <div className="page-enter min-h-screen pt-16 flex flex-col">
      <div
        className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 pb-4 flex flex-col"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Live · AI Powered</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiMessageSquare className="text-saffron-400" />
              India <span className="gradient-text">AI Guide</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Ask me anything — I'll plan your perfect India trip</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGoToPlanner}
              className="flex items-center gap-2 glass-card border border-saffron-500/30 px-3 py-2 rounded-xl text-sm text-saffron-400 hover:border-saffron-500/60 transition-all"
            >
              <FiMap className="w-4 h-4" /> Trip Planner
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 glass-card border border-white/10 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              <FiRefreshCw className="w-4 h-4" /> New Chat
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {SUGGESTIONS.map(s => (
              <button
                key={s.text}
                onClick={() => handleSend(s.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass-card border border-white/10 text-slate-300 hover:text-saffron-400 hover:border-saffron-500/40 transition-all"
              >
                <span>{s.icon}</span> {s.text}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isPending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about places, plans, budget…  (Enter to send)"
            rows={1}
            className="input-field flex-1 px-4 py-3 rounded-2xl text-sm resize-none"
            style={{ overflowY: 'auto', minHeight: '48px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending}
            id="chatbot-send-btn"
            className="btn-glow w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-all"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 text-xs text-center mt-2">
          Powered by Groq AI · Responses may not always be 100% accurate
        </p>
      </div>

      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}
