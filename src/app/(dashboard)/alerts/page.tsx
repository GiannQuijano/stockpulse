export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { Bell } from 'lucide-react'
import type { Alert, AlertSeverity } from '@/lib/supabase/types'

const severityVariant: Record<AlertSeverity, 'warning' | 'critical' | 'stockout'> = {
  warning: 'warning',
  critical: 'critical',
  stockout: 'stockout',
}

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const alerts = (data || []) as Alert[]

  // Fetch brand and product names for display
  const brandIds = Array.from(new Set(alerts.map(a => a.brand_id)))
  const productIds = Array.from(new Set(alerts.filter(a => a.product_id).map(a => a.product_id!)))

  const { data: brandsData } = brandIds.length > 0
    ? await supabase.from('brands').select('id, name').in('id', brandIds)
    : { data: [] as { id: string; name: string }[] }
  const { data: productsData } = productIds.length > 0
    ? await supabase.from('products').select('id, name, sku').in('id', productIds)
    : { data: [] as { id: string; name: string; sku: string }[] }

  const brandMap = new Map((brandsData || []).map((b: { id: string; name: string }) => [b.id, b.name]))
  const productMap = new Map((productsData || []).map((p: { id: string; name: string; sku: string }) => [p.id, { name: p.name, sku: p.sku }]))

  return (
    <div>
      <Topbar title="Alerts" description="Alert history and notifications" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            {!alerts || alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4" />
                <p className="text-sm">No alerts yet</p>
                <p className="text-xs mt-1">Alerts will appear here when inventory thresholds are crossed</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => {
                    const product = alert.product_id ? productMap.get(alert.product_id) : null
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant={severityVariant[alert.severity as AlertSeverity]}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {brandMap.get(alert.brand_id) || '-'}
                        </TableCell>
                        <TableCell>
                          {product ? (
                            <div>
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({product.sku})
                              </span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{alert.channel}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm">
                          {alert.message}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(alert.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
