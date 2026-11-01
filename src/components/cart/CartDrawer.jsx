import { useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../utils/helpers'

export default function CartDrawer({ open, onClose }) {
  const {
    cart,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    generateWhatsAppUrl,
  } = useCart()

  const [notes, setNotes] = useState('')

  if (!open) return null

  const handleCheckoutWhatsApp = () => {
    const url = generateWhatsAppUrl('081384229093', notes)
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="cart-backdrop" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div
        className="cart-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--bg-surface, #141414)',
          borderLeft: '1px solid var(--line, #2a2a2a)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--line, #2a2a2a)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="var(--brass, #c5a059)" />
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display, inherit)' }}>
              Keranjang Pesanan ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Tutup keranjang"
            style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--steel, #888)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--steel, #888)',
            }}>
              <ShoppingBag size={48} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: '14px' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Keranjang masih kosong</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', opacity: 0.7 }}>
                Pilih senjata atau perlengkapan dari katalog untuk dimasukkan ke keranjang.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item) => {
                const itemId = item.id ?? item.name
                const itemSubtotal = (Number(item.price) || 0) * (item.quantity || 1)
                return (
                  <li
                    key={itemId}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'var(--card, #1c1c1c)',
                      border: '1px solid var(--line, #2a2a2a)',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={item.image || '/guns/pistol.svg'}
                      alt={item.name}
                      style={{
                        width: '64px',
                        height: '52px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--steel, #888)' }}>
                        {item.type} {item.caliber ? `· ${item.caliber}` : ''}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--brass, #c5a059)', fontWeight: 600, marginTop: '2px' }}>
                        {formatPrice(item.price)}
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--steel, #888)', marginLeft: '6px', fontWeight: 'normal' }}>
                            (Subtotal: {formatPrice(itemSubtotal)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId, item.quantity - 1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid var(--line, #333)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          border: '1px solid var(--line, #333)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemId)}
                        title="Hapus dari keranjang"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e05252',
                          cursor: 'pointer',
                          padding: '4px',
                          marginLeft: '4px',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--line, #2a2a2a)',
            background: 'var(--bg-alt, #181818)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Notes */}
            <div>
              <label htmlFor="cart-notes" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--steel, #888)', marginBottom: '4px' }}>
                Catatan Pesanan (opsional):
              </label>
              <input
                id="cart-notes"
                type="text"
                placeholder="Contoh: Tolong siapkan sebelum hari Jumat..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line, #333)',
                  background: 'var(--card, #1c1c1c)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Total Price summary */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '6px',
            }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--steel, #aaa)' }}>Total Pembayaran:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--brass, #c5a059)' }}>
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Action buttons */}
            <button
              type="button"
              className="btn"
              onClick={handleCheckoutWhatsApp}
              style={{
                width: '100%',
                backgroundColor: '#25D366',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <span>Checkout via WhatsApp</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={clearCart}
              style={{ color: 'var(--steel, #888)', borderColor: 'var(--line, #333)' }}
            >
              Kosongkan Keranjang
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
