import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  Send,
  ShieldCheck,
  User,
  Bot,
  Lock,
} from 'lucide-react'
import { storeEngine, type SupportConversation } from '../../services/storeEngine'

type ChatSectionProps = {
  userId: string
  userEmail?: string
}

export function ChatSection({ userId }: ChatSectionProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string>('')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadConversations = async () => {
      const list = await storeEngine.getConversations(userId)
      setConversations(list)
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id)
      }
    }
    loadConversations()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'new_message') {
        loadConversations()
      }
    })
    return () => unsubscribe()
  }, [userId, activeConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeConv) return

    const text = inputText.trim()
    setInputText('')
    setIsSending(true)

    try {
      await storeEngine.sendMessage({
        conversationId: activeConv.id,
        senderUserId: userId,
        senderType: 'customer',
        body: text,
      })

      // Simulate helpful Concierge AI/Admin assistant response after 1.5s
      setTimeout(async () => {
        const replies = [
          'Thank you for reaching out to Russian Market Concierge. Your inquiry regarding collectible authenticity and vault custody has been routed to our Senior Curatorial Officer.',
          'Your transaction and entitlement credentials have been cross-verified with our cryptographic ledger. Our team is available 24/7.',
          'We have received your message. If you are inquiring about a pending settlement, our administrator will verify the order records shortly.',
        ]
        const randomReply = replies[Math.floor(Math.random() * replies.length)]

        await storeEngine.sendMessage({
          conversationId: activeConv.id,
          senderType: 'admin',
          body: randomReply,
        })
      }, 1500)
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4 pb-16 max-w-4xl mx-auto">
      <div>
        <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
          24/7 ENCRYPTED CONCIERGE
        </span>
        <h2 className="font-cinzel text-xl md:text-2xl font-bold text-white">
          Curatorial Support & Inquiries
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          All messaging channels are authenticated and protected by zero-knowledge end-to-end logging.
        </p>
      </div>

      {/* Main Chat Interface */}
      <div className="glass-panel-glow rounded-3xl border border-white/10 flex flex-col h-[580px] overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-space font-bold text-xs text-white">
                Russian Market Private Concierge
              </h3>
              <span className="text-[10px] font-mono-code text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Curator Online • Instant Response
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">AUTHENTICATED CONVERSATION</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeConv?.messages.map((msg) => {
            const isCustomer = msg.senderType === 'customer'
            const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  isCustomer ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isCustomer
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-400/30'
                  }`}
                >
                  {isCustomer ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isCustomer
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-black font-medium shadow-[0_4px_15px_rgba(0,240,255,0.2)] rounded-tr-none'
                      : 'glass-panel text-slate-200 border border-white/10 rounded-tl-none font-sans'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono-code opacity-75">
                    <span>{isCustomer ? 'YOU' : 'SENIOR CURATOR'}</span>
                    <span>{formattedTime}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your inquiry for the Russian Market curator..."
            disabled={isSending}
            className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-xl btn-cyan text-black font-bold active:scale-95 disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] font-mono-code text-slate-500">
        <Lock className="w-3 h-3 text-cyan-400" />
        <span>Strictly Private • No conversation logs are indexed by search engines</span>
      </div>
    </div>
  )
}
