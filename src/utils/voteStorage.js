// ---------------------------------------------------------------------------
// voteStorage.js — Thumbs Up / Thumbs Down reaction storage for reviews.
// Persists votes in localStorage.
// ---------------------------------------------------------------------------

const VOTES_KEY = 'bore_barrel_review_votes'

/**
 * Get all stored votes.
 * Shape: { [reviewId]: { up: number, down: number, userVote: 'up' | 'down' | null } }
 */
export const getStoredVotes = () => {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Get votes for a specific review ID.
 * Generates deterministic base counts based on reviewId so UI isn't empty.
 */
export const getReviewVote = (reviewId) => {
  const all = getStoredVotes()
  if (all[reviewId]) {
    return all[reviewId]
  }

  // Generate pleasant initial base vote counts deterministically from ID
  const hash = String(reviewId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const defaultUp = (hash % 8) + 1
  const defaultDown = hash % 2

  return {
    up: defaultUp,
    down: defaultDown,
    userVote: null,
  }
}

/**
 * Cast or toggle thumbs up / thumbs down vote.
 * @param {string|number} reviewId
 * @param {'up'|'down'} type
 */
export const castVote = (reviewId, type) => {
  const all = getStoredVotes()
  const current = getReviewVote(reviewId)

  let newUp = current.up
  let newDown = current.down
  let newUserVote = null

  if (current.userVote === type) {
    // Toggling off the current vote
    if (type === 'up') newUp = Math.max(0, newUp - 1)
    if (type === 'down') newDown = Math.max(0, newDown - 1)
    newUserVote = null
  } else {
    // Changing vote or voting for first time
    if (current.userVote === 'up') newUp = Math.max(0, newUp - 1)
    if (current.userVote === 'down') newDown = Math.max(0, newDown - 1)

    if (type === 'up') newUp += 1
    if (type === 'down') newDown += 1
    newUserVote = type
  }

  const updated = {
    up: newUp,
    down: newDown,
    userVote: newUserVote,
  }

  all[reviewId] = updated
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(all))
  } catch (err) {
    console.error('Failed to save review vote:', err)
  }

  return updated
}

export default {
  getStoredVotes,
  getReviewVote,
  castVote,
}
