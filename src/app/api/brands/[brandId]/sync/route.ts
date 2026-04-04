import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { fetchAllShopifyInventory } from '@/lib/integrations/shopify'
import { fetchAllWooCommerceInventory } from '@/lib/integrations/woocommerce'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params

  try {
    // Verify user owns this brand
    const supabase = await createServerSupabaseClient()
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Use service role for data operations
    const serviceClient = await createServiceRoleClient()

    let items: { externalId: string; sku: string; name: string; variantTitle: string | null; quantity: number; imageUrl: string | null }[] = []

    if (brand.platform === 'shopify' && brand.platform_url && brand.access_token) {
      items = await fetchAllShopifyInventory(brand.platform_url, brand.access_token)
    } else if (brand.platform === 'woocommerce' && brand.platform_url && brand.api_key && brand.api_secret) {
      items = await fetchAllWooCommerceInventory(brand.platform_url, brand.api_key, brand.api_secret)
    } else if (brand.platform === 'csv') {
      return NextResponse.json({ error: 'CSV brands must use file upload' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Missing platform credentials' }, { status: 400 })
    }

    let productsUpdated = 0

    for (const item of items) {
      // Upsert product
      const { data: product } = await serviceClient
        .from('products')
        .upsert(
          {
            brand_id: brandId,
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
        // Insert snapshot
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

    // Update last_synced_at
    await serviceClient
      .from('brands')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', brandId)

    return NextResponse.json({ success: true, productsUpdated })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
