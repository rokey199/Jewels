import { ORDER_STATUS_LABELS, STATUS_FLOW } from '../lib/format'
import type { OrderStatus } from '../api/types'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`order-status status-${status}`}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  )
}

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const index = STATUS_FLOW.indexOf(status)

  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="status-timeline" style={{ justifyContent: 'center' }}>
        <div className="status-step is-current" style={{ maxWidth: 220 }}>
          <div className="status-step__label">{ORDER_STATUS_LABELS[status]}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="status-timeline">
      {STATUS_FLOW.map((step, i) => {
        const done = index >= i
        const current = index === i
        return (
          <div key={step} className={`status-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
            <div className="status-step__label">{ORDER_STATUS_LABELS[step]}</div>
          </div>
        )
      })}
    </div>
  )
}
