import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  Search,
  Send,
  User,
  Bot,
  RefreshCw,
  FileText,
  ChevronLeft,
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
  const [mobileShowThread, setMobileShowThread] = useState(false)
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

  useEffect(() => {
    if (selectedConv?.id && selectedConv.unreadAdminCount && selectedConv.unreadAdminCount > 0) {
      void storeEngine.markConversationRead(selectedConv.id, 'admin')
    }
  }, [selectedConv?.id, selectedConv?.unreadAdminCount])

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

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-space text-lg sm:text-xl font-semibold text-[#ededed]">
            Collector support inbox
          </h2>
          <p className="text-xs text-[#9499a6] font-sans mt-0.5">
            Realtime customer concierge messaging, identity inquiry handling, and status resolution
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadConversations()}
          className="self-start sm:self-auto h-9 px-3 rounded-lg btn-ghost text-xs font-mono-code flex items-center gap-1.5 transition-colors"
          title="Refresh inbox"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#9499a6]" />
          <span>Refresh inbox</span>
        </button>
      </div>

      {/* 2. Master-Detail Inbox View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-[#0c0e13] border border-white/[0.08] overflow-hidden min-h-[580px] shadow-xl">
        {/* Left Column: Conversation Threads List (4 Cols) */}
        <div className={`lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col bg-[#0c0e13] ${
          mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search and Filter Row */}
          <div className="p-3 border-b border-white/[0.07] space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search threads..."
                className="w-full h-9 bg-[#181c25] border border-white/[0.08] focus:border-white/30 pl-8 pr-3 rounded-lg text-xs text-white placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#12151c] p-1 rounded-lg border border-white/[0.06]">
              {(['all', 'unread', 'open', 'closed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`flex-1 py-1 rounded font-mono-code text-[10px] font-medium transition-colors ${
                    filter === tab
                      ? 'bg-[#181c25] text-white border border-white/20'
                      : 'text-[#9499a6] hover:text-white'
                  }`}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'unread'
                    ? 'Unread'
                    : tab === 'open'
                    ? 'Open'
                    : 'Resolved'}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] max-h-[500px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9499a6] font-sans">
                No conversations match filter.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                const unread = conv.unreadAdminCount || 0
                const lastMsg = conv.messages[conv.messages.length - 1]

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id)
                      setMobileShowThread(true)
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#181c25] border-l-2 border-l-white'
                        : 'hover:bg-[#12151c]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-space font-medium text-xs text-[#ededed] truncate max-w-[170px]">
                        {conv.userEmail}
                      </span>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-white text-black font-mono-code text-[9px] font-semibold tabular-nums">
                          {unread} new
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#9499a6] truncate font-sans">
                      {lastMsg ? lastMsg.body : conv.subject}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono-code text-[#666b7a]">
                      <span className="truncate max-w-[140px]">ID: {conv.userId.slice(0, 10)}...</span>
                      <span
                        className={`uppercase font-medium ${
                          conv.status === 'closed' ? 'text-[#666b7a]' : 'text-[#34d399]'
                        }`}
                      >
                        {conv.status === 'closed' ? 'Resolved' : 'Active'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (8 Cols) */}
        <div className={`lg:col-span-8 flex flex-col bg-[#0c0e13] ${
          !mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}>
          {selectedConv ? (
            <>
              {/* Active Thread Header */}
              <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between bg-[#0c0e13]">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileShowThread(false)}
                    className="lg:hidden p-1.5 rounded-lg bg-[#181c25] border border-white/10 text-white/70 hover:text-white flex items-center gap-1 text-xs"
                    title="Back to thread list"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Inbox</span>
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-[#181c25] border border-white/[0.08] flex items-center justify-center text-white">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-space font-semibold text-xs sm:text-sm text-[#ededed]">
                      {selectedConv.userEmail}
                    </h3>
                    <span className="text-[10px] font-mono-code text-[#666b7a]">
                      Session ID: {selectedConv.userId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-medium border transition-colors ${
                      selectedConv.status === 'closed'
                        ? 'bg-[#181c25] text-[#ededed] border-white/20'
                        : 'bg-white/[0.05] text-[#34d399] border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {selectedConv.status === 'closed' ? 'Reopen Thread' : 'Mark Resolved'}
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[340px] max-h-[420px] bg-[#0c0e13]">
                {selectedConv.messages.map((m) => {
                  const isAdmin = m.senderType === 'admin'
                  const time = new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 max-w-[85%] ${
                        isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isAdmin
                            ? 'bg-[#181c25] text-white border border-white/20'
                            : 'bg-[#12151c] text-[#9499a6] border border-white/[0.08]'
                        }`}
                      >
                        {isAdmin ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </div>

                      <div
                        className={`p-3 rounded-xl text-xs leading-relaxed break-words [overflow-wrap:anywhere] ${
                          isAdmin
                            ? 'bg-[#181c25] text-[#ededed] border border-white/[0.1] rounded-tr-none'
                            : 'bg-[#12151c] text-[#ededed] border border-white/[0.07] rounded-tl-none font-sans'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[9px] font-mono-code text-[#666b7a] mb-1">
                          <span>{isAdmin ? 'Senior curator admin' : 'Collector'}</span>
                          <span>{time}</span>
                        </div>

                        {m.attachmentName && (
                          <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-white/[0.08] flex items-center gap-2">
                            {m.attachmentUrl ? (
                              <img
                                src={m.attachmentUrl}
                                alt={m.attachmentName}
                                className="w-10 h-10 object-cover rounded border border-white/10"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-white" />
                            )}
                            <span className="text-[10px] font-mono-code truncate font-medium">
                              {m.attachmentName}
                            </span>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Canned Curator Responses */}
              <div className="p-2.5 bg-[#090b0f] border-t border-white/[0.07] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-mono-code text-[#666b7a] whitespace-nowrap pl-1">
                  Quick reply:
                </span>
                {[
                  'Payment received. Vault asset unlocked.',
                  'Please provide your 12-digit bank UTR reference.',
                  'Transaction verified by administrator.',
                  'High-res master assets are available in your Vault.',
                ].map((canned, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickCanned(canned)}
                    className="px-2.5 py-1 rounded-md bg-[#12151c] hover:bg-[#181c25] border border-white/[0.06] text-[#9499a6] hover:text-white text-[11px] font-sans whitespace-nowrap transition-colors"
                  >
                    {canned}
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-[#0c0e13] border-t border-white/[0.07] flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official curatorial reply..."
                  className="flex-1 h-10 bg-[#181c25] border border-white/[0.08] focus:border-white/30 rounded-lg px-3.5 text-xs text-[#ededed] placeholder:text-slate-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="h-10 px-4 rounded-lg btn-primary text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all"
                >
                  <span>Dispatch</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#9499a6]">
              <MessageCircle className="w-10 h-10 text-[#666b7a] mb-2" />
              <p className="text-sm font-space font-medium text-[#ededed]">Select a collector thread</p>
              <p className="text-xs font-sans mt-0.5">Review message history and dispatch curatorial responses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChatInbox
