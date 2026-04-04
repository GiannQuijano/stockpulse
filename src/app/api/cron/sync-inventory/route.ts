import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { fetchAllShopifyInventory } from '@/lib/integrations/shopify'
import { fetchAllWooCommerceInventory } from '@/lib/integrations/woocommerce'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceRoleClient()

  try {
    // Get all active brands with API integrations
    const { data: brands } = await serviceClient
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .in('platform', ['shopify', 'woocommerce'])

    if (!brands || brands.length === 0) {
      return NextResponse.json({ message: 'No brands to sync' })
    }

    const results: { brandId: string; brandName: string; productsUpdated: number; error?: string }[] = []

    for (const brand of brands) {
      try {
        let items: { externalId: string; sku: string; name: string; variantTitle: string | null; quantity: number; imageUrl: string | null }[] = []

        if (brand.platform === 'shopify' && brand.platform_url && brand.access_token) {
          items = await fetchAllShopifyInventory(brand.platform_url, brand.access_token)
        } else if (brand.platform === 'woocommerce' && brand.platform_url && brand.api_key && brand.api_secret) {
          items = await fetchAllWooCommerceInventory(brand.platform_url, brand.api_key, brand.api_secret)
        } else {
          results.push({ brandId: brand.id, brandName: brand.name, productsUpdated: 0, error: 'Missing credentials' })
          continue
        }

        let productsUpdated = 0

        for (const item of items) {
          const { data: product } = await serviceClient
            .from('products')
            .upsert(
              {
                brand_id: brand.id,
                sku: item.sku,
                name: item.name,
                variant_title: item.variantTitle,
                external_id: item.externalId,
                current_quantity: item.quantity,
                image_url: item.imageUrl,
                is_active: true,
                alert_threshold_days: brand.default_threshold_days,
              },
              { onConflict: 'brand_id,sku' }
            )
            .select('id')
            .single()

          if (product) {
            await serviceClient
              .from('inventory_snapshots')
              .insert({
                product_id: product.id,
                quantity: item.quantity,
                source: 'sync',
              })
            productsUpdated++
          }
        }

        await serviceClient
          .from('brands')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', brand.id)

        results.push({ brandId: brand.id, brandName: brand.name, productsUpdated })
      } catch (error) {
        results.push({
          brandId: brand.id,
          brandName: brand.name,
          productsUpdated: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
