import { useState } from 'react'
import { ArrowLeft, Save, Camera, Check, Shield } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar avatar maksimal 2MB.')
      setTimeout(() => setError(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      setFeedback('Avatar berhasil dipilih.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setError('')
    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setFeedback('Profil berhasil disimpan!')
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data)
        else if (onBack) onBack()
      }, 800)
    } else {
      setError('Gagal menyimpan profil.')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Profil
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Perbarui identitas callsign, foto operator, dan catatan armorer Anda.
        </p>
      </div>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}
      {error && (
        <div className="toast toast--error">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="entry-form">
        {/* Avatar Upload Card */}
        <div className="card-box">
          <h2 className="card-box-title">Foto Operator / Avatar</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '14px' }}>
            <div className="avatar-wrap" style={{ position: 'relative', width: '80px', height: '80px' }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt={username}
                  className="avatar-img"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="avatar-placeholder"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--card, #1c1c1c)',
                    border: '1px solid var(--line, #333)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={36} stroke="var(--brass, #c5a059)" />
                </div>
              )}
              <label
                htmlFor="avatar-edit-input"
                className="avatar-upload-btn"
                title="Pilih foto baru"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--brass, #c5a059)',
                  color: '#111',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--bg-surface, #141414)',
                }}
              >
                <Camera size={14} />
                <input
                  id="avatar-edit-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden-file-input"
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div>
              <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>Ubah Foto Profil</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--steel, #888)' }}>
                Format didukung: JPG, PNG, WEBP (maks. 2MB).
              </p>
            </div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="form-group">
          <label htmlFor="edit-prof-name" className="form-label">
            Callsign / Operator Alias <span className="req">*</span>
          </label>
          <input
            id="edit-prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Contoh: Operator Delta, Master Gunsmith"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-prof-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="edit-prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kualifikasi, kaliber favorit, pengalaman unit..."
            rows={4}
            className="form-textarea"
          />
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
