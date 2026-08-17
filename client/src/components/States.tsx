import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`spinner ${className}`} role="status" aria-label="Loading" />
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <Spinner />
      <p className="state__desc">{label}</p>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon = 'gem',
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: 'gem' | 'chat' | 'package' | 'search' | 'star'
}) {
  return (
    <div className="state state--empty">
      <div className="state__icon">
        <Icon name={icon} width="30" height="30" />
      </div>
      <h3 className="state__title">{title}</h3>
      {description && <p className="state__desc">{description}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  action,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  action?: ReactNode
}) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon">
        <Icon name="alert" width="30" height="30" />
      </div>
      <h3 className="state__title">{title}</h3>
      {description && <p className="state__desc">{description}</p>}
      <div className="state__action">
        {onRetry && (
          <button className="btn btn--outline btn--sm" onClick={onRetry}>
            Try again
          </button>
        )}
        {action}
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8, columns = 4 }: { count?: number; columns?: 2 | 3 | 4 }) {
  return (
    <div className={`grid grid--${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden' }}>
          <div className="skeleton" style={{ aspectRatio: '1 / 1' }} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton" style={{ height: 14, width: '70%' }} />
            <div className="skeleton" style={{ height: 12, width: '45%' }} />
            <div className="skeleton" style={{ height: 16, width: '55%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${100 - i * 18}%` }} />
      ))}
    </div>
  )
}
