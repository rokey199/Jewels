import type { ChatMessage as ChatMessageType } from '../api/types'
import { classNames, formatTime } from '../lib/format'
import { Icon } from './Icon'

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isSystem = message.sender === 'system'
  const isCustomer = message.sender === 'customer'
  return (
    <div className={classNames('msg', isSystem ? 'msg--system' : isCustomer ? 'msg--customer' : 'msg--admin')}>
      {isSystem && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, fontWeight: 600, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <Icon name="gem" width="14" height="14" /> Maison Dorée
        </div>
      )}
      {message.body}
      <div className="msg__meta">
        <span>{formatTime(message.createdAt)}</span>
        {!isSystem && (
          <span className="msg__read" title={message.read ? 'Read' : 'Sent'}>
            {message.read ? 'Read' : 'Sent'}
          </span>
        )}
      </div>
    </div>
  )
}
