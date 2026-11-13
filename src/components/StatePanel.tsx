import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type StateKind = 'loading' | 'empty' | 'error'

type StatePanelProps = {
  kind: StateKind
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

const stateIcons: Record<StateKind, IconName> = {
  loading: 'loader-circle',
  empty: 'package-open',
  error: 'alert-circle',
}

const roleByKind: Record<StateKind, 'status' | 'alert'> = {
  loading: 'status',
  empty: 'status',
  error: 'alert',
}

export function StatePanel({
  kind,
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: StatePanelProps) {
  const iconName = stateIcons[kind]

  return (
    <div className={`state-panel state-panel--${kind}`} role={roleByKind[kind]}>
      <span className="state-icon" aria-hidden="true">
        {icon ?? <Icon name={iconName} size={21} strokeWidth={1.6} />}
      </span>
      <div className="state-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actionLabel && onAction && (
        <button type="button" className="state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
