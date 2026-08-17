import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="state">
          <div className="state__icon" style={{ background: 'var(--ivory-2)', color: 'var(--gold-deep)' }}>
            <Icon name="gem" width="30" height="30" />
          </div>
          <h1 className="state__title" style={{ fontSize: 44 }}>404</h1>
          <h2 className="state__title" style={{ fontSize: 24 }}>This page has not been found</h2>
          <p className="state__desc">The page you are looking for may have moved or no longer exists.</p>
          <div className="state__action">
            <Link to="/" className="btn btn--dark">Return home</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
