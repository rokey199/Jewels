import { Icon } from './Icon'

export function QuantitySelector({
  value,
  onChange,
  max = 99,
}: {
  value: number
  onChange: (v: number) => void
  max?: number
}) {
  const dec = () => onChange(Math.max(1, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <span className="qty">
      <button type="button" className="qty__btn" onClick={dec} disabled={value <= 1} aria-label="Decrease quantity">
        <Icon name="minus" width="15" height="15" />
      </button>
      <input
        className="qty__val"
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          onChange(Number.isNaN(n) ? 1 : Math.min(max, Math.max(1, n)))
        }}
        aria-label="Quantity"
      />
      <button type="button" className="qty__btn" onClick={inc} disabled={value >= max} aria-label="Increase quantity">
        <Icon name="plus" width="15" height="15" />
      </button>
    </span>
  )
}
