export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  status: string
  featured: boolean
  displayOrder: number
  type: 'normal' | 'display'
  showroomSceneId: string | null
  showroomCamera: unknown
  createdAt: string
  updatedAt: string
  productCount?: number
}

export interface VariationOption {
  value: string
  priceDelta?: number
  inStock?: boolean
}

export interface VariationGroup {
  name: string
  options: VariationOption[]
}

export interface Specification {
  label: string
  value: string
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  shortDescription: string | null
  categoryId: string | null
  price: number
  mrp: number | null
  discount: number | null
  sku: string
  stock: number
  availability: 'in_stock' | 'out_of_stock' | 'made_to_order' | 'pre_order'
  featured: boolean
  status: string
  images: string[]
  specifications: Specification[]
  variations: VariationGroup[]
  tags: string[]
  seoTitle: string | null
  seoDescription: string | null
  showroomCategoryId: string | null
  showroomSceneId: string | null
  displayOrder: number
  popularity: number
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string; slug: string }
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface Review {
  id: string
  productId: string
  orderId: string | null
  rating: number
  reviewText: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'
  verifiedPurchase: boolean
  customerName: string
  createdAt: string
}

export interface RatingDistribution {
  star: number
  count: number
  percent: number
}

export interface ProductDetail {
  product: Product
  reviews: Review[]
  ratingSummary: { count: number; average: number }
  ratingDistribution: RatingDistribution[]
  related: Product[]
  similar: Product[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  role: 'customer' | 'admin'
  status: string
  emailVerified: boolean
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

export interface Address {
  name: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderItem {
  productId: string
  title: string
  slug: string
  sku: string
  image: string | null
  unitPrice: number
  quantity: number
  priceDelta: number
}

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'DISCUSSION'
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export interface Order {
  id: string
  orderNumber: string
  customerId: string | null
  status: OrderStatus
  items: OrderItem[]
  selectedVariations: { name: string; value: string; priceDelta?: number }[]
  quantity: number
  subtotal: number
  discount: number
  customizationCharge: number
  shippingCharge: number
  finalAmount: number
  customerNotes: string | null
  adminNotes: string | null
  address: Address | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  paidAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  conversation?: ChatConversation | null
}

export interface ChatConversation {
  id: string
  customerId: string
  productId: string | null
  orderId: string | null
  subject: string | null
  status: string
  lastMessageAt: string | null
  unreadCustomer: number
  unreadAdmin: number
  createdAt: string
  updatedAt: string
  productTitle?: string | null
  productImage?: string | null
  orderNumber?: string | null
  customerName?: string | null
}

export interface ChatMessage {
  id: string
  conversationId: string
  sender: 'customer' | 'admin' | 'system'
  body: string
  read: boolean
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  relatedEntity: string | null
  read: boolean
  createdAt: string
}

export interface Settings {
  SHOWROOM_3D_ENABLED: boolean
  SITE_NAME: string
  SITE_TAGLINE: string
  SUPPORT_EMAIL: string
  SUPPORT_PHONE: string
}

export interface ProductFilters {
  q?: string
  category?: string
  categoryType?: string
  priceMin?: number
  priceMax?: number
  availability?: string
  featured?: boolean
  sort?: string
  page?: number
  limit?: number
}
