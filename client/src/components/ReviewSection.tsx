import { useState } from 'react'
import type { RatingDistribution, Review } from '../api/types'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import { RatingStars } from './RatingStars'
import { Icon } from './Icon'

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.submitReview({ productId, rating, reviewText: text })
      toast('Review submitted', 'Our team will review it before it goes live.', 'success')
      setText('')
      setRating(5)
      onSubmitted()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', padding: 0, color: (hover || rating) >= n ? 'var(--gold)' : 'var(--line-strong)' }}
          >
            <Icon name="star" width="26" height="26" fill="currentColor" />
          </button>
        ))}
      </div>
      <div className="field">
        <textarea
          className="textarea"
          placeholder="Share your experience with this piece…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button className="btn btn--dark btn--sm" type="submit" disabled={submitting || text.trim().length < 5}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}

export function ReviewSection({
  productId,
  reviews,
  ratingSummary,
  ratingDistribution,
}: {
  productId: string
  reviews: Review[]
  ratingSummary: { count: number; average: number }
  ratingDistribution: RatingDistribution[]
}) {
  const { customer } = useAuth()
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Client Reviews</span>
          <h2 className="display-md">What our clients say</h2>
        </div>

        <div className="reviews-grid">
          <div className="card rating-summary">
            <div className="rating-summary__score">{ratingSummary.count > 0 ? ratingSummary.average.toFixed(1) : '—'}</div>
            <div className="rating-summary__stars">
              <RatingStars rating={ratingSummary.average} size="lg" />
            </div>
            <div className="rating-summary__count">
              {ratingSummary.count > 0 ? `Based on ${ratingSummary.count} review${ratingSummary.count === 1 ? '' : 's'}` : 'No reviews yet'}
            </div>
            <div className="rating-bars">
              {ratingDistribution.map((d) => (
                <div className="rating-bar" key={d.star}>
                  <span>{d.star}</span>
                  <div className="rating-bar__track">
                    <div className="rating-bar__fill" style={{ width: `${d.percent}%` }} />
                  </div>
                  <span>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {reviews.length === 0 ? (
              <div className="state state--empty" style={{ padding: '40px 20px' }}>
                <div className="state__icon">
                  <Icon name="star" width="28" height="28" />
                </div>
                <h3 className="state__title">Be the first to review</h3>
                <p className="state__desc">Reviews appear here once approved by our team.</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div className="review-item" key={r.id}>
                  <div className="review-item__head">
                    <div className="review-item__author">
                      <span className="review-item__avatar">{r.customerName[0]}</span>
                      <span>
                        <span className="review-item__name">{r.customerName}</span>
                        {r.verifiedPurchase && (
                          <span className="review-item__verified">
                            <Icon name="check" width="12" height="12" /> Verified purchase
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <RatingStars rating={r.rating} size="sm" />
                      <div className="review-item__date">{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <p className="review-item__text">{r.reviewText}</p>
                </div>
              ))
            )}

            <div style={{ marginTop: 24 }}>
              {customer && !showForm ? (
                <button className="btn btn--outline" onClick={() => setShowForm(true)}>
                  Write a review
                </button>
              ) : showForm ? (
                <ReviewForm productId={productId} onSubmitted={() => setShowForm(false)} />
              ) : (
                <p className="muted" style={{ fontSize: 13.5 }}>
                  Sign in to share your experience with this piece.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
