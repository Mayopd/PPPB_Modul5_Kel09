import { useState } from 'react'
import { Share2, ShoppingBag, Check, Images } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { useCart } from '../../hooks/useCart'
import { formatPrice, truncate } from '../../utils/helpers'

/**
 * Product card used in the catalog grid.
 * Features:
 * - Multi-image counter badge
 * - LazyImage loading
 * - Share link button with unique URL
 * - Add to Cart action
 * - Favorite button & Admin Edit/Delete
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onRestore, onShareNotification }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)

  const imgSrc = (gun.images && gun.images[0]) || gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const imageCount = gun.images ? gun.images.length : 1

  const handleShare = (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${gun.id}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    if (onShareNotification) {
      onShareNotification(`Tautan "${gun.name}" disalin!`)
    }
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(gun, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <li className="card" style={{ position: 'relative' }}>
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`Lihat detail ${gun.name}`}
      >
        <div style={{ position: 'relative', width: '100%', height: '180px', background: 'rgba(0,0,0,0.2)' }}>
          <LazyImage
            src={imgSrc}
            alt={gun.name}
            width="240"
            height="180"
          />

          {/* Multi-image indicator badge */}
          {imageCount > 1 && (
            <span
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              title={`${imageCount} foto tersedia`}
            >
              <Images size={12} color="var(--brass, #c5a059)" />
              {imageCount}
            </span>
          )}
        </div>

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
          <span className="price">{formatPrice(price)}</span>

          {/* Quick Add To Cart Button */}
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleAddToCart}
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: added ? 'var(--brass, #c5a059)' : 'rgba(255,255,255,0.06)',
              color: added ? '#111' : 'var(--brass, #c5a059)',
              border: '1px solid var(--line, #333)',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: 600,
            }}
            title="Tambah ke keranjang pesanan"
          >
            {added ? <Check size={14} /> : <ShoppingBag size={14} />}
            <span>{added ? 'Ditambahkan' : '+ Keranjang'}</span>
          </button>
        </div>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        {/* Share Button with Unique Link */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Bagikan tautan ${gun.name}`}
          title={copied ? 'Tautan disalin!' : 'Bagikan tautan unik'}
          style={{ color: copied ? 'var(--brass, #c5a059)' : 'inherit' }}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
        </button>

        <FavoriteButton gunId={gun.id || gun.name} />

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onRestore && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onRestore(gun) }}
            aria-label={`Restore ${gun.name}`}
            title="Restore ke Katalog"
            style={{ color: 'var(--brass, #a67c2e)' }}
          >
            🔄
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Hapus ${gun.name}`}
            title="Hapus / Arsipkan"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
