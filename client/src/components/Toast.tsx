import { useToast } from '../context/ToastContext'
import { Icon } from './Icon'

export function ToastStack() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <span style={{ flex: 'none', marginTop: 2, color: t.tone === 'success' ? 'var(--gold)' : t.tone === 'error' ? 'var(--error)' : 'var(--gold-light)' }}>
            <Icon name={t.tone === 'success' ? 'check-circle' : t.tone === 'error' ? 'alert' : 'bell'} width="18" height="18" />
          </span>
          <div>
            <strong style={{ display: 'block', fontSize: 13.5 }}>{t.title}</strong>
            {t.message && <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{t.message}</div>}
          </div>
          <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <Icon name="close" width="14" height="14" />
          </button>
        </div>
      ))}
    </div>
  )
}
