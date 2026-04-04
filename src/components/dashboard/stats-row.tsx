import { Card, CardContent } from '@/components/ui/card'
import { Package, AlertTriangle, TrendingDown, Store } from 'lucide-react'

interface StatsRowProps {
  totalBrands: number
  totalProducts: number
  warningCount: number
  criticalCount: number
}

export function StatsRow({ totalBrands, totalProducts, warningCount, criticalCount }: StatsRowProps) {
  const stats = [
    { label: 'Active Brands', value: totalBrands, icon: Store, color: 'text-blue-600' },
    { label: 'Total SKUs', value: totalProducts, icon: Package, color: 'text-gray-600' },
    { label: 'Warning', value: warningCount, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'Critical', value: criticalCount, icon: TrendingDown, color: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
