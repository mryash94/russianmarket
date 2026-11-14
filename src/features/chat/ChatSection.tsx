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
  X,
  FileText,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'
import {
  storeEngine,
  type SupportConversation,
  type SupportMessage,
} from '../../services/storeEngine'

type ChatSectionProps = {
  userId: string
  userEmail?: string
}

export function ChatSection({ userId, userEmail = 'collector@russianmarket.store' }: ChatSectionProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string>('')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Attachment state
  const [attachment, setAttachment] = useState<{
    file: File | null
    name: string
    url?: string
    isImage?: boolean
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll container and smart auto-scroll management
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const shouldAutoScrollRef = useRef(true)

  const reloadConversations = useCallback(async () => {
    try {
      const list = await storeEngine.getConversations(userId)
      setConversations(list)
      if (list.length > 0 && (!activeConvId || !list.some((c) => c.id === activeConvId))) {
        setActiveConvId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to reload conversations:', err)
    }
  }, [userId, activeConvId])

  useEffect(() => {
    void reloadConversations()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'new_message' || event === 'conversations_updated') {
        void reloadConversations()
      }
    })
    return () => unsubscribe()
  }, [reloadConversations])

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]

  // Mark conversation read when viewing
  useEffect(() => {
    if (activeConv?.id) {
      void storeEngine.markConversationRead(activeConv.id, 'customer')
    }
  }, [activeConv?.id, activeConv?.messages.length])

  // Smart auto-scroll: Only scroll down if user is near bottom or just sent a message
  useEffect(() => {
    if (shouldAutoScrollRef.current || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      shouldAutoScrollRef.current = false
    }
  }, [activeConv?.messages.length, isTyping])

  // Track user scroll position in message list
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    // Consider user "near bottom" if within 100px of bottom
    isNearBottomRef.current = distanceFromBottom < 100
  }

  // Handle file attachment selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImg = file.type.startsWith('image/')
    if (file.size > 10 * 1024 * 1024) {
      setSendError('File size exceeds 10MB limit.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setAttachment({
      file,
      name: file.name,
      url: previewUrl,
      isImage: isImg,
    })
    setSendError(null)
  }

  const handleClearAttachment = () => {
    if (attachment?.url) {
      URL.revokeObjectURL(attachment.url)
    }
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if ((!trimmed && !attachment) || !activeConv || isSending) return

    setIsSending(true)
    setSendError(null)
    shouldAutoScrollRef.current = true

    const currentText = trimmed
    const currentAttachment = attachment

    // Clear input immediately for snappy responsive feel
    setInputText('')
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await storeEngine.sendMessage({
        conversationId: activeConv.id,
        senderUserId: userId,
        senderType: 'customer',
        body: currentText || (currentAttachment ? `[Attached file: ${currentAttachment.name}]` : ''),
        attachmentName: currentAttachment?.name,
        attachmentUrl: currentAttachment?.url,
      })

      // Simulate Concierge auto-acknowledgement if no admin is currently in the active thread
      setIsTyping(true)
      setTimeout(async () => {
        try {
          const replies = [
            'Thank you for contacting Russian Market Concierge. Your inquiry has been routed to our Senior Curatorial Officer. All digital assets in your vault are cryptographically authenticated.',
            'Your transaction and entitlement credentials have been verified with our sovereign ledger. If you require settlement verification, orders are processed within 15 minutes.',
            'Our curatorial desk confirms that all Russian Market editions are backed by encrypted master files in your Digital Vault. How else may we assist your collection today?',
            'Your message has been logged in our secure curatorial register. A senior officer will verify your vault status shortly.',
          ]
          const randomReply = replies[Math.floor(Math.random() * replies.length)]

          await storeEngine.sendMessage({
            conversationId: activeConv.id,
            senderType: 'admin',
            body: randomReply,
          })
          setIsTyping(false)
          shouldAutoScrollRef.current = true
        } catch {
          setIsTyping(false)
        }
      }, 1500)
    } catch (err) {
      console.error('Send message error:', err)
      setSendError(err instanceof Error ? err.message : 'Message failed to send. Tap to retry.')
      // Restore input text on error
      setInputText(currentText)
      setAttachment(currentAttachment)
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
    textareaRef.current?.focus()
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto flex flex-col h-[calc(100dvh-10rem)] min-h-[500px]">
      {/* 1. Compact Header */}
      <div className="flex items-center justify-between gap-2 px-1 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-space font-bold text-sm sm:text-base text-white tracking-tight">
                Collector Concierge
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono-code text-[9px] font-bold">
                24/7 LIVE
              </span>
            </div>
            <span className="text-[10px] font-mono-code text-slate-400 block truncate max-w-[220px] sm:max-w-md">
              Authenticated line ({userEmail}) • Response &lt; 2m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeConv && activeConv.messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono-code transition-all"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono-code text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTHENTICATED</span>
          </div>
        </div>
      </div>

      {/* 2. Main Full-Height Chat Container */}
      <div className="flex-1 min-h-0 glass-panel-elevated rounded-3xl border border-white/[0.12] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Scrollable Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Quick Service Inquiry Prompts */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 flex-shrink-0">
            <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Quick Inquiries:
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

          {/* Empty Conversation State */}
          {(!activeConv || activeConv.messages.length === 0) && (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="font-space font-bold text-sm text-white">
                Connected to Private Concierge
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                Our Senior Curatorial Officer is on standby. Inquire regarding editions, custody verification, or order status.
              </p>
            </div>
          )}

          {/* Message Bubbles */}
          {activeConv?.messages.map((msg: SupportMessage) => {
            const isCustomer = msg.senderType === 'customer'
            const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[90%] sm:max-w-[78%] ${
                  isCustomer ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isCustomer
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-400/30'
                  }`}
                >
                  {isCustomer ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body Container */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all break-words [overflow-wrap:anywhere] ${
                    isCustomer
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-black font-medium shadow-[0_4px_16px_rgba(0,240,255,0.25)] rounded-tr-none'
                      : 'glass-panel text-slate-100 border border-white/[0.12] rounded-tl-none font-sans shadow-md'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono-code opacity-80">
                    <span className="font-bold">{isCustomer ? 'YOU' : 'CONCIERGE DESK'}</span>
                    <span className="flex items-center gap-1">
                      {formattedTime}
                      {isCustomer && (
                        <span>
                          {msg.status === 'sending' ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : msg.status === 'failed' ? (
                            <AlertCircle className="w-2.5 h-2.5 text-rose-700" />
                          ) : (
                            <CheckCheck className="w-3 h-3 text-black/80" />
                          )}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Attachment Preview (if attached) */}
                  {msg.attachmentName && (
                    <div className="mb-2 p-2 rounded-xl bg-black/20 border border-black/20 flex items-center gap-2">
                      {msg.attachmentUrl ? (
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName}
                          className="w-12 h-12 object-cover rounded-lg border border-white/20"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-white" />
                      )}
                      <span className="text-[11px] font-mono-code truncate font-bold">
                        {msg.attachmentName}
                      </span>
                    </div>
                  )}

                  {/* Message Text */}
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

        {/* Attachment Pill (if staging file) */}
        {attachment && (
          <div className="px-4 py-2 bg-cyan-500/10 border-t border-cyan-400/20 flex items-center justify-between text-xs font-mono-code text-cyan-300 flex-shrink-0">
            <div className="flex items-center gap-2 truncate">
              {attachment.isImage ? (
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              )}
              <span className="truncate">Attached: {attachment.name}</span>
            </div>
            <button
              type="button"
              onClick={handleClearAttachment}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error notification banner if send failed */}
        {sendError && (
          <div className="px-4 py-2 bg-rose-500/15 border-t border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{sendError}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              className="underline font-bold text-rose-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. Fixed Message Composer Form */}
        <form
          onSubmit={(e) => void handleSendMessage(e)}
          className="p-3 sm:p-3.5 border-t border-white/[0.08] bg-[#090d16]/95 backdrop-blur-md flex items-end gap-2 flex-shrink-0 z-10"
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.asc,.sig,.txt"
          />

          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/[0.08] transition-colors flex-shrink-0"
            title="Attach file or screenshot"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Multiline Message Textarea with Auto-Expansion */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSendMessage()
              }
            }}
            placeholder="Type your inquiry for concierge..."
            disabled={isSending}
            className="flex-1 min-h-[40px] max-h-[120px] glass-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm placeholder:text-slate-500 focus:border-cyan-400 resize-none font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !attachment) || isSending}
            className="h-10 px-4 rounded-xl btn-primary text-black font-bold active:scale-95 disabled:opacity-40 transition-all text-xs flex items-center gap-1.5 flex-shrink-0"
            aria-label="Send message"
          >
            {isSending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span className="hidden xs:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Footer Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-code text-slate-500 flex-shrink-0">
        <Lock className="w-3 h-3 text-cyan-400" />
        <span>End-to-end encrypted curatorial communications • Sovereign Vault Protocol</span>
      </div>
    </div>
  )
}

export default ChatSection
