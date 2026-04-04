import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { daysFromNow } from '@/lib/utils'
import type { StockStatus } from '@/lib/supabase/types'

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

interface UrgentSkusTableProps {
  skus: UrgentSku[]
}

const statusVariantMap: Record<StockStatus, 'healthy' | 'warning' | 'critical' | 'stockout'> = {
  healthy: 'healthy',
  warning: 'warning',
  critical: 'critical',
  stockout: 'stockout',
}

export function UrgentSkusTable({ skus }: UrgentSkusTableProps) {
  if (skus.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No urgent SKUs - all inventory levels are healthy
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Velocity</TableHead>
          <TableHead className="text-right">Days Left</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skus.map((sku) => (
          <TableRow key={sku.productId}>
            <TableCell>
              <Link
                href={`/brands/${sku.brandId}/products/${sku.productId}`}
                className="font-medium hover:underline"
              >
                {sku.productName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{sku.brandName}</TableCell>
            <TableCell className="font-mono text-xs">{sku.sku}</TableCell>
            <TableCell className="text-right">{sku.currentQuantity}</TableCell>
            <TableCell className="text-right">{sku.dailyVelocity}/day</TableCell>
            <TableCell className="text-right">
              {sku.daysRemaining !== null ? daysFromNow(sku.daysRemaining) : '-'}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariantMap[sku.status]}>
                {sku.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
