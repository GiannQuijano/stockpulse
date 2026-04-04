'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { daysFromNow, formatNumber } from '@/lib/utils'
import type { Product, ForecastResult, StockStatus } from '@/lib/supabase/types'

interface ProductTableProps {
  products: Product[]
  forecasts: Map<string, ForecastResult>
  brandId: string
}

const statusVariantMap: Record<StockStatus, 'healthy' | 'warning' | 'critical' | 'stockout'> = {
  healthy: 'healthy',
  warning: 'warning',
  critical: 'critical',
  stockout: 'stockout',
}

export function ProductTable({ products, forecasts, brandId }: ProductTableProps) {
  // Sort: stockout first, then by days remaining ascending
  const sorted = [...products].sort((a, b) => {
    const fa = forecasts.get(a.id)
    const fb = forecasts.get(b.id)
    const statusOrder: Record<StockStatus, number> = { stockout: 0, critical: 1, warning: 2, healthy: 3 }
    const orderA = fa ? statusOrder[fa.status] : 4
    const orderB = fb ? statusOrder[fb.status] : 4
    if (orderA !== orderB) return orderA - orderB
    const daysA = fa?.daysRemaining ?? Infinity
    const daysB = fb?.daysRemaining ?? Infinity
    return daysA - daysB
  })

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No products yet. Sync inventory or upload a CSV to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Velocity</TableHead>
          <TableHead className="text-right">Days Left</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((product) => {
          const forecast = forecasts.get(product.id)
          return (
            <TableRow key={product.id}>
              <TableCell>
                <Link
                  href={`/brands/${brandId}/products/${product.id}`}
                  className="font-medium hover:underline"
                >
                  {product.name}
                  {product.variant_title && (
                    <span className="text-muted-foreground ml-1">- {product.variant_title}</span>
                  )}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{product.sku}</TableCell>
              <TableCell className="text-right">{formatNumber(product.current_quantity)}</TableCell>
              <TableCell className="text-right">
                {forecast ? `${forecast.dailyVelocity}/day` : '-'}
              </TableCell>
              <TableCell className="text-right">
                {forecast?.daysRemaining !== null && forecast?.daysRemaining !== undefined
                  ? daysFromNow(forecast.daysRemaining)
                  : '-'}
              </TableCell>
              <TableCell>
                {forecast && (
                  <Badge variant={statusVariantMap[forecast.status]}>
                    {forecast.status}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
