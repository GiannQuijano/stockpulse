import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { parseCsvString } from '@/lib/integrations/csv-parser'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params

  try {
    const supabase = await createServerSupabaseClient()

    // Verify user owns this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvContent = await file.text()
    const result = parseCsvString(csvContent)

    const serviceClient = await createServiceRoleClient()

    // Create import record
    const { data: importRecord } = await serviceClient
      .from('csv_imports')
      .insert({
        brand_id: brandId,
        filename: file.name,
        row_count: result.totalRows,
        status: 'processing',
        user_id: user.id,
      })
      .select('id')
      .single()

    let imported = 0

    for (const row of result.valid) {
      const { data: product } = await serviceClient
        .from('products')
        .upsert(
          {
            brand_id: brandId,
            sku: row.sku,
            name: row.name,
            variant_title: row.variant_title || null,
            external_id: row.external_id || null,
            current_quantity: row.quantity,
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
            quantity: row.quantity,
            source: 'csv',
          })
        imported++
      }
    }

    // Update import record
    if (importRecord) {
      await serviceClient
        .from('csv_imports')
        .update({
          status: result.errors.length > 0 && imported === 0 ? 'failed' : 'completed',
          error_message: result.errors.length > 0
            ? `${result.errors.length} row(s) had errors`
            : null,
        })
        .eq('id', importRecord.id)
    }

    // Update last_synced_at
    await serviceClient
      .from('brands')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', brandId)

    return NextResponse.json({
      success: true,
      imported,
      errors: result.errors.length,
      errorDetails: result.errors.slice(0, 10),
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
