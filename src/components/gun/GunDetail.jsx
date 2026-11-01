import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import { useCart } from '../../hooks/useCart'
import { formatPrice, averageRating } from '../../utils/helpers'
import { getReviewVote, castVote } from '../../utils/voteStorage'

export default function GunDetail({ gun, onBack, onEdit, onDelete, onShareNotification }) {
  const { addToCart } = useCart()

  // Multi-image state
  const images =
    gun.images && gun.images.length > 0
      ? gun.images
      : [gun.image_url || gun.image || '/guns/pistol.svg']

  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Cart quantity state
  const [cartQty, setCartQty] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  // Share state
  const [copiedShare, setCopiedShare] = useState(false)

  // Reviews state
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Review Edit state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [updatingReview, setUpdatingReview] = useState(false)

  // Review Vote state updater
  const [, setVoteTrigger] = useState(0)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  // Handlers
  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % images.length)
  }

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${gun.id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
    if (onShareNotification) {
      onShareNotification(`Tautan "${gun.name}" berhasil disalin!`)
    }
  }

  const handleAddToCart = () => {
    addToCart(gun, cartQty)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating harus antara 1 dan 5 bintang.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Ulasan Anda berhasil dikirim!')
      setComment('')
      setRating(5)
      refetchReviews()
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Tidak dapat mengirim ulasan. Silakan periksa koneksi.')
    }
  }

  // Edit Review
  const startEditReview = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (revId) => {
    try {
      setUpdatingReview(true)
      await reviewService.updateReview(revId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingReviewId(null)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui ulasan.')
    } finally {
      setUpdatingReview(false)
    }
  }

  // Delete Review
  const handleDeleteReview = async (revId) => {
    if (!window.confirm('Yakin ingin menghapus ulasan ini?')) return
    try {
      await reviewService.deleteReview(revId)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal menghapus ulasan.')
    }
  }

  // Vote Review (Thumbs Up / Down)
  const handleVote = (revId, type) => {
    castVote(revId, type)
    setVoteTrigger((v) => v + 1)
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Katalog
      </button>

      {/* Hero Section */}
      <div className="detail-hero">
        {/* Multi-Image Gallery */}
        <div className="detail-gallery-wrap" style={{ flex: '1', maxWidth: '440px', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', height: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
            <LazyImage
              src={images[activeImageIdx]}
              alt={`${gun.name} - ${activeImageIdx + 1}`}
              className="detail-img"
            />

            {/* Gallery Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  title="Foto sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  title="Foto selanjutnya"
                >
                  <ChevronRight size={20} />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {activeImageIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '64px',
                    height: '52px',
                    padding: '2px',
                    borderRadius: '6px',
                    border: idx === activeImageIdx ? '2px solid var(--brass, #c5a059)' : '1px solid var(--line, #333)',
                    background: 'rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Cart Actions */}
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} ulasan)
            </p>
          )}

          {/* Add To Cart Section */}
          <div style={{
            margin: '18px 0',
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--card, #1c1c1c)',
            border: '1px solid var(--line, #2a2a2a)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--steel, #aaa)' }}>Kuantitas Pesanan:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    border: '1px solid var(--line, #333)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  -
                </button>
                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>{cartQty}</span>
                <button
                  type="button"
                  onClick={() => setCartQty((q) => q + 1)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '4px',
                    border: '1px solid var(--line, #333)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleAddToCart}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {addedToCart ? <Check size={18} /> : <ShoppingBag size={18} />}
                <span>{addedToCart ? 'Dimasukkan ke Keranjang!' : 'Tambah ke Keranjang'}</span>
              </button>
            </div>
          </div>

          <div className="detail-actions">
            {/* Share Link Button */}
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleShare}
              title="Bagikan tautan unik ke senjata ini"
            >
              {copiedShare ? <Check size={16} color="var(--brass)" /> : <Share2 size={16} />}
              <span>{copiedShare ? 'Tautan Disalin!' : 'Share Link'}</span>
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete / Arsip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'Tidak ada deskripsi tersedia.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Spesifikasi Teknis</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Maintenance steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Prosedur Perawatan &amp; Perakitan</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section with Full CRUD & Thumbs Up/Down */}
      <section className="detail-section">
        <h2>Ulasan Operator &amp; Feedback</h2>

        {/* Submit Review Form */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} bintang`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Tulis ulasan teknis, impresi recoil, akurasi, atau kepuasan pemakaian…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Mengirim…</>
            ) : (
              <><Send size={16} /> Kirim Ulasan</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing Reviews List */}
        {reviewsLoading ? (
          <p className="detail-loading">Memuat ulasan…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list" style={{ marginTop: '20px' }}>
            {reviews.map((rev) => {
              const vote = getReviewVote(rev.id)
              const isEditing = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item" style={{ position: 'relative' }}>
                  {isEditing ? (
                    // Inline Edit Review Form
                    <div style={{ padding: '10px 0' }}>
                      <div className="review-stars" style={{ marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEditReview(rev.id)}
                          disabled={updatingReview}
                        >
                          <Save size={14} /> Simpan
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          <X size={14} /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal Review View
                    <>
                      <div className="review-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                          <span className="review-stars-display">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < rev.rating ? 'var(--brass)' : 'none'}
                                stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                              />
                            ))}
                          </span>
                        </div>

                        {/* Review Actions (Edit & Delete) */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => startEditReview(rev)}
                            title="Edit ulasan ini"
                            style={{ padding: '4px', color: 'var(--steel, #888)' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Hapus ulasan ini"
                            style={{ padding: '4px', color: '#e05252' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Thumbs Up / Thumbs Down Voting */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--line, #2a2a2a)' }}>
                        <button
                          type="button"
                          onClick={() => handleVote(rev.id, 'up')}
                          style={{
                            background: vote.userVote === 'up' ? 'rgba(197, 160, 89, 0.18)' : 'transparent',
                            color: vote.userVote === 'up' ? 'var(--brass, #c5a059)' : 'var(--steel, #888)',
                            border: vote.userVote === 'up' ? '1px solid var(--brass, #c5a059)' : '1px solid var(--line, #333)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                          title="Bermanfaat (Thumbs Up)"
                        >
                          <ThumbsUp size={13} />
                          <span>{vote.up}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVote(rev.id, 'down')}
                          style={{
                            background: vote.userVote === 'down' ? 'rgba(224, 82, 82, 0.18)' : 'transparent',
                            color: vote.userVote === 'down' ? '#e05252' : 'var(--steel, #888)',
                            border: vote.userVote === 'down' ? '1px solid #e05252' : '1px solid var(--line, #333)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                          title="Tidak Bermanfaat (Thumbs Down)"
                        >
                          <ThumbsDown size={13} />
                          <span>{vote.down}</span>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">Belum ada ulasan. Jadilah yang pertama memberikan review!</p>
        )}
      </section>
    </div>
  )
}
