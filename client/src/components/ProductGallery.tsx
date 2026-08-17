import { useState } from 'react'
import { classNames } from '../lib/format'

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  const safe = images.length > 0 ? images : []
  const current = safe[Math.min(active, Math.max(0, safe.length - 1))]

  return (
    <div className="pd-gallery">
      <div className="pd-gallery__main">
        {current ? (
          <img src={current} alt={`${title} — view ${active + 1}`} />
        ) : (
          <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1' }} />
        )}
      </div>
      {safe.length > 1 && (
        <div className="pd-gallery__thumbs">
          {safe.map((src, i) => (
            <button
              key={src + i}
              className={classNames('pd-gallery__thumb', i === active && 'is-active')}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
