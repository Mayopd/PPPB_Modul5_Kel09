// ---------------------------------------------------------------------------
// cartStorage.js — Shopping Cart storage and WhatsApp checkout formatting.
// Persists cart in localStorage for offline reliability.
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'
const DEFAULT_SELLER_PHONE = '081384229093'

/**
 * Get current cart items from localStorage.
 * @returns {Array} Array of cart items
 */
export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save cart items to localStorage.
 * @param {Array} items
 */
export const saveCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    // Dispatch a custom event so other components can synchronize if needed
    window.dispatchEvent(new Event('bore_barrel_cart_updated'))
  } catch (err) {
    console.error('Failed to save cart:', err)
  }
}

/**
 * Add product to cart or increment its quantity.
 * @param {Object} product
 * @param {number} qty
 * @returns {Array} updated cart
 */
export const addToCart = (product, qty = 1) => {
  const cart = getCart()
  const prodId = product.id ?? product.name
  const existingIdx = cart.findIndex((item) => (item.id ?? item.name) === prodId)

  const price = Number(product.price ?? product.cook_time ?? 0)
  const image = product.image_url || product.image || (product.images && product.images[0]) || '/guns/pistol.svg'

  if (existingIdx > -1) {
    cart[existingIdx].quantity += qty
  } else {
    cart.push({
      id: prodId,
      name: product.name,
      type: product.type || product.category || 'Hardware',
      caliber: product.caliber || '',
      price: price,
      image: image,
      quantity: Math.max(1, qty),
    })
  }

  saveCart(cart)
  return cart
}

/**
 * Update quantity of a product in the cart.
 * If qty <= 0, the item is removed.
 */
export const updateCartQuantity = (productId, qty) => {
  let cart = getCart()
  if (qty <= 0) {
    cart = cart.filter((item) => (item.id ?? item.name) !== productId)
  } else {
    cart = cart.map((item) => {
      if ((item.id ?? item.name) === productId) {
        return { ...item, quantity: qty }
      }
      return item
    })
  }
  saveCart(cart)
  return cart
}

/**
 * Remove an item from the cart.
 */
export const removeFromCart = (productId) => {
  const cart = getCart().filter((item) => (item.id ?? item.name) !== productId)
  saveCart(cart)
  return cart
}

/**
 * Empty the cart.
 */
export const clearCart = () => {
  saveCart([])
  return []
}

/**
 * Calculate total quantity and price.
 */
export const getCartSummary = (items = null) => {
  const list = items || getCart()
  const totalItems = list.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = list.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0,
  )
  return { totalItems, totalPrice }
}

/**
 * Generate formatted WhatsApp checkout message and direct URL.
 * Message follows the required format:
 * "Hi aku mau pesan: ..."
 * @param {string} phone
 * @param {string} buyerNotes
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppUrl = (phone = DEFAULT_SELLER_PHONE, buyerNotes = '') => {
  const cart = getCart()
  if (cart.length === 0) return ''

  const { totalPrice } = getCartSummary(cart)

  let message = 'Hi aku mau pesan:\n'
  cart.forEach((item) => {
    const subtotal = (Number(item.price) || 0) * item.quantity
    message += `- ${item.name} (${item.quantity}x) - $${subtotal.toLocaleString()}\n`
  })

  message += `\nTotal: $${totalPrice.toLocaleString()}`

  if (buyerNotes && buyerNotes.trim()) {
    message += `\nCatatan: ${buyerNotes.trim()}`
  }

  message += '\n\nMohon info ketersediaan stok dan cara pembayarannya. Terima kasih!'

  // Clean phone number (strip spaces, +, dashes) and normalize leading 0 to 62
  let cleanPhone = phone.replace(/[^0-9]/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export default {
  getCart,
  saveCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartSummary,
  generateWhatsAppUrl,
  DEFAULT_SELLER_PHONE,
}
