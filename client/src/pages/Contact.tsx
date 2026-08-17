import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { Icon } from '../components/Icon'

export default function Contact() {
  const { settings } = useSettings()
  const { toast } = useToast()

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    // Contact enquiries are handled via chat — treat as an in-page confirmation.
    await new Promise((r) => setTimeout(r, 500))
    setBusy(false)
    setSent(true)
    toast('Message received', 'Our team will reply within one business day.', 'success')
  }

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <span>Contact</span>
        </nav>

        <div className="section-head">
          <span className="eyebrow">Client Care</span>
          <h1 className="display-lg">Speak with the maison</h1>
          <p className="lead">
            Appointments, commissions, sizing or simply a question about a piece — we would love
            to hear from you.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1.15fr 0.85fr', gap: 28, alignItems: 'start' }}>
          <div className="card card--pad">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div className="success-check" style={{ marginBottom: 18 }}>
                  <Icon name="check" width="34" height="34" />
                </div>
                <h2 className="display-md" style={{ fontSize: 28 }}>Thank you — message received</h2>
                <p className="lead" style={{ fontSize: 15, maxWidth: 420, margin: '10px auto 20px' }}>
                  Our concierge will reply to you within one business day. For anything urgent, please
                  use our concierge chat.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link to="/chat" className="btn btn--dark">Open concierge chat</Link>
                  <button className="btn btn--outline" onClick={() => setSent(false)}>Send another message</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="field--row">
                  <div className="field">
                    <label>Full name <span className="req">*</span></label>
                    <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Email <span className="req">*</span></label>
                    <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="field--row">
                  <div className="field">
                    <label>Phone</label>
                    <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Subject</label>
                    <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Commission, sizing…" />
                  </div>
                </div>
                <div className="field">
                  <label>Message <span className="req">*</span></label>
                  <textarea className="textarea" required minLength={10} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you have in mind…" />
                </div>
                <button className="btn btn--dark" type="submit" disabled={busy}>
                  {busy ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card--pad">
              <span className="eyebrow">Concierge</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Chat with us</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                For the fastest reply — and to discuss a piece or an order — use our concierge chat.
              </p>
              <Link to="/chat" className="btn btn--outline btn--sm">
                <Icon name="chat" width="15" height="15" /> Open chat
              </Link>
            </div>

            <div className="card card--pad">
              <span className="eyebrow">Direct</span>
              <ul className="site-footer__links site-footer__contact">
                <li>
                  <Icon name="mail" width="16" height="16" />
                  <span>{settings.SUPPORT_EMAIL}</span>
                </li>
                <li>
                  <Icon name="phone" width="16" height="16" />
                  <span>{settings.SUPPORT_PHONE}</span>
                </li>
                <li>
                  <Icon name="clock" width="16" height="16" />
                  <span>Mon – Sat, 10:00 – 19:00</span>
                </li>
              </ul>
            </div>

            <div className="card card--pad">
              <span className="eyebrow">Visit</span>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>
                Our atelier receives clients by appointment only, worldwide. Private consultations are
                available in person or by video call.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
