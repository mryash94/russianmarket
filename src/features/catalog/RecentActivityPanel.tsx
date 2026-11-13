import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { supabase, supabaseConfigError } from '../../lib/supabase'
import type { OrderStatus } from '../../types/database'

type RecentOrder = {
  id: string
  status: OrderStatus
  subtotal_minor: number
  currency: string
  created_at: string
}

type ActivityState =
  | { kind: 'loading' }
  | { kind: 'ready'; userId: string; orders: RecentOrder[] }
  | { kind: 'error'; userId: string; message: string }

function formatAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amountMinor / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function RecentActivityPanel({ userId }: { userId: string | null }) {
  const [state, setState] = useState<ActivityState>({ kind: 'loading' })

  useEffect(() => {
    let active = true
    if (!userId || !supabase) return

    const client = supabase
    const accountId = userId
    async function loadActivity() {
      try {
        const { data, error } = await client
          .from('orders')
          .select('id, status, subtotal_minor, currency, created_at')
          .eq('user_id', accountId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (!active) return
        if (error) {
          setState({ kind: 'error', userId: accountId, message: 'Your recent order activity could not be loaded.' })
          return
        }
        setState({ kind: 'ready', userId: accountId, orders: data ?? [] })
      } catch (error) {
        if (!active) return
        console.error('BLACK X failed to load recent order activity.', error)
        setState({ kind: 'error', userId: accountId, message: 'Your recent order activity could not be loaded.' })
      }
    }

    void loadActivity()

    return () => { active = false }
  }, [userId])

  return (
    <aside className="activity-panel" aria-labelledby="activity-title">
      <div className="activity-panel-heading">
        <div>
          <span className="section-kicker">ACCOUNT ACTIVITY</span>
          <h2 id="activity-title">Recent orders</h2>
        </div>
        <span className="activity-heading-mark" aria-hidden="true">
          <Icon name="activity" size={17} />
        </span>
      </div>
      {state.kind === 'loading' ? (
        userId && supabase
          ? <p className="activity-message" role="status">Loading your order activity…</p>
          : <p className="activity-message">{userId ? supabaseConfigError ?? 'Order activity is not configured.' : 'Sign in to see activity for your account.'}</p>
      ) : !userId || !supabase ? (
        <p className="activity-message">{userId ? supabaseConfigError ?? 'Order activity is not configured.' : 'Sign in to see activity for your account.'}</p>
      ) : state.userId !== userId ? (
        <p className="activity-message" role="status">Loading your order activity…</p>
      ) : state.kind === 'error' ? (
        <p className="activity-message activity-message--error" role="alert">{state.message}</p>
      ) : state.orders.length === 0 ? (
        <p className="activity-message">No orders to show yet. Your real account activity will appear here.</p>
      ) : (
        <ul className="activity-order-list">
          {state.orders.map((order) => (
            <li className="activity-order" key={order.id}>
              <span className={`activity-order-icon activity-order-icon--${order.status}`} aria-hidden="true">
                <Icon name="package-open" size={15} />
              </span>
              <span className="activity-order-main">
                <strong>Digital order</strong>
                <span>{formatDate(order.created_at)} · {order.status}</span>
              </span>
              <span className="activity-order-amount">
                {formatAmount(order.subtotal_minor, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
