import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { Icon } from './Icon'

export function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <div className="site-footer__brand">
              Maison<span> Dorée</span>
            </div>
            <p className="site-footer__about">
              {settings.SITE_TAGLINE}. Every piece is designed, cast and finished by hand in our atelier
              — from first sketch to final hallmark.
            </p>
          </div>

          <div>
            <div className="site-footer__title">Collection</div>
            <ul className="site-footer__links">
              <li><Link to="/products">All Pieces</Link></li>
              <li><Link to="/category/necklaces">Necklaces</Link></li>
              <li><Link to="/category/rings">Rings</Link></li>
              <li><Link to="/category/earrings">Earrings</Link></li>
              <li><Link to="/category/bracelets">Bracelets</Link></li>
            </ul>
          </div>

          <div>
            <div className="site-footer__title">Maison</div>
            <ul className="site-footer__links">
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/category/bespoke-custom">Bespoke &amp; Commissions</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/account">My Account</Link></li>
              <li><Link to="/chat">Chat With Us</Link></li>
            </ul>
          </div>

          <div>
            <div className="site-footer__title">Client Care</div>
            <ul className="site-footer__links site-footer__contact">
              <li>
                <Icon name="phone" width="16" height="16" />
                <span>{settings.SUPPORT_PHONE}</span>
              </li>
              <li>
                <Icon name="mail" width="16" height="16" />
                <span>{settings.SUPPORT_EMAIL}</span>
              </li>
              <li>
                <Icon name="map-pin" width="16" height="16" />
                <span>By appointment only, worldwide</span>
              </li>
              <li>
                <Icon name="clock" width="16" height="16" />
                <span>Mon – Sat, 10:00 – 19:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Maison Dorée. All rights reserved.</span>
          <span>Handcrafted fine jewellery · {settings.SITE_TAGLINE}</span>
        </div>
      </div>
    </footer>
  )
}
