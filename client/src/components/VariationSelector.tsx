import type { VariationGroup } from '../api/types'
import { classNames, formatPrice } from '../lib/format'

export interface VariationSelection {
  name: string
  value: string
}

export function VariationSelector({
  groups,
  selected,
  onChange,
}: {
  groups: VariationGroup[]
  selected: VariationSelection[]
  onChange: (selection: VariationSelection[]) => void
}) {
  if (!groups || groups.length === 0) return null

  const setValue = (groupName: string, value: string) => {
    const next = selected.filter((s) => s.name !== groupName)
    next.push({ name: groupName, value })
    onChange(next)
  }

  return (
    <>
      {groups.map((group) => {
        const current = selected.find((s) => s.name === group.name)
        return (
          <div className="variation-block" key={group.name}>
            <div className="variation-block__head">
              <span className="variation-block__name">{group.name}</span>
              <span className="variation-block__selected">{current?.value || 'Select'}</span>
            </div>
            <div className="variation-options" role="group" aria-label={group.name}>
              {group.options.map((opt) => {
                const active = current?.value === opt.value
                const unavailable = opt.inStock === false
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={classNames('var-option', active && 'is-active')}
                    disabled={unavailable}
                    onClick={() => setValue(group.name, opt.value)}
                  >
                    {opt.value}
                    {opt.priceDelta ? (
                      <span style={{ opacity: 0.7, marginLeft: 4 }}>
                        {opt.priceDelta > 0 ? `+${formatPrice(opt.priceDelta)}` : formatPrice(opt.priceDelta)}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
