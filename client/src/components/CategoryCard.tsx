import { Link } from 'react-router-dom'
import type { Category } from '../api/types'
import { Icon } from './Icon'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card" aria-label={category.name}>
      {category.image ? (
        <img src={category.image} alt={category.name} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%' }} className="skeleton" />
      )}
      <div className="category-card__arrow">
        <Icon name="arrow-right" width="18" height="18" />
      </div>
      <div className="category-card__label">
        <div className="category-card__name">{category.name}</div>
        <div className="category-card__count">
          {category.type === 'display' ? 'Bespoke & Commissions' : `${category.productCount ?? 0} pieces`}
        </div>
      </div>
    </Link>
  )
}
