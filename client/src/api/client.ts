import type {
  Category,
  ChatConversation,
  ChatMessage,
  Customer,
  Notification,
  Order,
  ProductDetail,
  ProductFilters,
  ProductListResponse,
  Review,
  Settings,
} from './types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body
      ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
      : options.headers,
    credentials: 'include',
    ...options,
  })

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = (data as { error?: string })?.error || `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data as T
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) {
      qs.set(k, String(v))
    }
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // Settings
  getSettings: () => request<{ settings: Settings }>('/settings/public'),

  // Auth
  me: () => request<{ customer: Customer | null }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ customer: Customer }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: { name: string; email: string; phone?: string; password: string }) =>
    request<{ customer: Customer }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  updateProfile: (payload: { name: string; phone: string }) =>
    request<{ customer: Customer }>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  updatePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>('/auth/password', { method: 'PUT', body: JSON.stringify(payload) }),
  updateAddress: (payload: {
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }) => request<{ customer: Customer }>('/auth/address', { method: 'PUT', body: JSON.stringify(payload) }),

  // Categories
  getCategories: (params?: { type?: string; featured?: boolean }) =>
    request<{ items: Category[] }>(`/categories${toQuery({ ...params })}`),

  getCategory: (slug: string) => request<Category>(`/categories/${slug}`),

  // Products
  getProducts: (filters: ProductFilters = {}) =>
    request<ProductListResponse>(
      `/products${toQuery({
        q: filters.q,
        category: filters.category,
        categoryType: filters.categoryType,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        availability: filters.availability,
        featured: filters.featured,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      })}`
    ),
  getProduct: (slug: string) => request<ProductDetail>(`/products/${slug}`),

  // Orders
  createOrder: (payload: Record<string, unknown>) =>
    request<{ order: Order; conversation: ChatConversation }>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () => request<{ items: Order[] }>('/orders/mine'),
  getOrder: (id: string) => request<{ order: Order; conversation: ChatConversation | null }>(`/orders/${id}`),

  // Chat
  getConversations: () => request<{ items: ChatConversation[] }>('/chat/conversations'),
  createConversation: (payload: { productId?: string; orderId?: string; subject?: string }) =>
    request<{ conversation: ChatConversation }>('/chat/conversations', { method: 'POST', body: JSON.stringify(payload) }),
  getConversation: (id: string) => request<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/chat/conversations/${id}`),
  sendMessage: (id: string, body: string) =>
    request<{ message: ChatMessage }>(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  getUnreadChat: () => request<{ count: number }>('/chat/unread-count'),

  // Reviews
  submitReview: (payload: { productId: string; orderId?: string; rating: number; reviewText: string }) =>
    request<{ review: Review }>('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getMyReviews: () =>
    request<{ items: (Review & { productTitle?: string; productSlug?: string; productImage?: string | null })[] }>('/reviews/mine'),

  // Notifications
  getNotifications: () => request<{ items: Notification[] }>('/notifications'),
  getUnreadNotifications: () => request<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) => request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<{ ok: boolean }>('/notifications/read-all', { method: 'POST' }),
}
