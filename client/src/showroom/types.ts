import type { Category, Product } from '../api/types'

/**
 * Showroom domain types.
 *
 * The showroom is deliberately decoupled from the e-commerce system. The web
 * storefront (products, orders, chat, reviews) never imports or depends on
 * Three.js or any rendering technology. Instead, both the current 2D experience
 * and the future 3D showroom read from the same normalized showroom scene data,
 * so the 3D module can be added later without touching the e-commerce code.
 */

export interface ShowroomAsset {
  /** Future 3D asset reference, e.g. a GLB path. Empty while 3D is disabled. */
  type: 'glb' | 'hdri' | 'texture' | 'image' | 'none'
  src?: string
  label?: string
}

export interface ShowroomCamera {
  position?: [number, number, number]
  target?: [number, number, number]
  fov?: number
}

export interface ShowroomAnimation {
  entrance?: string
  idle?: string
}

/**
 * A showroom scene maps one display room to a category, its top products and
 * the future 3D metadata (scene id, assets, camera, animation).
 */
export interface ShowroomScene {
  id: string
  title: string
  subtitle: string
  image: string | null
  displayOrder: number
  category: Category | null
  topProducts: Product[]
  assets: ShowroomAsset[]
  camera: ShowroomCamera | null
  animation: ShowroomAnimation | null
}

/**
 * Build a normalized showroom scene from a category and its top products.
 * The future 3D module consumes exactly this shape.
 */
export function buildShowroomScene(category: Category | null, topProducts: Product[], index = 0): ShowroomScene {
  return {
    id: category?.showroomSceneId || `showroom-scene-${category?.slug || 'default'}`,
    title: category?.name || 'The Maison',
    subtitle: category?.description || 'A curated experience of considered fine jewellery.',
    image: category?.image || null,
    displayOrder: category?.displayOrder ?? index,
    category,
    topProducts,
    assets: [],
    camera: (category as { showroomCamera?: ShowroomCamera | null } | null)?.showroomCamera ?? null,
    animation: null,
  }
}
