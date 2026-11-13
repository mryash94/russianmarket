import { useState } from 'react'
import { Icon } from './Icon'
import { supabase, supabaseConfigError } from '../lib/supabase'

type Notice = {
  id: string
  title: string
  body: string
  notification_type: string
  read_at: string | null
  created_at: string
}

type NotificationState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'

export function NotificationCenter({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [state, setState] = useState<NotificationState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const unreadCount = notices.filter((notice) => !notice.read_at).length

  async function loadNotifications() {
    if (!userId) {
      setState('unavailable')
      return
    }
    if (!supabase) {
      setState('unavailable')
      return
    }

    setState('loading')
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, notification_type, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        setState('error')
        setErrorMessage('Notifications could not be loaded. Please try again later.')
        return
      }
      setNotices(data ?? [])
      setState('ready')
    } catch (error) {
      console.error('BLACK X failed to load notifications.', error)
      setState('error')
      setErrorMessage('Notifications could not be loaded. Please try again later.')
    }
  }

  async function markAsRead(notice: Notice) {
    if (!userId || !supabase || notice.read_at || markingId) return
    setMarkingId(notice.id)
    setErrorMessage(null)
    try {
      const readAt = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: readAt })
        .eq('id', notice.id)
        .eq('user_id', userId)
      if (error) {
        setErrorMessage('This notification could not be marked as read.')
        return
      }
      setNotices((current) => current.map((item) =>
        item.id === notice.id ? { ...item, read_at: readAt } : item,
      ))
    } catch (error) {
      console.error('BLACK X failed to update a notification.', error)
      setErrorMessage('This notification could not be marked as read.')
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <>
      <button
        type="button"
        className="topbar-icon-button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => {
          if (!open) void loadNotifications()
          setOpen((value) => !value)
        }}
      >
        <Icon name="bell" size={18} strokeWidth={1.7} aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}>
          <section className="notification-panel" role="dialog" aria-modal="true" aria-labelledby="notification-title">
            <header className="notification-panel-heading">
              <div>
                <span className="section-kicker">BLACK X</span>
                <h2 id="notification-title">Notifications</h2>
              </div>
              <button type="button" className="dialog-close" aria-label="Close notifications" onClick={() => setOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </header>
            {state === 'loading' || state === 'idle' ? (
              <p className="notification-empty" role="status">Loading notifications…</p>
            ) : state === 'unavailable' ? (
              <p className="notification-empty">
                {!userId ? 'Sign in to view account notifications.' : supabaseConfigError}
              </p>
            ) : state === 'error' ? (
              <p className="notification-empty" role="alert">{errorMessage}</p>
            ) : notices.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              <ul className="notification-list">
                {notices.map((notice) => (
                  <li className={`notification-item${notice.read_at ? '' : ' is-unread'}`} key={notice.id}>
                    <span className="notification-item-dot" aria-hidden="true" />
                    <div className="notification-item-copy">
                      <strong>{notice.title}</strong>
                      <p>{notice.body}</p>
                      <time dateTime={notice.created_at}>
                        {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(notice.created_at))}
                      </time>
                    </div>
                    {!notice.read_at && (
                      <button
                        type="button"
                        className="notification-mark-read"
                        disabled={markingId === notice.id}
                        onClick={() => void markAsRead(notice)}
                      >
                        {markingId === notice.id ? 'Saving…' : 'Mark read'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {errorMessage && state === 'ready' && <p className="notification-action-error" role="alert">{errorMessage}</p>}
          </section>
        </div>
      )}
    </>
  )
}
