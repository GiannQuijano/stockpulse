interface ShopifyProduct {
  id: string
  title: string
  variants: {
    edges: {
      node: {
        id: string
        sku: string
        title: string
        inventoryQuantity: number
        image?: { url: string } | null
      }
    }[]
  }
}

interface ShopifyInventoryItem {
  externalId: string
  sku: string
  name: string
  variantTitle: string | null
  quantity: number
  imageUrl: string | null
}

export async function fetchShopifyInventory(
  shopUrl: string,
  accessToken: string,
  cursor?: string
): Promise<{ items: ShopifyInventoryItem[]; hasNextPage: boolean; endCursor: string | null }> {
  const query = `
    query ($cursor: String) {
      products(first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            variants(first: 100) {
              edges {
                node {
                  id
                  sku
                  title
                  inventoryQuantity
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const url = shopUrl.replace(/\/$/, '')
  const response = await fetch(`${url}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables: { cursor } }),
  })

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${data.errors[0]?.message}`)
  }

  const products = data.data.products
  const items: ShopifyInventoryItem[] = []

  for (const edge of products.edges) {
    const product: ShopifyProduct = edge.node
    for (const variantEdge of product.variants.edges) {
      const variant = variantEdge.node
      if (!variant.sku) continue // Skip variants without SKU

      items.push({
        externalId: variant.id,
        sku: variant.sku,
        name: product.title,
        variantTitle: variant.title !== 'Default Title' ? variant.title : null,
        quantity: variant.inventoryQuantity ?? 0,
        imageUrl: variant.image?.url || null,
      })
    }
  }

  return {
    items,
    hasNextPage: products.pageInfo.hasNextPage,
    endCursor: products.pageInfo.endCursor,
  }
}

export async function fetchAllShopifyInventory(
  shopUrl: string,
  accessToken: string
): Promise<ShopifyInventoryItem[]> {
  const allItems: ShopifyInventoryItem[] = []
  let cursor: string | undefined
  let hasNextPage = true

  while (hasNextPage) {
    const result = await fetchShopifyInventory(shopUrl, accessToken, cursor)
    allItems.push(...result.items)
    hasNextPage = result.hasNextPage
    cursor = result.endCursor ?? undefined

    // Rate limit: wait 500ms between requests
    if (hasNextPage) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return allItems
}
