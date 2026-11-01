import { useState, useMemo, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  Archive,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
} from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import archiveStorage from '../utils/archiveStorage'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — The central product catalog with:
 * - Pagination controls (Challenge 1)
 * - Soft delete / Archive with Restore & Permanent Delete (Challenge 6)
 * - Unique share link handling (Challenge 2)
 * - Query Caching integration (Challenge 4)
 * - Lazy Loading & Multi-image badges (Challenge 3 & 9)
 */
export default function Catalog({ onNavigate }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)

  // View mode: 'active' (active catalog) vs 'archived' (kotak arsip)
  const [viewMode, setViewMode] = useState('active')
  const [archivedGuns, setArchivedGuns] = useState(() => archiveStorage.getArchivedGuns())

  // Refresh archive state when updated
  useEffect(() => {
    const handleArchiveUpdate = () => {
      setArchivedGuns(archiveStorage.getArchivedGuns())
    }
    window.addEventListener('bore_barrel_archive_updated', handleArchiveUpdate)
    return () => window.removeEventListener('bore_barrel_archive_updated', handleArchiveUpdate)
  }, [])

  // Decide raw data source
  const rawGuns = useMemo(() => {
    let source = apiGuns
    if (useLocal || (error && apiGuns.length === 0)) {
      source = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }

    // Filter out archived guns from active catalog
    const archivedIds = archivedGuns.map((g) => String(g.id))
    return source.filter((g) => !archivedIds.includes(String(g.id)))
  }, [apiGuns, error, useLocal, archivedGuns])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // ---- Pagination state (Challenge 1) ----
  // Default to 3 items per page so pagination is immediately visible and demonstrable with 6 items
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(3)

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    const listToFilter = viewMode === 'active' ? rawGuns : archivedGuns
    const result = listToFilter.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, archivedGuns, viewMode, search, activeCategory, sortKey, sortOrder])

  // Sliced guns for pagination
  const totalPages = Math.max(1, Math.ceil(filteredGuns.length / pageSize))
  const paginatedGuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredGuns.slice(start, start + pageSize)
  }, [filteredGuns, currentPage, pageSize])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('')
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // ---- Soft Delete / Permanent Delete Modal ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [confirmPermanentTarget, setConfirmPermanentTarget] = useState(null)

  // Handle Soft Delete (Arsipkan)
  const handleSoftDelete = (gun) => {
    archiveStorage.archiveGun(gun)
    setDeleteTarget(null)
    showToast(`"${gun.name}" dipindahkan ke Kotak Arsip.`)
  }

  // Handle Restore from Archive
  const handleRestore = (gun) => {
    archiveStorage.restoreGun(gun.id)
    showToast(`"${gun.name}" berhasil dikembalikan ke katalog aktif!`)
  }

  // Handle Permanent Delete
  const handlePermanentDelete = async (gun) => {
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.deleteGun(gun.id)
      archiveStorage.removePermanentFromArchive(gun.id)
      setConfirmPermanentTarget(null)
      setDeleteTarget(null)
      showToast(`"${gun.name}" dihapus permanen dari sistem.`)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus permanen.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => { setSelectedGun(null); setDeleteTarget(g) }}
        onShareNotification={showToast}
      />
    )
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          Koleksi senjata presisi Bore &amp; Barrel. Dilengkapi paginasi, arsip katalog,
          dukungan multi-gambar, dan pemesanan instan ke WhatsApp.
        </p>
      </section>

      {toastMessage && (
        <div className="toast toast--success" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000 }}>
          <Check size={18} /> {toastMessage}
        </div>
      )}

      <section>
        {/* Header & Mode Switcher (Katalog Aktif vs Kotak Arsip) */}
        <div className="list-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={`btn btn--sm ${viewMode === 'active' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => { setViewMode('active'); setCurrentPage(1) }}
            >
              Katalog Aktif ({rawGuns.length})
            </button>
            <button
              type="button"
              className={`btn btn--sm ${viewMode === 'archived' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => { setViewMode('archived'); setCurrentPage(1) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Archive size={14} />
              <span>Kotak Arsip ({archivedGuns.length})</span>
            </button>
          </div>

          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} unit {viewMode === 'archived' ? 'dalam arsip' : 'tersedia'}
            </span>
            {onNavigate && viewMode === 'active' && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add Hardware
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={(val) => { setSearch(val); setCurrentPage(1) }}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={(cat) => { setActiveCategory(cat); setCurrentPage(1) }}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order); setCurrentPage(1) }}
        />

        {/* Loading and Error States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat katalog produk…</p>
          </div>
        )}

        {!loading && error && !useLocal && viewMode === 'active' && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Coba Lagi
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                Gunakan Katalog Lokal
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>
              {viewMode === 'archived'
                ? 'Kotak arsip kosong. Belum ada senjata yang diarsipkan.'
                : 'Tidak ada senjata yang cocok dengan filter pencarian.'}
            </p>
          </div>
        )}

        {/* Product Grid */}
        {filteredGuns.length > 0 && (
          <>
            {/* Product Grid — Direct children must be li.card */}
            <ul className="stock">
              {paginatedGuns.map((gun) => (
                <GunCard
                  key={gun.id || gun.name}
                  gun={gun}
                  onSelect={setSelectedGun}
                  onEdit={viewMode === 'active' && onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                  onDelete={viewMode === 'active' ? (g) => setDeleteTarget(g) : (g) => setConfirmPermanentTarget(g)}
                  onRestore={viewMode === 'archived' ? (g) => handleRestore(g) : undefined}
                  onShareNotification={showToast}
                />
              ))}
            </ul>

            {/* Bottom Pagination Bar (Challenge 1) */}
            <div
              className="pagination-bottom-bar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                marginTop: '32px',
                padding: '16px 20px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid var(--line, #d9dee2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'var(--ink, #18222c)' }}>
                Menampilkan{' '}
                <strong style={{ color: 'var(--brass, #a67c2e)' }}>
                  {(currentPage - 1) * pageSize + 1}
                </strong>
                –
                <strong style={{ color: 'var(--brass, #a67c2e)' }}>
                  {Math.min(currentPage * pageSize, filteredGuns.length)}
                </strong>{' '}
                dari <strong>{filteredGuns.length}</strong> unit senjata
              </div>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1))
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pg)
                      window.scrollTo({ top: 300, behavior: 'smooth' })
                    }}
                    style={{
                      minWidth: '34px',
                      height: '34px',
                      borderRadius: '6px',
                      border: pg === currentPage ? '1px solid var(--ink, #18222c)' : '1px solid var(--line, #d9dee2)',
                      background: pg === currentPage ? 'var(--ink, #18222c)' : '#ffffff',
                      color: pg === currentPage ? '#ffffff' : 'var(--ink, #18222c)',
                      fontWeight: pg === currentPage ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  aria-label="Halaman selanjutnya"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              {/* Items Per Page Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--steel, #5a6673)' }}>Item per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: '#ffffff',
                    border: '1px solid var(--line, #d9dee2)',
                    color: 'var(--ink, #18222c)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value={3}>3 unit per halaman</option>
                  <option value={6}>6 unit per halaman</option>
                  <option value={12}>12 unit per halaman</option>
                </select>
              </div>
            </div>
          </>
        )}

        {useLocal && (
          <p className="local-notice">
            Menampilkan katalog lokal (server tidak terhubung).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Coba hubungkan server kembali
            </button>
          </p>
        )}
      </section>

      {/* Choice Modal: Soft Delete / Archive vs Permanent Delete (Challenge 6) */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={() => setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="card-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '90%',
              background: '#ffffff',
              color: 'var(--ink, #18222c)',
              borderRadius: '8px',
              border: '1px solid var(--line, #d9dee2)',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}
          >
            <h2 className="card-box-title" style={{ fontSize: '1.25rem', margin: '0 0 10px 0', color: 'var(--ink)' }}>
              Kelola Penghapusan Katalog
            </h2>
            <p style={{ color: 'var(--steel, #5a6673)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Anda dapat memilih untuk memindahkan senjata <strong>"{deleteTarget.name}"</strong> ke kotak arsip (bisa di-restore kapan saja), atau menghapusnya secara permanen dari basis data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Soft Delete / Archive */}
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => handleSoftDelete(deleteTarget)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Archive size={16} /> Arsipkan Senjata
              </button>

              {/* Option 2: Permanent Delete */}
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  const target = deleteTarget
                  setDeleteTarget(null)
                  setConfirmPermanentTarget(target)
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Trash2 size={16} /> Hapus Permanen
              </button>

              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setDeleteTarget(null)}
                style={{ marginTop: '4px' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Permanent Delete */}
      <ConfirmModal
        open={Boolean(confirmPermanentTarget)}
        title="Konfirmasi Hapus Permanen"
        message={`Apakah Anda yakin ingin menghapus "${confirmPermanentTarget?.name}" secara permanen? Data akan dihapus dari server dan tidak dapat dikembalikan.`}
        confirmLabel="Hapus Permanen"
        danger
        loading={deleting}
        onConfirm={() => confirmPermanentTarget && handlePermanentDelete(confirmPermanentTarget)}
        onCancel={() => setConfirmPermanentTarget(null)}
      />

      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
