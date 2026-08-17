import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../hooks/useUnread'
import { useToast } from '../context/ToastContext'
import { classNames, initials } from '../lib/format'
import { Icon } from './Icon'
import { NotificationCenter } from './NotificationCenter'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Collection' },
  { to: '/category/bespoke-custom', label: 'Bespoke' },
  { to: '/about', label: 'Maison' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const { customer, logout } = useAuth()
  const { chat } = useUnread()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogout = async () => {
    await logout()
    setAccountOpen(false)
    setMobileOpen(false)
    toast('Signed out', 'Thank you for visiting Maison Dorée.')
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__bar">
          <Link to="/" className="brand" aria-label="Maison Dorée home">
            <span className="brand__mark">
              Maison<span> Dorée</span>
            </span>
            <span className="brand__tag">Fine Jewellery</span>
          </Link>

          <nav className="main-nav" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => classNames('main-nav__link', isActive && 'is-active')}
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-btn" aria-label="Search" onClick={() => navigate('/search')}>
              <Icon name="search" />
            </button>
            {customer && (
              <>
                <Link className="icon-btn" to="/chat" aria-label="Chat" style={{ position: 'relative' }}>
                  <Icon name="chat" />
                  {chat > 0 && <span className="icon-btn__dot">{chat > 9 ? '9+' : chat}</span>}
                </Link>
                <NotificationCenter />
              </>
            )}

            {customer ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="account-link"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--ivory-2)',
                      border: '1px solid var(--line-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--gold-deep)',
                    }}
                  >
                    {initials(customer.name)}
                  </span>
                  <span className="account-link__text">{customer.name.split(' ')[0]}</span>
                </button>
                {accountOpen && (
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: 230,
                      zIndex: 120,
                      boxShadow: 'var(--shadow-lg)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                      <strong style={{ fontSize: 14 }}>{customer.name}</strong>
                      <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{customer.email}</div>
                    </div>
                    <div style={{ padding: 8 }}>
                      <Link to="/account" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                        <Icon name="user" width="16" height="16" /> Account
                      </Link>
                      <Link to="/account?tab=orders" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                        <Icon name="package" width="16" height="16" /> My Orders
                      </Link>
                      <Link to="/chat" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                        <Icon name="chat" width="16" height="16" /> My Chats
                      </Link>
                      <button className="account-menu-item" onClick={handleLogout} style={{ width: '100%' }}>
                        <Icon name="logout" width="16" height="16" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/account" className="account-link">
                <span className="account-link__text">Sign In</span>
              </Link>
            )}

            <button
              className="icon-btn mobile-nav-toggle"
              aria-label="Menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <Icon name={mobileOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-nav">
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0 18px' }} aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => classNames('mobile-nav-link', isActive && 'is-active')}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/chat" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
              Chat with us
            </Link>
            {!customer && (
              <Link to="/account" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>
                Sign in / Create account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
