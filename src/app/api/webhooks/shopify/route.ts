import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface ShopifyWebhookPayload {
  id: number
  title: string
  variants: {
    id: number
    sku: string
    title: string
    inventory_quantity: number
    image_id: number | null
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const payload: ShopifyWebhookPayload = await request.json()
    const shopDomain = request.headers.get('x-shopify-shop-domain')

    if (!shopDomain) {
      return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 })
    }

    const serviceClient = await createServiceRoleClient()

    // Find brand by shop domain
    const { data: brand } = await serviceClient
      .from('brands')
      .select('*')
      .eq('platform', 'shopify')
      .ilike('platform_url', `%${shopDomain}%`)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    for (const variant of payload.variants) {
      if (!variant.sku) continue

      const { data: product } = await serviceClient
        .from('products')
        .upsert(
          {
            brand_id: brand.id,
            sku: variant.sku,
            name: payload.title,
            variant_title: variant.title !== 'Default Title' ? variant.title : null,
            external_id: String(variant.id),
            current_quantity: variant.inventory_quantity,
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
            quantity: variant.inventory_quantity,
            source: 'webhook',
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shopify webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
