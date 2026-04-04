export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { StatsRow } from '@/components/dashboard/stats-row'
import { BrandCard } from '@/components/dashboard/brand-card'
import { UrgentSkusTable } from '@/components/dashboard/urgent-skus-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateVelocity } from '@/lib/engine/velocity'
import { calculateForecast, calculateBrandHealth } from '@/lib/engine/forecast'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { ForecastResult, BrandHealthScore, StockStatus } from '@/lib/supabase/types'

interface UrgentSku {
  productId: string
  brandId: string
  brandName: string
  productName: string
  sku: string
  currentQuantity: number
  dailyVelocity: number
  daysRemaining: number | null
  status: StockStatus
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (!brands || brands.length === 0) {
    return (
      <div>
        <Topbar title="Dashboard" description="Agency inventory overview" />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium mb-2">Welcome to StockPulse</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first brand to start tracking inventory
              </p>
              <Link href="/brands/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Brand
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fetch all products across brands
  const brandIds = brands.map(b => b.id)
  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .in('brand_id', brandIds)
    .eq('is_active', true)

  const products = allProducts || []

  // Get recent snapshots for velocity calculation (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const productIds = products.map(p => p.id)

  let snapshots: { product_id: string; quantity: number; created_at: string }[] = []
  if (productIds.length > 0) {
    const { data } = await supabase
      .from('inventory_snapshots')
      .select('product_id, quantity, created_at')
      .in('product_id', productIds)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })
    snapshots = data || []
  }

  // Group snapshots by product
  const snapshotsByProduct = new Map<string, typeof snapshots>()
  for (const snap of snapshots) {
    const existing = snapshotsByProduct.get(snap.product_id) || []
    existing.push(snap)
    snapshotsByProduct.set(snap.product_id, existing)
  }

  // Calculate forecasts per product
  const forecastsByBrand = new Map<string, ForecastResult[]>()
  const allUrgent: UrgentSku[] = []

  for (const product of products) {
    const productSnapshots = snapshotsByProduct.get(product.id) || []
    const velocity = calculateVelocity(productSnapshots)
    const dailyVelocity = velocity?.dailyVelocity ?? 0
    const forecast = calculateForecast(
      product.id,
      product.current_quantity,
      dailyVelocity,
      product.alert_threshold_days
    )

    const brandForecasts = forecastsByBrand.get(product.brand_id) || []
    brandForecasts.push(forecast)
    forecastsByBrand.set(product.brand_id, brandForecasts)

    if (forecast.status !== 'healthy') {
      const brand = brands.find(b => b.id === product.brand_id)
      allUrgent.push({
        productId: product.id,
        brandId: product.brand_id,
        brandName: brand?.name || 'Unknown',
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.current_quantity,
        dailyVelocity: forecast.dailyVelocity,
        daysRemaining: forecast.daysRemaining,
        status: forecast.status,
      })
    }
  }

  // Sort urgent by days remaining (null/stockout first, then ascending)
  allUrgent.sort((a, b) => {
    if (a.daysRemaining === null && b.daysRemaining === null) return 0
    if (a.daysRemaining === null || a.daysRemaining === 0) return -1
    if (b.daysRemaining === null || b.daysRemaining === 0) return 1
    return a.daysRemaining - b.daysRemaining
  })

  // Calculate brand health scores
  const brandHealthMap = new Map<string, BrandHealthScore>()
  for (const brand of brands) {
    const forecasts = forecastsByBrand.get(brand.id) || []
    const health = calculateBrandHealth(forecasts)
    brandHealthMap.set(brand.id, { ...health, brandId: brand.id })
  }

  // Aggregate stats
  const totalWarning = allUrgent.filter(s => s.status === 'warning').length
  const totalCritical = allUrgent.filter(s => s.status === 'critical' || s.status === 'stockout').length

  return (
    <div>
      <Topbar
        title="Dashboard"
        description="Agency inventory overview"
        action={
          <Link href="/brands/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </Link>
        }
      />
      <div className="p-6 space-y-6">
        <StatsRow
          totalBrands={brands.length}
          totalProducts={products.length}
          warningCount={totalWarning}
          criticalCount={totalCritical}
        />

        <div>
          <h2 className="text-lg font-semibold mb-4">Brands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                health={brandHealthMap.get(brand.id) || null}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Urgent SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <UrgentSkusTable skus={allUrgent.slice(0, 20)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
