import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { calculateVelocity } from '@/lib/engine/velocity'
import { calculateForecast } from '@/lib/engine/forecast'
import { evaluateAlertRules, dispatchAlert } from '@/lib/engine/alerts'
import type { ForecastResult } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceRoleClient()

  try {
    const { data: brands } = await serviceClient
      .from('brands')
      .select('*')
      .eq('is_active', true)

    if (!brands || brands.length === 0) {
      return NextResponse.json({ message: 'No brands to check' })
    }

    let totalAlertsSent = 0

    for (const brand of brands) {
      // Get active alert rules for this brand
      const { data: rules } = await serviceClient
        .from('alert_rules')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('is_active', true)

      if (!rules || rules.length === 0) continue

      // Get products
      const { data: products } = await serviceClient
        .from('products')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('is_active', true)

      if (!products || products.length === 0) continue

      // Get snapshots for velocity (7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const productIds = products.map(p => p.id)

      const { data: snapshots } = await serviceClient
        .from('inventory_snapshots')
        .select('product_id, quantity, created_at')
        .in('product_id', productIds)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true })

      // Group snapshots
      const snapshotsByProduct = new Map<string, typeof snapshots>()
      for (const snap of (snapshots || [])) {
        const existing = snapshotsByProduct.get(snap.product_id) || []
        existing.push(snap)
        snapshotsByProduct.set(snap.product_id, existing)
      }

      // Calculate forecasts
      const forecasts = new Map<string, ForecastResult>()
      for (const product of products) {
        const productSnapshots = snapshotsByProduct.get(product.id) || []
        const velocity = calculateVelocity(productSnapshots)
        const forecast = calculateForecast(
          product.id,
          product.current_quantity,
          velocity?.dailyVelocity ?? 0,
          product.alert_threshold_days
        )
        forecasts.set(product.id, forecast)
      }

      // Get recent alerts for cooldown check
      const { data: recentAlerts } = await serviceClient
        .from('alerts')
        .select('product_id, alert_rule_id, created_at')
        .eq('brand_id', brand.id)
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())

      // Evaluate rules
      const alertsToSend = await evaluateAlertRules(
        rules,
        forecasts,
        products,
        brand,
        recentAlerts || []
      )

      // Dispatch and record alerts
      for (const alert of alertsToSend) {
        for (const channel of alert.channels) {
          const sent = await dispatchAlert(channel, alert.message, brand, alert.severity)

          await serviceClient
            .from('alerts')
            .insert({
              brand_id: brand.id,
              product_id: alert.productId,
              alert_rule_id: alert.ruleId,
              severity: alert.severity,
              channel,
              message: alert.message,
              sent_at: sent ? new Date().toISOString() : null,
            })

          if (sent) totalAlertsSent++
        }
      }
    }

    return NextResponse.json({ success: true, alertsSent: totalAlertsSent })
  } catch (error) {
    console.error('Alert check error:', error)
    return NextResponse.json({ error: 'Alert check failed' }, { status: 500 })
  }
}
