import { classNames, formatPrice } from '../lib/format'

export function Price({
  value,
  mrp,
  size = 'md',
  className,
}: {
  value: number
  mrp?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={classNames('pd-info__price-row', className)}>
      <span className={classNames('price', size === 'lg' && 'price--lg')}>{formatPrice(value)}</span>
      {mrp != null && mrp > value && <span className="price--mrp">{formatPrice(mrp)}</span>}
    </div>
  )
}
