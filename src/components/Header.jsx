import { Plus, ShoppingBag } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'

const NAV_ITEMS = [
  { id: 'Catalog', label: 'Catalog' },
  { id: 'Favorites', label: 'Favorites', hasBadge: true },
  { id: 'Profile', label: 'Profile' },
]

function Header({ tab, onTab, onNavigateCreate, onOpenCart }) {
  const { favorites } = useFavorites()
  const { totalItems } = useCart()
  const favCount = favorites ? favorites.length : 0

  return (
    <header className="header">
      <div className="header-brand-wrap" onClick={() => onTab('Catalog')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'nav-link active' : 'nav-link'}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.hasBadge && favCount > 0 && (
              <span className="nav-badge">{favCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Cart button */}
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={onOpenCart}
          title="Buka keranjang pesanan"
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ShoppingBag size={16} />
          <span className="cart-text">Keranjang</span>
          {totalItems > 0 && (
            <span
              style={{
                backgroundColor: 'var(--brass, #c5a059)',
                color: '#111',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginLeft: '2px',
              }}
            >
              {totalItems}
            </span>
          )}
        </button>

        {onNavigateCreate && (
          <button
            type="button"
            className="btn btn--primary btn--sm header-cta"
            onClick={onNavigateCreate}
            title="Register new hardware"
          >
            <Plus size={15} /> Add Hardware
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
