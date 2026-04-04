import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { InventoryChart } from '@/components/product/inventory-chart'
import { VelocityDisplay } from '@/components/product/velocity-display'
import { ForecastBadge } from '@/components/product/forecast-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateVelocity } from '@/lib/engine/velocity'
import { calculateForecast } from '@/lib/engine/forecast'
import { formatNumber, formatDate } from '@/lib/utils'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ brandId: string; productId: string }>
}) {
  const { brandId, productId } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: brand }, { data: product }] = await Promise.all([
    supabase.from('brands').select('*').eq('id', brandId).single(),
    supabase.from('products').select('*').eq('id', productId).single(),
  ])

  if (!brand || !product) notFound()

  // Get 30 days of snapshots for the chart
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: snapshots } = await supabase
    .from('inventory_snapshots')
    .select('quantity, created_at')
    .eq('product_id', productId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  const snapshotList = snapshots || []

  // Calculate velocity (7-day window)
  const velocity = calculateVelocity(snapshotList)
  const dailyVelocity = velocity?.dailyVelocity ?? 0

  // Calculate forecast
  const forecast = calculateForecast(
    product.id,
    product.current_quantity,
    dailyVelocity,
    product.alert_threshold_days
  )

  // Prepare chart data
  const chartData = snapshotList.map((s) => ({
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    quantity: s.quantity,
  }))

  // Estimate threshold quantity (velocity * threshold days)
  const thresholdQuantity = dailyVelocity > 0 ? Math.round(dailyVelocity * product.alert_threshold_days) : undefined

  // Get recent alerts
  const { data: recentAlerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <Topbar
        title={product.name}
        description={`${product.sku}${product.variant_title ? ` - ${product.variant_title}` : ''}`}
      />
      <div className="p-6 space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatNumber(product.current_quantity)}</p>
              <p className="text-xs text-muted-foreground mt-1">units in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sell-Through Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              {velocity ? (
                <VelocityDisplay
                  dailyVelocity={velocity.dailyVelocity}
                  trend={velocity.trend}
                  confidence={velocity.confidence}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastBadge
                daysRemaining={forecast.daysRemaining}
                status={forecast.status}
                size="lg"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Alert threshold: {product.alert_threshold_days} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory History (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryChart data={chartData} thresholdQuantity={thresholdQuantity} />
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        {recentAlerts && recentAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'stockout'}
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(alert.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">SKU</dt>
                <dd className="font-mono">{product.sku}</dd>
              </div>
              {product.variant_title && (
                <div>
                  <dt className="text-muted-foreground">Variant</dt>
                  <dd>{product.variant_title}</dd>
                </div>
              )}
              {product.external_id && (
                <div>
                  <dt className="text-muted-foreground">External ID</dt>
                  <dd className="font-mono text-xs">{product.external_id}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd>{brand.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Alert Threshold</dt>
                <dd>{product.alert_threshold_days} days</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd>{formatDate(product.updated_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
