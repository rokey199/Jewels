import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useShowroom } from './ShowroomProvider'
import { buildShowroomScene, type ShowroomScene } from './types'
import type { Product } from '../api/types'
import { Icon } from '../components/Icon'
import { ProductCard } from '../components/ProductCard'

/**
 * Future-ready 3D seam: the module below does not exist yet. It is only
 * requested — and only ever at runtime — when SHOWROOM_3D_ENABLED becomes true.
 * Until then no 3D code or assets are loaded or bundled into the experience.
 */
const SHOWROOM_3D_MODULE = '../showroom/three/Showroom3D.tsx'

function Showroom3DFallback() {
  return null
}

const Showroom3D = lazy(() =>
  import(/* @vite-ignore */ SHOWROOM_3D_MODULE).catch(() => ({
    default: Showroom3DFallback,
  }))
)

export interface ShowroomExperienceProps {
  scene?: ShowroomScene | null
  variant?: 'hero' | 'featured'
  title?: string
  subtitle?: string
  image?: string
  eyebrow?: string
  ctaLabel?: string
  ctaTo?: string
  children?: React.ReactNode
  topProducts?: Product[]
}

/**
 * ShowroomExperience is the single entry point for the showroom experience.
 *
 * Today (SHOWROOM_3D_ENABLED=false) it renders a premium 2D experience from
 * normalized scene data. When the flag is flipped in the future, the 3D module
 * replaces the media panel here without touching the storefront, products,
 * orders or chat systems.
 */
export function ShowroomExperience({
  scene,
  variant = 'hero',
  title,
  subtitle,
  image,
  eyebrow = 'The Showroom',
  ctaLabel = 'Explore the Collection',
  ctaTo = '/products',
  children,
  topProducts,
}: ShowroomExperienceProps) {
  const { showroomEnabled } = useSettings()
  const { scenes, featuredProducts } = useShowroom()

  const activeScene = useMemo<ShowroomScene>(() => {
    if (scene) return scene
    const first = scenes.find((s) => s.category?.type === 'display') || scenes[0]
    if (first) return first
    return buildShowroomScene(
      null,
      featuredProducts.slice(0, 5),
      0
    )
  }, [scene, scenes, featuredProducts])

  const products = topProducts || activeScene.topProducts

  const mediaImage = image || activeScene.image

  const render3D = showroomEnabled && variant === 'hero'

  return (
    <div className={`showroom showroom--${variant}`} data-showroom-scene={activeScene.id}>
      {render3D ? (
        <Suspense fallback={<div className="spinner spinner--center" />}>
          <Showroom3D scene={activeScene} />
        </Suspense>
      ) : (
        <div className="showroom__fallback">
          {variant === 'hero' && (
            <div className="hero__inner">
              <div className="hero__copy">
                {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                <h1 className="display-xl">{title || activeScene.title}</h1>
                <p className="lead">{subtitle || activeScene.subtitle}</p>
                <div className="hero__cta">
                  <Link to={ctaTo} className="btn btn--dark">
                    {ctaLabel}
                  </Link>
                  <Link to="/category/bespoke-custom" className="btn btn--outline">
                    Commission a Piece
                  </Link>
                </div>
                {children}
              </div>
                <div className="hero__media">
                  <div className="hero__media-frame" />
                  {mediaImage ? (
                    <img src={mediaImage} alt={activeScene.title} />
                  ) : (
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '4 / 5' }} />
                  )}
                <div className="hero__note">“Jewellery is the most changeable of all things.”</div>
              </div>
            </div>
          )}

          {variant === 'featured' && (
            <div className="featured-room">
              <div className="split">
                <div className="split__media">
                  {mediaImage ? (
                    <img src={mediaImage} alt={activeScene.title} loading="lazy" />
                  ) : (
                    <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1' }} />
                  )}
                </div>
                <div>
                  {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                  <h2 className="display-md">{title || activeScene.title}</h2>
                  <p className="lead">{subtitle || activeScene.subtitle}</p>
                  {activeScene.category && (
                    <Link to={`/category/${activeScene.category.slug}`} className="btn btn--outline">
                      View the Room <Icon name="arrow-right" width="16" height="16" />
                    </Link>
                  )}
                </div>
              </div>

              {products.length > 0 && (
                <div style={{ marginTop: 36 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0 }}>Inside this room</h3>
                    <Link to="/products" style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-deep)' }}>
                      View all
                    </Link>
                  </div>
                  <div className="grid grid--4">
                    {products.slice(0, 4).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
