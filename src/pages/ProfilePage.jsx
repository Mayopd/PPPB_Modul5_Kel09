import { useState } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Edit3,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Package,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  formatDraftTime,
} from '../utils/draftStorage'
import { formatPrice } from '../utils/helpers'

export default function ProfilePage({ onReplaySplash, onNavigate, onResumeDraft }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()

  // Drafts state
  const [draftIds, setDraftIds] = useState(() => getAllDraftIds())

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Yakin ingin menghapus draft katalog ini?')) {
      deleteDraft(draftId)
      setDraftIds(getAllDraftIds())
      setFeedback('Draft berhasil dihapus.')
      setTimeout(() => setFeedback(''), 2500)
    }
  }

  const handleResumeDraft = (draftId) => {
    if (onResumeDraft) {
      onResumeDraft(draftId)
    } else if (onNavigate) {
      if (draftId === 'create') {
        onNavigate('Create')
      } else {
        onNavigate('Edit', { id: draftId })
      }
    }
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile &amp; Armory</h1>
          <p className="lede">
            Kredensial operator, arsip draft katalog senjata, informasi markas, dan kontak.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onNavigate && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => onNavigate('EditProfile')}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Replay introductory splash animation"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID ke clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
            {profile.bio && (
              <p style={{ marginTop: '8px', color: 'var(--steel, #aaa)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                &ldquo;{profile.bio}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorit Senjata</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{draftIds.length}</div>
            <div className="stat-label">Katalog Tersimpan di Draft</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: SECTION DRAFT KATALOG */}
      <section className="detail-section" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileText size={20} color="var(--brass, #c5a059)" />
            Daftar Draft Katalog ({draftIds.length})
          </h2>
          {onNavigate && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => onNavigate('Create')}
            >
              + Buat Katalog Baru
            </button>
          )}
        </div>

        {draftIds.length === 0 ? (
          <div style={{
            padding: '28px',
            background: 'var(--card, #1c1c1c)',
            border: '1px solid var(--line, #2a2a2a)',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--steel, #888)',
          }}>
            <Package size={36} style={{ opacity: 0.35, marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>Belum ada draft katalog yang tersimpan secara lokal.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.7 }}>
              Form pendaftaran senjata yang belum selesai akan otomatis disimpan di sini.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {draftIds.map((id) => {
              const draft = loadDraft(id)
              if (!draft) return null
              const name = draft.formData?.name || (id === 'create' ? 'Draft Senjata Baru' : `Draft Senjata #${id}`)
              const type = draft.formData?.type || 'Standard Hardware'
              const price = draft.formData?.price
              const timeAgo = formatDraftTime(draft.savedAt)

              return (
                <div
                  key={id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--card, #1c1c1c)',
                    border: '1px solid var(--line, #2a2a2a)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="mono-badge" style={{ fontSize: '0.7rem' }}>
                        {id === 'create' ? 'CREATE' : `ID: ${id}`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--steel, #888)' }}>{timeAgo}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', margin: '8px 0 4px 0', fontWeight: 600 }}>{name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--steel, #aaa)', margin: '0 0 8px 0' }}>
                      {type} {price ? `· ${formatPrice(price)}` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--line, #2a2a2a)', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleResumeDraft(id)}
                    >
                      <ExternalLink size={14} /> Lanjutkan Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm"
                      onClick={() => handleDeleteDraft(id)}
                      title="Hapus draft ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: SECTION ABOUT (DIPINDAHKAN DARI ASALNYA) */}
      <section className="detail-section" style={{ marginTop: '36px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Shield size={20} color="var(--brass, #c5a059)" />
          Tentang Bore &amp; Barrel (About Us)
        </h2>
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          background: 'var(--card, #1c1c1c)',
          border: '1px solid var(--line, #2a2a2a)',
          lineHeight: 1.6,
        }}>
          <h3 className="display" style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '8px' }}>
            A one-room armory.
          </h3>
          <p style={{ color: 'var(--steel, #ccc)', margin: '0 0 12px 0' }}>
            Bore &amp; Barrel menjual katalog persenjataan pilihan yang teruji dan presisi.
            Setiap unit senjata disetel langsung dari meja kerja armorer kami — tanpa markup berlebihan,
            tanpa kompromi material, dan siap pakai untuk kebutuhan taktis maupun kompetisi olahraga tembak.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line, #2a2a2a)' }}>
            <div>
              <strong style={{ color: 'var(--brass, #c5a059)' }}>Spesifikasi Terstandar:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--steel, #aaa)' }}>
                Tiap platform diverifikasi kaliber, toleransi mekanisme, dan kapasitas magasinnya.
              </p>
            </div>
            <div>
              <strong style={{ color: 'var(--brass, #c5a059)' }}>Armory Guarantee:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--steel, #aaa)' }}>
                Dukungan servis berkala, panduan pembongkaran, dan suku cadang asli.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SECTION CONTACT (DIPINDAHKAN DARI ASALNYA) */}
      <section className="detail-section" style={{ marginTop: '36px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Phone size={20} color="var(--brass, #c5a059)" />
          Hubungi Kami &amp; Lokasi Markas (Contact)
        </h2>
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          background: 'var(--card, #1c1c1c)',
          border: '1px solid var(--line, #2a2a2a)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <MapPin size={22} color="var(--brass, #c5a059)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Alamat Markas:</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--steel, #ccc)' }}>
                  123 Range Road, Armory Sector 7.<br />Gedung Workshop Bore &amp; Barrel.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Clock size={22} color="var(--brass, #c5a059)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Jam Operasional:</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--steel, #ccc)' }}>
                  Selasa – Sabtu: 10:00 – 18:00 WIB<br />Minggu &amp; Senin: Khusus Appointment
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Phone size={22} color="var(--brass, #c5a059)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Saluran Kontak:</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--steel, #ccc)' }}>
                  Telepon: (555) 010-0100<br />
                  <a
                    href="https://wa.me/6281384229093?text=Halo%20Bore%20%26%20Barrel%2C%20saya%20ingin%20bertanya%20mengenai%20katalog%20senjata."
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}
                  >
                    <MessageCircle size={14} /> WhatsApp Resmi (+62 813-8422-9093)
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
