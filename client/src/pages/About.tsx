import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

const VALUES = [
  { icon: 'gem', title: 'Material honesty', text: 'Responsibly sourced stones, recycled metals, and full transparency on every piece.' },
  { icon: 'shield', title: 'Made to last', text: 'Jewellery should be worn for generations. We make it that way, and maintain it for life.' },
  { icon: 'sparkle', title: 'Quiet luxury', text: 'Design that speaks through proportion and finish — never logos or noise.' },
  { icon: 'chat', title: 'Personal by nature', text: 'Every commission begins with a conversation, and every client keeps our ear.' },
] as const

export default function About() {
  return (
    <>
      <section className="section">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Our Story</span>
          </nav>

          <div className="split" style={{ alignItems: 'center' }}>
            <div>
              <span className="eyebrow">The Maison</span>
              <h1 className="display-lg">Jewellery made slowly,<br />for the pieces you keep</h1>
              <p className="lead">
                Maison Dorée was founded on a simple conviction: that fine jewellery should be
                considered in every sense. Considered in its design, its materials, its making —
                and considered in the life it leads on the person who wears it.
              </p>
              <p className="lead">
                We are a small atelier. Our bench jewellers cast, set and finish by hand. Our
                gemologists travel to source stones by sight, not by certificate alone. And our
                designers still sketch every commission with a pencil before a single CAD line.
              </p>
            </div>
            <div className="split__media">
              <img src="/api/images/products/celeste-tennis-bracelet-1.svg" alt="Inside the Maison Dorée atelier" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">What we believe</span>
            <h2 className="display-md">Four principles, worn daily</h2>
          </div>
          <div className="grid grid--4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {VALUES.map((v) => (
              <div className="card card--pad" key={v.title}>
                <div style={{ color: 'var(--gold-deep)', marginBottom: 14 }}>
                  <Icon name={v.icon} width="30" height="30" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="cta-banner__inner">
            <div>
              <span className="eyebrow">Commission with us</span>
              <h2 className="display-lg" style={{ color: 'var(--cream)' }}>Your story, made into an heirloom</h2>
              <p className="lead">
                Whether it is an engagement, an anniversary or a personal rite of passage, our
                atelier designs one-of-one pieces around the meaning you give them.
              </p>
              <div className="cta-banner__actions">
                <Link to="/category/bespoke-custom" className="btn btn--primary">
                  Explore bespoke
                </Link>
                <Link to="/contact" className="btn btn--outline-light">
                  Book a consultation
                </Link>
              </div>
            </div>
            <div className="cta-banner__media">
              <img src="/api/images/products/solene-solitaire-1.svg" alt="A bespoke solitaire commission" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head section-head--center">
            <span className="eyebrow">Care</span>
            <h2 className="display-md">Every piece, cared for for life</h2>
          </div>
          <div className="grid grid--3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { title: 'Lifetime maintenance', text: 'Complimentary setting checks, cleaning and prong inspection for every piece we make.' },
              { title: 'Re-sourcing stones', text: 'If you ever want to change a stone, upgrade a centre, or repurpose an heirloom, we are here.' },
              { title: 'Refinement programme', text: 'Within 30 days of delivery we will refine, resize or restyle a piece — simply.' },
            ].map((c) => (
              <div className="card card--pad" key={c.title}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
