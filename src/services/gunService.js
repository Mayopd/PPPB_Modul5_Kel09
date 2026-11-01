import { apiClient, IS_SUPABASE } from '../config/api'
import queryCache from '../utils/queryCache'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// Supports multiple images natively.
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  // Resolve multiple images
  let images = []
  if (Array.isArray(item.images) && item.images.length > 0) {
    images = item.images
  } else if (typeof item.image_url === 'string') {
    const trimmed = item.image_url.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) {
          images = parsed
        }
      } catch {
        images = [trimmed]
      }
    } else if (trimmed) {
      images = [trimmed]
    }
  } else if (typeof item.image === 'string' && item.image) {
    images = [item.image]
  }

  if (images.length === 0) {
    images = ['/guns/pistol.svg']
  }

  const primaryImage = images[0]

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: primaryImage,
    image: primaryImage,
    images: images,
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// Implements client-side Query Caching with invalidation.
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products with caching.
   */
  async getGuns(params = {}, skipCache = false) {
    const cacheKey = `products_${JSON.stringify(params)}`
    if (!skipCache) {
      const cached = queryCache.get(cacheKey)
      if (cached) return cached
    }

    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      if (params.search) {
        queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
      }

      if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
      } else {
        queryParts.push('order=created_at.desc')
      }

      if (params.limit) {
        queryParts.push(`limit=${params.limit}`)
      }

      const queryString = queryParts.join('&')
      const data = await apiClient.get(`/rest/v1/products?${queryString}`)
      const list = Array.isArray(data) ? data.map(normalizeProduct) : []

      const result = {
        success: true,
        data: list,
        pagination: {
          total: list.length,
          page: params.page || 1,
          limit: params.limit || 50,
        },
      }
      queryCache.set(cacheKey, result, 120000)
      return result
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    )
    const result = await apiClient.get('/api/v1/recipes', { params: clean })
    queryCache.set(cacheKey, result, 120000)
    return result
  }

  /**
   * Fetch a single product by ID with caching.
   */
  async getGunById(id, skipCache = false) {
    const cacheKey = `product_${id}`
    if (!skipCache) {
      const cached = queryCache.get(cacheKey)
      if (cached) return cached
    }

    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
      if (Array.isArray(data) && data.length > 0) {
        const res = { success: true, data: normalizeProduct(data[0]) }
        queryCache.set(cacheKey, res, 120000)
        return res
      }
      throw new Error('Hardware item not found.')
    }
    const res = await apiClient.get(`/api/v1/recipes/${id}`)
    queryCache.set(cacheKey, res, 120000)
    return res
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    queryCache.invalidate('product')

    // Handle multiple images serialization
    let imageUrlPayload = data.image_url || null
    if (Array.isArray(data.images) && data.images.length > 0) {
      imageUrlPayload = JSON.stringify(data.images)
    }

    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: imageUrlPayload,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(created) }
    }
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    queryCache.invalidate('product')

    // Handle multiple images serialization
    let imageUrlPayload = data.image_url
    if (Array.isArray(data.images)) {
      imageUrlPayload = JSON.stringify(data.images)
    }

    if (IS_SUPABASE) {
      const specsArray = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (imageUrlPayload !== undefined) payload.image_url = imageUrlPayload

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      return { success: true, data: normalizeProduct(updated) }
    }
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Delete product.
   */
  async deleteGun(id) {
    queryCache.invalidate('product')
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
