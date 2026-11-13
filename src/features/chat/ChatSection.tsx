import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  ShieldCheck,
  User,
  Bot,
  Lock,
  Paperclip,
  Trash2,
  CheckCheck,
  Sparkles,
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
  const [isTyping, setIsTyping] = useState(false)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const reloadConversations = useCallback(async () => {
    const list = await storeEngine.getConversations(userId)
    setConversations(list)
    if (list.length > 0 && !activeConvId) {
      setActiveConvId(list[0].id)
    }
  }, [userId, activeConvId])

  useEffect(() => {
    void reloadConversations()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'new_message') {
        void reloadConversations()
      }
    })
    return () => unsubscribe()
  }, [reloadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, isTyping])

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if ((!inputText.trim() && !attachmentName) || !activeConv) return

    const text = inputText.trim() + (attachmentName ? `\n[Attached Encrypted File: ${attachmentName}]` : '')
    setInputText('')
    setAttachmentName(null)
    setIsSending(true)

    try {
      await storeEngine.sendMessage({
        conversationId: activeConv.id,
        senderUserId: userId,
        senderType: 'customer',
        body: text,
      })

      // Simulate Concierge curator reply
      setIsTyping(true)
      setTimeout(async () => {
        const replies = [
          'Thank you for contacting Russian Market Concierge. Your inquiry has been routed to our Senior Curatorial Officer. All digital assets in your vault are cryptographically authenticated.',
          'Your transaction and entitlement credentials have been verified with our sovereign ledger. If you require settlement verification, orders are processed within 15 minutes.',
          'We have received your message. Our curatorial desk confirms that all Russian Market editions are backed by encrypted master files in your Digital Vault.',
        ]
        const randomReply = replies[Math.floor(Math.random() * replies.length)]

        await storeEngine.sendMessage({
          conversationId: activeConv.id,
          senderType: 'admin',
          body: randomReply,
        })
        setIsTyping(false)
      }, 1400)
    } catch (err) {
      console.error('Send message error:', err)
      setIsTyping(false)
    } finally {
      setIsSending(false)
    }
  }

  const handleClearHistory = async () => {
    if (!activeConv) return
    if (confirm('Clear your conversation history with Russian Market Concierge?')) {
      await storeEngine.clearConversationMessages(activeConv.id)
      await reloadConversations()
    }
  }

  const handleQuickTopic = (topic: string) => {
    setInputText(topic)
  }

  const handleAttachSim = () => {
    const filename = `proof_token_${Math.random().toString(36).slice(2, 7).toUpperCase()}.asc`
    setAttachmentName(filename)
  }

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono-code text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-0.5">
            PRIVATE CONCIERGE
          </span>
          <h2 className="font-space text-xl md:text-2xl font-bold text-white tracking-tight">
            Collector Concierge & Support
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Direct authenticated line for order verification, vault custody, and collectible inquiries.
          </p>
        </div>

        {activeConv && activeConv.messages.length > 1 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono-code transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Main Chat Container */}
      <div className="glass-panel-elevated rounded-3xl border border-white/[0.12] flex flex-col h-[580px] overflow-hidden shadow-2xl">
        {/* Top Chat Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-space font-bold text-xs sm:text-sm text-white">
                  Russian Market Curatorial Desk
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-code text-[9px] font-bold">
                  24/7 LIVE
                </span>
              </div>
              <span className="text-[10px] font-mono-code text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Response time &lt; 2 minutes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AUTHENTICATED</span>
          </div>
        </div>

        {/* Scrollable Message List (min-h-0 prevents flexbox overflow glitch) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Inquiries Strip */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Frequently Requested Services:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Verify my recent order settlement',
                'How do I download my Vault archive?',
                'Are edition numbers guaranteed unique?',
                'I need curator assistance with payment',
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickTopic(topic)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-400/40 text-[11px] font-sans transition-all text-left"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {activeConv?.messages.map((msg) => {
            const isCustomer = msg.senderType === 'customer'
            const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] sm:max-w-[78%] ${
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
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all ${
                    isCustomer
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-black font-medium shadow-[0_4px_16px_rgba(0,240,255,0.25)] rounded-tr-none'
                      : 'glass-panel text-slate-100 border border-white/[0.12] rounded-tl-none font-sans shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono-code opacity-75">
                    <span className="font-bold">{isCustomer ? 'YOU' : 'CONCIERGE DESK'}</span>
                    <span className="flex items-center gap-1">
                      {formattedTime}
                      {isCustomer && <CheckCheck className="w-3 h-3 text-black/80" />}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 mr-auto max-w-[80%] items-center">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-400/30 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl glass-panel text-xs text-slate-400 border border-white/[0.1] rounded-tl-none flex items-center gap-2">
                <span className="font-mono-code text-[11px]">Curator is typing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Pill (if attached) */}
        {attachmentName && (
          <div className="px-4 py-1.5 bg-cyan-500/10 border-t border-cyan-400/20 flex items-center justify-between text-xs font-mono-code text-cyan-300 flex-shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <Paperclip className="w-3.5 h-3.5" />
              Attached: {attachmentName}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentName(null)}
              className="text-slate-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Input Box (Fixed at Bottom, never clipped) */}
        <form
          onSubmit={(e) => handleSendMessage(e)}
          className="p-3 sm:p-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center gap-2 flex-shrink-0"
        >
          <button
            type="button"
            onClick={handleAttachSim}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
            title="Attach cryptographic proof file"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSendMessage()
              }
            }}
            placeholder="Type your inquiry for concierge..."
            disabled={isSending}
            className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachmentName) || isSending}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl btn-primary text-black font-bold active:scale-95 disabled:opacity-40 transition-all text-xs"
            aria-label="Send message"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Security Footer Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-500">
        <Lock className="w-3 h-3 text-cyan-400" />
        <span>End-to-end encrypted concierge communication</span>
      </div>
    </div>
  )
}

export default ChatSection
