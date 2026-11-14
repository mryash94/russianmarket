import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Search,
  Send,
  User,
  Bot,
  CheckCheck,
  Sparkles,
  RefreshCw,
  X,
  FileText,
} from 'lucide-react'
import {
  storeEngine,
  type SupportConversation,
} from '../../services/storeEngine'

type AdminChatInboxProps = {
  onNotify: (msg: string) => void
}

export function AdminChatInbox({ onNotify }: AdminChatInboxProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'open' | 'closed'>('all')
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const reloadConversations = useCallback(async () => {
    try {
      const list = await storeEngine.getAllConversationsForAdmin()
      setConversations(list)
      if (!selectedConvId && list.length > 0) {
        setSelectedConvId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to load admin conversations:', err)
    }
  }, [selectedConvId])

  useEffect(() => {
    void reloadConversations()

    const unsubscribe = storeEngine.subscribe((event) => {
      if (event === 'new_message' || event === 'conversations_updated') {
        void reloadConversations()
      }
    })
    return () => unsubscribe()
  }, [reloadConversations])

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0]

  // When admin opens a conversation, mark as read by admin
  useEffect(() => {
    if (selectedConv?.id && selectedConv.unreadAdminCount && selectedConv.unreadAdminCount > 0) {
      void storeEngine.markConversationRead(selectedConv.id, 'admin')
    }
  }, [selectedConv?.id, selectedConv?.unreadAdminCount])

  // Scroll to bottom when viewing messages or when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages.length])

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'unread'
        ? (c.unreadAdminCount || 0) > 0
        : c.status === filter

    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      c.userEmail.toLowerCase().includes(q) ||
      c.userId.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.messages.some((m) => m.body.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!replyText.trim() || !selectedConv || isSending) return

    const text = replyText.trim()
    setReplyText('')
    setIsSending(true)

    try {
      await storeEngine.sendMessage({
        conversationId: selectedConv.id,
        senderType: 'admin',
        body: text,
      })
      onNotify(`Reply dispatched to ${selectedConv.userEmail}`)
    } catch (err) {
      console.error('Admin reply error:', err)
      onNotify('Failed to deliver reply. Please retry.')
      setReplyText(text)
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedConv) return
    const nextStatus = selectedConv.status === 'closed' ? 'open' : 'closed'
    await storeEngine.updateConversationStatus(selectedConv.id, nextStatus)
    onNotify(`Conversation marked as ${nextStatus === 'closed' ? 'Resolved' : 'Open'}`)
    await reloadConversations()
  }

  const handleQuickCanned = (msg: string) => {
    setReplyText(msg)
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadAdminCount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-space text-xl font-bold text-white tracking-tight">
              Realtime Collector Support Inbox
            </h2>
            {totalUnread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono-code text-[11px] font-bold border border-cyan-400/40 animate-pulse">
                {totalUnread} Unread Message{totalUnread === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Live concierge communications, vault delivery verification, and private client support.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadConversations()}
          className="self-start sm:self-auto h-9 px-3 rounded-xl glass-panel hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-mono-code flex items-center gap-1.5 transition-colors border border-white/[0.08]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Threads</span>
        </button>
      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100dvh-14rem)] min-h-[580px]">
        {/* Left Column: Conversation Thread Selector (4 Cols on LG) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-3xl glass-panel-elevated border border-white/[0.12] flex flex-col overflow-hidden shadow-xl">
          {/* Search & Filter Toolbar */}
          <div className="p-3 border-b border-white/[0.08] space-y-2.5 bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-9 glass-input pl-8 pr-3 py-1 rounded-xl text-xs placeholder:text-slate-500 focus:border-cyan-400 font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto scrollbar-none">
              {(['all', 'unread', 'open', 'closed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-mono-code text-[10px] font-bold uppercase transition-all whitespace-nowrap flex-shrink-0 ${
                    filter === tab
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'unread'
                    ? `Unread (${totalUnread})`
                    : tab === 'open'
                    ? 'Open'
                    : 'Resolved'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <MessageCircle className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-mono-code">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedConv?.id === c.id
                const lastMsg = c.messages[c.messages.length - 1]
                const unread = c.unreadAdminCount || 0
                const formattedTime = lastMsg
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-space font-bold text-xs text-white truncate">
                          {c.userEmail}
                        </span>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-black font-mono-code text-[9px] font-extrabold flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono-code text-slate-500 flex-shrink-0">
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400 font-sans truncate">
                        {lastMsg?.body || 'No messages'}
                      </p>

                      <span
                        className={`px-1.5 py-0.2 rounded font-mono-code text-[8px] font-bold uppercase flex-shrink-0 border ${
                          c.status === 'open'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                            : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Message Thread & Live Reply (7-8 Cols on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl glass-panel-elevated border border-white/[0.12] flex flex-col overflow-hidden shadow-xl">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300 flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-space font-bold text-xs sm:text-sm text-white truncate">
                        {selectedConv.userEmail}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono-code text-[9px] font-bold uppercase border ${
                          selectedConv.status === 'open'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                            : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                        }`}
                      >
                        {selectedConv.status === 'open' ? 'Active Inquirer' : 'Resolved Thread'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-code text-slate-400 block truncate">
                      USER ID: {selectedConv.userId} • THREAD: {selectedConv.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-xl font-mono-code text-xs font-semibold border transition-all ${
                      selectedConv.status === 'closed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {selectedConv.status === 'closed' ? 'Re-open' : 'Mark Resolved'}
                  </button>
                </div>
              </div>

              {/* Scrollable Message List */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
                {selectedConv.messages.map((msg) => {
                  const isAdmin = msg.senderType === 'admin'
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[88%] sm:max-w-[78%] ${
                        isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          isAdmin
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-400/30'
                        }`}
                      >
                        {isAdmin ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all break-words [overflow-wrap:anywhere] ${
                          isAdmin
                            ? 'bg-cyan-500/15 text-slate-100 border border-cyan-400/30 rounded-tr-none shadow-md'
                            : 'bg-white/[0.06] text-white border border-white/[0.12] rounded-tl-none font-sans shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono-code opacity-75">
                          <span className="font-bold">{isAdmin ? 'ADMINISTRATOR' : 'COLLECTOR'}</span>
                          <span className="flex items-center gap-1">
                            {formattedTime}
                            {isAdmin && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                          </span>
                        </div>

                        {/* Attachment info if present */}
                        {msg.attachmentName && (
                          <div className="mb-2 p-2 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <span className="text-[11px] font-mono-code truncate font-bold text-slate-200">
                              {msg.attachmentName}
                            </span>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Curator Responses */}
              <div className="px-3.5 py-1.5 border-t border-white/[0.06] bg-black/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
                <span className="text-[10px] font-mono-code text-slate-500 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Quick replies:
                </span>
                {[
                  'Your payment and entitlement credentials have been verified.',
                  'Please provide your 12-digit UPI UTR number so we can audit your deposit.',
                  'Your master collectible archive is permanently unlocked in your Digital Vault.',
                  'Our senior curatorial team is reviewing your transaction.',
                ].map((txt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickCanned(txt)}
                    className="px-2 py-0.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.06] text-[10px] font-sans whitespace-nowrap flex-shrink-0"
                  >
                    {txt.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Admin Reply Composer Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 sm:p-3.5 border-t border-white/[0.08] bg-[#090d16]/95 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply as Administrator to ${selectedConv.userEmail}...`}
                  disabled={isSending}
                  className="flex-1 h-10 glass-input px-3.5 py-2 rounded-xl text-xs sm:text-sm placeholder:text-slate-500 focus:border-cyan-400"
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="h-10 px-4 rounded-xl btn-primary text-black font-bold active:scale-95 disabled:opacity-40 transition-all text-xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Dispatch Reply</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="font-space font-bold text-sm text-slate-400">
                Select a conversation thread to inspect and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChatInbox
