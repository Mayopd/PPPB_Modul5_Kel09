import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy load pages and components for optimized code splitting (Challenge 3)
// ---------------------------------------------------------------------------
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))
const CartDrawer = lazy(() => import('./components/cart/CartDrawer.jsx'))

function LoadingFallback() {
  return (
    <div className="state-box" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <Loader size={32} className="spin" />
      <p style={{ marginTop: '12px', color: 'var(--steel, #888)' }}>Memuat halaman…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit-profile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Cart Drawer state (Challenge 8)
  const [cartOpen, setCartOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Unique Share Link auto-detection on load (Challenge 2)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gunParam = params.get('gun') || params.get('id')
    if (gunParam) {
      gunService
        .getGunById(gunParam)
        .then((res) => {
          if (res.success && res.data) {
            setSelectedGun(res.data)
            setMode('detail')
          }
        })
        .catch((err) => {
          console.warn('Could not load gun from URL param:', err)
        })
    }
  }, [])

  // Keep URL updated when viewing detail or list
  useEffect(() => {
    if (mode === 'detail' && selectedGun?.id) {
      const url = new URL(window.location)
      url.searchParams.set('gun', selectedGun.id)
      window.history.replaceState({}, '', url)
    } else if (mode === 'list') {
      const url = new URL(window.location)
      if (url.searchParams.has('gun') || url.searchParams.has('id')) {
        url.searchParams.delete('gun')
        url.searchParams.delete('id')
        window.history.replaceState({}, '', url.pathname)
      }
    }
  }, [mode, selectedGun])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit-profile' && (
            <EditProfilePage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Profile')
              }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                  onResumeDraft={(draftId) => {
                    if (draftId === 'create') {
                      handleNavigate('Create')
                    } else {
                      handleNavigate('Edit', { id: draftId })
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Shopping Cart Drawer (Challenge 8) */}
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Hardware Record"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gunService.deleteGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to delete record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
