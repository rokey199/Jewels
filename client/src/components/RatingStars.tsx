import { Icon } from './Icon'
import { classNames } from '../lib/format'

export function RatingStars({
  rating,
  size = 'md',
  showEmpty = true,
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showEmpty?: boolean
}) {
  const clamped = Math.max(0, Math.min(5, rating))
  const full = Math.floor(clamped)
  const half = clamped - full >= 0.25 && clamped - full < 0.85
  const rounded = half ? full + 0.5 : Math.round(clamped)

  return (
    <span className={classNames('stars', size === 'lg' && 'stars--lg', size === 'sm' && 'stars--sm')}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= Math.floor(rounded) || (i === Math.ceil(rounded) && half)
        return (
          <span key={i} className={active || (showEmpty && i <= rounded) ? undefined : 'stars__off'}>
            <Icon name="star" width={size === 'lg' ? 22 : size === 'sm' ? 15 : 18} height={size === 'lg' ? 22 : size === 'sm' ? 15 : 18} fill={active ? 'currentColor' : 'none'} />
          </span>
        )
      })}
    </span>
  )
}
