interface WooCommerceProduct {
  id: number
  name: string
  sku: string
  stock_quantity: number | null
  images: { src: string }[]
  variations: number[]
}

interface WooCommerceVariation {
  id: number
  sku: string
  stock_quantity: number | null
  attributes: { name: string; option: string }[]
  image: { src: string } | null
}

interface WooInventoryItem {
  externalId: string
  sku: string
  name: string
  variantTitle: string | null
  quantity: number
  imageUrl: string | null
}

export async function fetchWooCommerceInventory(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string,
  page: number = 1
): Promise<{ items: WooInventoryItem[]; hasMore: boolean }> {
  const url = storeUrl.replace(/\/$/, '')
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const response = await fetch(
    `${url}/wp-json/wc/v3/products?per_page=100&page=${page}&stock_status=instock,outofstock`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`)
  }

  const products: WooCommerceProduct[] = await response.json()
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
  const items: WooInventoryItem[] = []

  for (const product of products) {
    if (product.variations.length > 0) {
      // Fetch variations
      const variations = await fetchVariations(url, auth, product.id)
      for (const variation of variations) {
        if (!variation.sku) continue
        items.push({
          externalId: `${product.id}-${variation.id}`,
          sku: variation.sku,
          name: product.name,
          variantTitle: variation.attributes.map(a => a.option).join(' / ') || null,
          quantity: variation.stock_quantity ?? 0,
          imageUrl: variation.image?.src || product.images[0]?.src || null,
        })
      }
    } else {
      if (!product.sku) continue
      items.push({
        externalId: String(product.id),
        sku: product.sku,
        name: product.name,
        variantTitle: null,
        quantity: product.stock_quantity ?? 0,
        imageUrl: product.images[0]?.src || null,
      })
    }
  }

  return { items, hasMore: page < totalPages }
}

async function fetchVariations(
  storeUrl: string,
  auth: string,
  productId: number
): Promise<WooCommerceVariation[]> {
  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/products/${productId}/variations?per_page=100`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  )

  if (!response.ok) return []
  return response.json()
}

export async function fetchAllWooCommerceInventory(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooInventoryItem[]> {
  const allItems: WooInventoryItem[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const result = await fetchWooCommerceInventory(storeUrl, consumerKey, consumerSecret, page)
    allItems.push(...result.items)
    hasMore = result.hasMore
    page++

    // Rate limit
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  return allItems
}
