import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Send,
  User,
  Bot,
  Paperclip,
  Trash2,
  CheckCheck,
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

export function ChatSection({ userId, userEmail: _userEmail = 'collector@russianmarket.store' }: ChatSectionProps) {
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
    isNearBottomRef.current = distanceFromBottom < 100
  }

  // Handle file attachment selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImg = file.type.startsWith('image/')
    if (file.size > 10 * 1024 * 1024) {
      setSendError('File size exceeds 10MB limit')
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed && !attachment) return

    setIsSending(true)
    setSendError(null)
    shouldAutoScrollRef.current = true

    try {
      const convId = activeConv?.id || `conv_${userId}`

      await storeEngine.sendMessage({
        conversationId: convId,
        senderUserId: userId,
        senderType: 'customer',
        body: trimmed || (attachment ? `Sent attachment: ${attachment.name}` : ''),
        attachmentName: attachment?.name,
        attachmentUrl: attachment?.url,
      })

      setInputText('')
      handleClearAttachment()
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      // Simulated curator reply if first message
      if (!activeConv || activeConv.messages.length === 0) {
        setIsTyping(true)
        setTimeout(async () => {
          setIsTyping(false)
          shouldAutoScrollRef.current = true
          await storeEngine.sendMessage({
            conversationId: convId,
            senderType: 'admin',
            body: 'Your message has been logged in our secure curatorial register. A senior officer will verify your vault status shortly.',
          })
          await reloadConversations()
        }, 1200)
      }

      await reloadConversations()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Message transmission failed')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value)
    // Auto-expand textarea up to 120px
    const target = e.target
    target.style.height = 'auto'
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
  }

  const handleClearChat = async () => {
    if (activeConv) {
      await storeEngine.clearConversationMessages(activeConv.id)
      await reloadConversations()
    }
  }

  const handleQuickTopic = (topic: string) => {
    setInputText(topic)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10.5rem-env(safe-area-inset-bottom,0px))] sm:h-[calc(100vh-9rem)] max-w-4xl mx-auto space-y-2 sm:space-y-3">
      {/* 1. Compact Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[#0c0e13] border border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#181c25] border border-white/[0.08] flex items-center justify-center text-white">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-space text-sm sm:text-base font-semibold text-[#ededed]">
                Collector concierge
              </h2>
              <span className="flex items-center gap-1 font-mono-code text-[10px] text-[#9499a6]">
                <span className="status-beacon active" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#666b7a] font-sans">
              Senior Curatorial Officer • Typical response &lt; 2m
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeConv && activeConv.messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg btn-ghost text-xs font-medium flex items-center gap-1 text-[#9499a6] hover:text-white transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono-code text-[#9499a6] bg-[#12151c] px-2.5 py-1 rounded border border-white/[0.08]">
            <span>Authenticated</span>
          </div>
        </div>
      </div>

      {/* 2. Main Full-Height Chat Container */}
      <div className="flex-1 min-h-0 bg-[#0c0e13] rounded-2xl border border-white/[0.07] flex flex-col overflow-hidden shadow-xl relative">
        {/* Scrollable Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Quick Service Inquiry Prompts */}
          <div className="p-3 rounded-lg bg-[#12151c] border border-white/[0.06] space-y-2 flex-shrink-0">
            <span className="text-[10px] font-mono-code text-[#666b7a] uppercase tracking-wider block">
              Quick inquiries:
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
                  className="px-2.5 py-1 rounded-md bg-[#181c25] hover:bg-white/[0.08] text-[#ededed] border border-white/[0.08] text-[11px] font-sans transition-colors text-left"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Empty Conversation State */}
          {(!activeConv || activeConv.messages.length === 0) && (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#181c25] border border-white/[0.08] flex items-center justify-center mx-auto text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h4 className="font-space font-medium text-sm text-[#ededed]">
                Connected to Private Concierge
              </h4>
              <p className="text-xs text-[#9499a6] max-w-sm mx-auto font-sans">
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
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                    isCustomer
                      ? 'bg-[#181c25] text-white border border-white/[0.1]'
                      : 'bg-[#12151c] text-[#9499a6] border border-white/[0.08]'
                  }`}
                >
                  {isCustomer ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body Container */}
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed transition-all break-words [overflow-wrap:anywhere] ${
                    isCustomer
                      ? 'bg-[#181c25] text-[#ededed] border border-white/[0.1] rounded-tr-none'
                      : 'bg-[#12151c] text-[#ededed] border border-white/[0.07] rounded-tl-none font-sans'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono-code text-[#666b7a]">
                    <span>{isCustomer ? 'You' : 'Concierge desk'}</span>
                    <span className="flex items-center gap-1">
                      {formattedTime}
                      {isCustomer && (
                        <span>
                          {msg.status === 'sending' ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : msg.status === 'failed' ? (
                            <AlertCircle className="w-2.5 h-2.5 text-[#f87171]" />
                          ) : (
                            <CheckCheck className="w-3 h-3 text-[#34d399]" />
                          )}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Attachment Preview (if attached) */}
                  {msg.attachmentName && (
                    <div className="mb-2 p-2 rounded-lg bg-black/40 border border-white/[0.08] flex items-center gap-2">
                      {msg.attachmentUrl ? (
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName}
                          className="w-12 h-12 object-cover rounded border border-white/10"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-white" />
                      )}
                      <span className="text-[11px] font-mono-code truncate font-medium">
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
              <div className="w-7 h-7 rounded-lg bg-[#12151c] text-[#9499a6] border border-white/[0.08] flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#12151c] text-xs text-[#9499a6] border border-white/[0.07] rounded-tl-none flex items-center gap-2">
                <span className="font-mono-code text-[11px]">Curator is typing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Pill (if staging file) */}
        {attachment && (
          <div className="px-4 py-2 bg-[#181c25] border-t border-white/[0.08] flex items-center justify-between text-xs font-mono-code text-[#ededed] flex-shrink-0">
            <div className="flex items-center gap-2 truncate">
              {attachment.isImage ? (
                <ImageIcon className="w-3.5 h-3.5 text-[#9499a6] flex-shrink-0" />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-[#9499a6] flex-shrink-0" />
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

        {/* Send Error Toast */}
        {sendError && (
          <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-[#f87171] text-xs flex items-center justify-between flex-shrink-0">
            <span className="truncate">{sendError}</span>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Fixed Message Composer Area */}
        <div className="p-3 sm:p-4 bg-[#0c0e13] border-t border-white/[0.07] flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.txt,.doc"
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-lg btn-ghost text-slate-400 hover:text-white flex-shrink-0 transition-colors"
              title="Attach document or screenshot"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Multiline Input Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Inquire with private concierge..."
                className="w-full bg-[#181c25] border border-white/[0.08] focus:border-white/30 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#ededed] placeholder:text-slate-500 resize-none overflow-y-auto max-h-[120px] transition-colors"
                style={{ minHeight: '40px' }}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !attachment)}
              className="h-10 px-4 rounded-lg btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-98 disabled:opacity-40 transition-all"
              aria-label="Send message"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-1 text-right">
            <span className="text-[10px] font-mono-code text-[#666b7a] hidden sm:inline">
              Shift + Enter for new line • Enter to send
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSection
