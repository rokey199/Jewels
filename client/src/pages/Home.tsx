import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShowroom } from '../showroom/ShowroomProvider'
import { ShowroomExperience } from '../showroom/ShowroomExperience'
import { CategoryCard } from '../components/CategoryCard'
import { ProductCard } from '../components/ProductCard'
import { SkeletonGrid } from '../components/States'
import { Icon } from '../components/Icon'

const TRUST_ITEMS = [
  { icon: 'gem', title: 'Atelier Crafted', sub: 'Hand-finished in our own atelier' },
  { icon: 'truck', title: 'Worldwide Delivery', sub: 'Insured, discreet, on time' },
  { icon: 'shield', title: 'Lifetime Care', sub: 'Complimentary setting checks' },
  { icon: 'refresh', title: '30-Day Consideration', sub: 'Exchange or refine, simply' },
] as const

export default function Home() {
  const { featuredProducts, categories, loading } = useShowroom()
  const [storyImage, setStoryImage] = useState<string | null>(null)

  useEffect(() => {
    if (!storyImage) {
      setStoryImage('/api/images/products/celeste-tennis-bracelet-1.svg')
    }
  }, [storyImage])

  const normalCategories = categories.filter((c) => c.type === 'normal').slice(0, 5)
  const featured = featuredProducts.filter((p) => p.featured).slice(0, 8)
  const displayCategory = categories.find((c) => c.type === 'display')

  return (
    <>
      {/* 1. Hero — a premium 2D experience through the ShowroomExperience seam */}
      <section className="hero">
        <div className="container">
          <ShowroomExperience
            variant="hero"
            eyebrow="Fine Jewellery, Considered"
            title={
              displayCategory
                ? `The Maison Dorée\nExperience`
                : 'Jewellery with\na quiet confidence'
            }
            subtitle="Handcrafted in our atelier from responsibly sourced stones and recycled precious metals. Each piece is designed to be lived in, and to be remembered."
            image={displayCategory?.image || undefined}
          />
        </div>
      </section>

      {/* 2. Trust strip */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-strip__inner">
            {TRUST_ITEMS.map((t) => (
              <div className="trust-item" key={t.title}>
                <span className="trust-item__icon">
                  <Icon name={t.icon} width="30" height="30" />
                </span>
                <span>
                  <span className="trust-item__title" style={{ display: 'block' }}>{t.title}</span>
                  <span className="trust-item__sub">{t.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured categories */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The Collections</span>
            <h2 className="display-lg">Explore by the piece you imagine</h2>
            <p className="lead">From everyday essentials to once-in-a-lifetime commissions — every collection is designed and finished in our atelier.</p>
          </div>
          {loading ? (
            <SkeletonGrid count={5} columns={3} />
          ) : (
            <div className="grid grid--categories">
              {normalCategories.map((c) => (
                <CategoryCard key={c.slug} category={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Featured pieces */}
      <section className="section section--muted">
        <div className="container">
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: '100%', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow">Signature Pieces</span>
              <h2 className="display-lg">The pieces our clients return for</h2>
            </div>
            <Link to="/products" className="btn btn--outline">
              View the Collection <Icon name="arrow-right" width="16" height="16" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid--4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <SkeletonGrid count={4} />
          )}
        </div>
      </section>

      {/* 5. Brand story / luxury experience */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div className="split__media">
              <img src={storyImage || undefined} alt="Inside the Maison Dorée atelier" loading="lazy" />
            </div>
            <div>
              <span className="eyebrow">The Maison</span>
              <h2 className="display-md">Made slowly, worn for generations</h2>
              <p className="lead">
                Every Maison Dorée piece begins as a conversation. Our designers sketch, our
                gemologists source, and our bench jewellers cast, set and finish by hand —
                the way fine jewellery has always been made.
              </p>
              <ul className="split__features">
                <li><Icon name="check" width="16" height="16" /> Responsibly sourced stones and recycled metals</li>
                <li><Icon name="check" width="16" height="16" /> Handmade in our atelier, never mass-produced</li>
                <li><Icon name="check" width="16" height="16" /> Hallmarked, certified and lifetime maintained</li>
                <li><Icon name="check" width="16" height="16" /> Private consultations by appointment</li>
              </ul>
              <Link to="/about" className="btn btn--outline">
                Our Story <Icon name="arrow-right" width="16" height="16" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Custom design CTA */}
      <section className="section section--dark">
        <div className="container">
          <div className="cta-banner__inner">
            <div>
              <span className="eyebrow">Bespoke &amp; Commissions</span>
              <h2 className="display-lg" style={{ color: 'var(--cream)' }}>A piece designed around your story</h2>
              <p className="lead">
                An heirloom begins with an idea. Tell our atelier about the occasion, the person
                and the meaning — we design, sketch and craft a one-of-one piece that only you own.
              </p>
              <div className="cta-banner__actions">
                <Link to="/category/bespoke-custom" className="btn btn--primary">
                  Start a Commission
                </Link>
                <Link to="/contact" className="btn btn--outline-light">
                  Book a Private Consultation
                </Link>
              </div>
            </div>
            <div className="cta-banner__media">
              <img src="/api/images/products/bespoke-commission-1.svg" alt="Bespoke commission" loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
