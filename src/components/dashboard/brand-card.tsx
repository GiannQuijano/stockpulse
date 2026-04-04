import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Brand, BrandHealthScore } from '@/lib/supabase/types'

interface BrandCardProps {
  brand: Brand
  health: BrandHealthScore | null
}

export function BrandCard({ brand, health }: BrandCardProps) {
  const healthPercent = health?.healthPercentage ?? 100
  const healthColor = healthPercent >= 80 ? 'healthy' : healthPercent >= 50 ? 'warning' : 'critical'

  return (
    <Link href={`/brands/${brand.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{brand.name}</CardTitle>
          <Badge variant={healthColor}>{healthPercent}% healthy</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {health && (
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-600">{health.healthyCount} healthy</span>
                <span className="text-amber-600">{health.warningCount} warning</span>
                <span className="text-red-600">{health.criticalCount} critical</span>
                {health.stockoutCount > 0 && (
                  <span className="text-gray-900 font-medium">{health.stockoutCount} stockout</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">{brand.platform}</Badge>
              <span>
                {health ? `${health.totalProducts} SKUs` : 'No products'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
