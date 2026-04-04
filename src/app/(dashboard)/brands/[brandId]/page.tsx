import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { ProductTable } from '@/components/brand/product-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Upload, Settings } from 'lucide-react'
import { calculateVelocity } from '@/lib/engine/velocity'
import { calculateForecast, calculateBrandHealth } from '@/lib/engine/forecast'
import { SyncButton } from '@/components/brand/sync-button'
import { CsvUploadDialog } from '@/components/brand/csv-upload-dialog'
import type { ForecastResult } from '@/lib/supabase/types'

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const { brandId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single()

  if (!brand) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('name')

  const productList = products || []

  // Get snapshots for velocity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const productIds = productList.map(p => p.id)

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

  // Group snapshots and compute forecasts
  const snapshotsByProduct = new Map<string, typeof snapshots>()
  for (const snap of snapshots) {
    const existing = snapshotsByProduct.get(snap.product_id) || []
    existing.push(snap)
    snapshotsByProduct.set(snap.product_id, existing)
  }

  const forecasts: ForecastResult[] = productList.map((product) => {
    const productSnapshots = snapshotsByProduct.get(product.id) || []
    const velocity = calculateVelocity(productSnapshots)
    return calculateForecast(
      product.id,
      product.current_quantity,
      velocity?.dailyVelocity ?? 0,
      product.alert_threshold_days
    )
  })

  const forecastMap = new Map(forecasts.map(f => [f.productId, f]))
  const health = calculateBrandHealth(forecasts)
  const healthPercent = health.healthPercentage
  const healthVariant = healthPercent >= 80 ? 'healthy' : healthPercent >= 50 ? 'warning' : 'critical'

  return (
    <div>
      <Topbar
        title={brand.name}
        description={`${brand.platform} integration`}
        action={
          <div className="flex items-center gap-2">
            <CsvUploadDialog brandId={brand.id} />
            {brand.platform !== 'csv' && <SyncButton brandId={brand.id} />}
            <Link href={`/brands/${brand.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{health.totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total SKUs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-600">{health.healthyCount}</p>
              <p className="text-xs text-muted-foreground">Healthy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-600">{health.warningCount}</p>
              <p className="text-xs text-muted-foreground">Warning</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-red-600">{health.criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Badge variant={healthVariant} className="text-lg px-3 py-1">
                {healthPercent}%
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Health Score</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductTable
              products={productList}
              forecasts={forecastMap}
              brandId={brand.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
