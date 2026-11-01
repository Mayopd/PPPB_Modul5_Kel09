import { useState, useEffect, useCallback } from 'react'
import cartStorage from '../utils/cartStorage'

/**
 * Custom hook to interact with the shopping cart state.
 * Synchronizes across components when cart changes.
 */
export function useCart() {
  const [cart, setCart] = useState(() => cartStorage.getCart())

  const syncCart = useCallback(() => {
    setCart(cartStorage.getCart())
  }, [])

  useEffect(() => {
    window.addEventListener('bore_barrel_cart_updated', syncCart)
    return () => {
      window.removeEventListener('bore_barrel_cart_updated', syncCart)
    }
  }, [syncCart])

  const addToCart = (product, qty = 1) => {
    const updated = cartStorage.addToCart(product, qty)
    setCart(updated)
    return updated
  }

  const updateQuantity = (productId, qty) => {
    const updated = cartStorage.updateCartQuantity(productId, qty)
    setCart(updated)
    return updated
  }

  const removeFromCart = (productId) => {
    const updated = cartStorage.removeFromCart(productId)
    setCart(updated)
    return updated
  }

  const clearCart = () => {
    const updated = cartStorage.clearCart()
    setCart(updated)
    return updated
  }

  const summary = cartStorage.getCartSummary(cart)

  return {
    cart,
    totalItems: summary.totalItems,
    totalPrice: summary.totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    generateWhatsAppUrl: cartStorage.generateWhatsAppUrl,
  }
}

export default useCart
