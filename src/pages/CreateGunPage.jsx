import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Loader,
  Save,
  CheckCircle,
  AlertCircle,
  Images,
  Star,
} from 'lucide-react'
import gunService from '../services/gunService'
import uploadService from '../services/uploadService'
import {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import ConfirmModal from '../components/modals/ConfirmModal'

/**
 * CreateGunPage — Register new hardware with:
 * - Multi-image upload & management (Challenge 9)
 * - Auto-saving drafts (Challenge 5)
 * - Specs and assembly protocols
 */
export default function CreateGunPage({ onBack, onSuccess }) {
  const [currentStep, setCurrentStep] = useState('upload')

  const [formData, setFormData] = useState({
    name: '',
    type: 'Pistol',
    caliber: '9mm',
    category: 'makanan',
    difficulty: 'mudah',
    price: 599,
    description: '',
    servings: 1,
    is_featured: false,
  })

  // Multi-image state (Challenge 9)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)

  // Specs
  const [specs, setSpecs] = useState([
    { name: 'Frame', quantity: 'Polymer' },
    { name: 'Action', quantity: 'Striker-Fired' },
    { name: 'Capacity', quantity: '17 rounds' },
  ])

  // Maintenance steps
  const [steps, setSteps] = useState([
    'Pastikan senjata benar-benar kosong dari amunisi dan arahkan ke zona aman.',
    'Bongkar slide assembly dari receiver frame untuk pembersihan rutin.',
  ])

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Draft management
  const [showDraftModal, setShowDraftModal] = useState(() => hasDraft('create'))
  const [draftTimestamp, setDraftTimestamp] = useState(() => getDraftTimestamp('create'))

  const handleSaveDraft = useCallback((notify = true) => {
    const draftData = {
      formData,
      specs,
      steps,
      images,
      savedAt: new Date().toISOString(),
    }
    const saved = saveDraft(draftData, 'create')
    if (saved) {
      const ts = getDraftTimestamp('create')
      setDraftTimestamp(ts)
      if (notify) {
        setSuccessMsg(`Draft berhasil disimpan (${formatDraftTime(ts)})`)
        setTimeout(() => setSuccessMsg(''), 3000)
      }
    }
  }, [formData, specs, steps, images])

  // Auto-save every 30s
  useEffect(() => {
    if (currentStep !== 'form') return
    const interval = setInterval(() => {
      handleSaveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [handleSaveDraft, currentStep])

  const handleLoadDraft = () => {
    const draft = loadDraft('create')
    if (draft) {
      if (draft.formData) setFormData(draft.formData)
      if (draft.specs) setSpecs(draft.specs)
      if (draft.steps) setSteps(draft.steps)
      if (draft.images && draft.images.length > 0) {
        setImages(draft.images)
        setCurrentStep('form')
      } else if (draft.uploadedImageUrl) {
        setImages([draft.uploadedImageUrl])
        setCurrentStep('form')
      }
      setShowDraftModal(false)
      setSuccessMsg('Draft berhasil dipulihkan.')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleDiscardDraft = () => {
    deleteDraft('create')
    setShowDraftModal(false)
    setDraftTimestamp(null)
  }

  // Handle multiple file upload
  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')

    const newUrls = []
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" melebihi batas 5MB.`)
        continue
      }
      try {
        const res = await uploadService.uploadImage(file)
        if (res.success && res.data?.url) {
          newUrls.push(res.data.url)
        }
      } catch (err) {
        console.warn('Upload error, using fallback:', err)
      }
    }

    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls])
      setSuccessMsg(`${newUrls.length} gambar berhasil ditambahkan.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setUploading(false)
  }

  const handleAddPreset = (url) => {
    setImages((prev) => [...prev, url])
  }

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSetPrimaryImage = (index) => {
    setImages((prev) => {
      const copy = [...prev]
      const [chosen] = copy.splice(index, 1)
      return [chosen, ...copy]
    })
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Specs handlers
  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addSpec = () => setSpecs((prev) => [...prev, { name: '', quantity: '' }])
  const removeSpec = (index) => {
    if (specs.length <= 1) return
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  // Steps handlers
  const handleStepChange = (index, value) => {
    setSteps((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const addStep = () => setSteps((prev) => [...prev, ''])
  const removeStep = (index) => {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      setError('Nama model senjata minimal 3 karakter.')
      return
    }

    const cleanSpecs = specs
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        quantity: s.quantity.trim() || 'Standard',
      }))

    if (cleanSpecs.length === 0) {
      setError('Harap isi minimal satu spesifikasi komponen.')
      return
    }

    const cleanSteps = steps
      .filter((s) => s.trim())
      .map((s) => s.trim())

    if (cleanSteps.length === 0) {
      setError('Harap isi minimal satu langkah perawatan.')
      return
    }

    const finalImages = images.length > 0 ? images : ['/guns/pistol.svg']

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      category: formData.type === 'Pistol' ? 'makanan' : 'minuman',
      description: formData.description.trim() || `${formData.type} caliber ${formData.caliber}.`,
      images: finalImages,
      image_url: finalImages[0],
      prep_time: 15,
      cook_time: Number(formData.price) || 500,
      price: Number(formData.price) || 500,
      servings: Number(formData.servings) || 1,
      difficulty: formData.difficulty || 'mudah',
      is_featured: Boolean(formData.is_featured),
      ingredients: cleanSpecs,
      steps: cleanSteps,
    }

    try {
      setCreating(true)
      const response = await gunService.createGun(payload)
      if (response.success || response.data) {
        deleteDraft('create')
        if (onSuccess) onSuccess(response.data)
        else if (onBack) onBack()
      } else {
        throw new Error(response.message || 'Gagal mendaftarkan senjata.')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan ke database.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Katalog
        </button>
        <div className="form-head-actions">
          {currentStep === 'form' && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => handleSaveDraft(true)}
              title="Simpan draft"
            >
              <Save size={14} /> Simpan Draft
            </button>
          )}
        </div>
      </div>

      <div className="form-title-group">
        <h1 className="display">Registrasi Senjata Baru</h1>
        <p className="lede">
          Tambahkan senjata ke katalog armory. Anda dapat menambahkan lebih dari 1 gambar
          dan data akan disinkronkan secara aman.
        </p>
      </div>

      {error && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Step Indicators */}
      <div className="form-steps-nav">
        <div className={`step-badge ${currentStep === 'upload' ? 'step-badge--active' : 'step-badge--done'}`}>
          1. Galeri Gambar ({images.length})
        </div>
        <div className="step-badge-connector" />
        <div className={`step-badge ${currentStep === 'form' ? 'step-badge--active' : ''}`}>
          2. Spesifikasi &amp; Detail
        </div>
      </div>

      {/* STEP 1: Multiple Images Upload */}
      {currentStep === 'upload' && (
        <div className="card-box">
          <h2 className="card-box-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Images size={20} color="var(--brass, #c5a059)" />
            Galeri Gambar Senjata (Dukungan Multi-Gambar)
          </h2>
          <p className="card-box-desc">
            Unggah satu atau lebih foto senjata (maks. 5MB per file), atau tambahkan preset stok armory.
          </p>

          {/* Upload Dropzone */}
          <div className="upload-dropzone">
            <input
              id="gun-multi-input"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleMultipleFiles}
              className="hidden-file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="gun-multi-input" className="upload-label" style={{ cursor: 'pointer' }}>
              <Upload size={36} className="upload-icon" />
              <span className="upload-main-text">Klik untuk memilih 1 atau lebih file gambar</span>
              <span className="upload-sub-text">Mendukung format JPG, PNG, WebP (bisa pilih banyak sekaligus)</span>
            </label>

            {uploading && (
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--brass)' }}>
                <Loader size={16} className="spin" /> Mengunggah gambar…
              </p>
            )}

            <div className="preset-selector" style={{ marginTop: '16px' }}>
              <span className="preset-title">Atau tambahkan preset vektor:</span>
              <div className="preset-pills">
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleAddPreset('/guns/pistol.svg')}
                >
                  + Pistol Vector
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleAddPreset('/guns/rifle.svg')}
                >
                  + Rifle Vector
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleAddPreset('/guns/shotgun.svg')}
                >
                  + Shotgun Vector
                </button>
              </div>
            </div>
          </div>

          {/* Added Images Thumbnail Grid */}
          {images.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--line, #2a2a2a)', paddingTop: '18px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Foto yang Dipilih ({images.length} gambar):
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--brass, #c5a059)' : '1px solid var(--line, #333)',
                      background: 'rgba(0,0,0,0.3)',
                      height: '110px',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Upload ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'var(--brass, #c5a059)',
                          color: '#111',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        Utama
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(224, 82, 82, 0.85)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Hapus gambar ini"
                    >
                      <X size={13} />
                    </button>

                    {/* Set Primary Button */}
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.65rem',
                          padding: '2px 0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                        }}
                        title="Jadikan sebagai foto utama"
                      >
                        <Star size={10} color="var(--brass)" /> Jadikan Utama
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Continue button */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCurrentStep('form')}
                >
                  Lanjut ke Spesifikasi &amp; Detail Senjata &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Product Form */}
      {currentStep === 'form' && (
        <form onSubmit={handleSubmit} className="entry-form">
          {/* Active Images Summary Bar */}
          <div className="selected-thumb-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {images.slice(0, 3).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Thumb"
                    style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}
                  />
                ))}
              </div>
              <div className="thumb-info">
                <span className="thumb-title">{images.length} Gambar Ditetapkan</span>
                <span className="thumb-sub">Foto utama siap ditampilkan</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setCurrentStep('upload')}
            >
              Kelola Gambar
            </button>
          </div>

          {/* Core Info */}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Model Designation <span className="req">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Contoh: Glock 19 Gen 5, Colt M4A1..."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type" className="form-label">
                Platform / Category <span className="req">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="Pistol">Pistol (Sidearm)</option>
                <option value="Rifle">Rifle (Long Gun)</option>
                <option value="Shotgun">Shotgun (Smoothbore)</option>
                <option value="Submachine Gun">Submachine Gun</option>
              </select>
            </div>
          </div>

          <div className="form-grid form-grid--3">
            <div className="form-group">
              <label htmlFor="caliber" className="form-label">
                Caliber / Chambering <span className="req">*</span>
              </label>
              <input
                id="caliber"
                type="text"
                name="caliber"
                value={formData.caliber}
                onChange={handleFormChange}
                placeholder="Contoh: 9mm, 5.56mm, 12 Gauge"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Harga (USD) <span className="req">*</span>
              </label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                placeholder="599"
                min="0"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty" className="form-label">
                Kualitas Build <span className="req">*</span>
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleFormChange}
                className="form-select"
              >
                <option value="mudah">Commercial / Standard</option>
                <option value="sedang">Mil-Spec / Service Issue</option>
                <option value="sulit">Match Grade / Custom</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Deskripsi Armory
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Profil operasional, ergonomi, catatan armorer..."
              rows={3}
              className="form-textarea"
            />
          </div>

          {/* Specifications */}
          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">Spesifikasi &amp; Komponen</label>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={addSpec}
              >
                <Plus size={14} /> Tambah Spek
              </button>
            </div>
            <div className="multi-rows">
              {specs.map((spec, i) => (
                <div key={i} className="multi-row">
                  <input
                    type="text"
                    placeholder="Atribut (misal: Barrel Length)"
                    value={spec.name}
                    onChange={(e) => handleSpecChange(i, 'name', e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Nilai (misal: 16 inch)"
                    value={spec.quantity}
                    onChange={(e) => handleSpecChange(i, 'quantity', e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn--danger-ghost"
                    onClick={() => removeSpec(i)}
                    disabled={specs.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance steps */}
          <div className="form-fieldset">
            <div className="fieldset-header">
              <label className="form-label">Prosedur Perakitan &amp; Perawatan</label>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={addStep}
              >
                <Plus size={14} /> Tambah Langkah
              </button>
            </div>
            <div className="multi-rows">
              {steps.map((st, i) => (
                <div key={i} className="step-row">
                  <span className="step-num">{i + 1}</span>
                  <input
                    type="text"
                    placeholder="Langkah perawatan..."
                    value={st}
                    onChange={(e) => handleStepChange(i, e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="btn btn--danger-ghost"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onBack}
              disabled={creating}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader size={18} className="spin" /> Mendaftarkan Senjata…
                </>
              ) : (
                'Simpan ke Katalog Armory'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Restore Draft Modal */}
      <ConfirmModal
        open={showDraftModal}
        title="Lanjutkan Draft Sebelumnya?"
        message={`Ditemukan draft yang belum tersimpan dari ${draftTimestamp ? formatDraftTime(draftTimestamp) : 'sebelumnya'}. Apakah Anda ingin melanjutkan pengeditan?`}
        confirmLabel="Muat Draft"
        cancelLabel="Buang"
        onConfirm={handleLoadDraft}
        onCancel={handleDiscardDraft}
      />
    </div>
  )
}
