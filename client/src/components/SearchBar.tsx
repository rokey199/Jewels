import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Search the collection…',
  autoFocus = false,
  size = 'sm',
}: {
  initialValue?: string
  onSearch?: (q: string) => void
  placeholder?: string
  autoFocus?: boolean
  size?: 'sm' | 'lg'
}) {
  const [value, setValue] = useState(initialValue)
  const navigate = useNavigate()

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = value.trim()
    if (onSearch) {
      onSearch(q)
    } else {
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 10, width: '100%' }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex' }}>
          <Icon name="search" width={size === 'lg' ? 20 : 17} height={size === 'lg' ? 20 : 17} />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 46, paddingTop: size === 'lg' ? 17 : 14, paddingBottom: size === 'lg' ? 17 : 14 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search"
        />
      </div>
      <button className="btn btn--dark" type="submit">
        Search
      </button>
    </form>
  )
}
