// ---------------------------------------------------------------------------
// archiveStorage.js — Soft Delete / Archive Management.
// Allows archiving catalog items, viewing archived items, restoring them,
// or permanently deleting them.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

/**
 * Retrieve all archived items.
 * @returns {Array<Object>}
 */
export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Get list of archived IDs.
 * @returns {Array<string|number>}
 */
export const getArchivedIds = () => {
  const list = getArchivedGuns()
  return list.map((g) => String(g.id))
}

/**
 * Check if a product is currently soft-deleted / archived.
 */
export const isArchived = (gunId) => {
  if (!gunId) return false
  const strId = String(gunId)
  return getArchivedIds().includes(strId)
}

/**
 * Soft delete (archive) a catalog item.
 * Stores the full product record in the archive.
 * @param {Object} gun
 */
export const archiveGun = (gun) => {
  if (!gun) return
  const list = getArchivedGuns()
  const strId = String(gun.id)

  const existingIdx = list.findIndex((g) => String(g.id) === strId)
  const archivedRecord = {
    ...gun,
    archived_at: new Date().toISOString(),
  }

  if (existingIdx > -1) {
    list[existingIdx] = archivedRecord
  } else {
    list.unshift(archivedRecord)
  }

  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('bore_barrel_archive_updated'))
  return list
}

/**
 * Restore an archived item back to active catalog.
 * @param {string|number} gunId
 */
export const restoreGun = (gunId) => {
  const list = getArchivedGuns()
  const strId = String(gunId)
  const filtered = list.filter((g) => String(g.id) !== strId)
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new Event('bore_barrel_archive_updated'))
  return filtered
}

/**
 * Remove an item permanently from the archive list.
 * @param {string|number} gunId
 */
export const removePermanentFromArchive = (gunId) => {
  const list = getArchivedGuns()
  const strId = String(gunId)
  const filtered = list.filter((g) => String(g.id) !== strId)
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new Event('bore_barrel_archive_updated'))
  return filtered
}

export default {
  getArchivedGuns,
  getArchivedIds,
  isArchived,
  archiveGun,
  restoreGun,
  removePermanentFromArchive,
}
