import { Badge } from '@/components/ui/badge'
import { daysFromNow } from '@/lib/utils'
import type { StockStatus } from '@/lib/supabase/types'

interface ForecastBadgeProps {
  daysRemaining: number | null
  status: StockStatus
  size?: 'sm' | 'lg'
}

const statusVariantMap: Record<StockStatus, 'healthy' | 'warning' | 'critical' | 'stockout'> = {
  healthy: 'healthy',
  warning: 'warning',
  critical: 'critical',
  stockout: 'stockout',
}

export function ForecastBadge({ daysRemaining, status, size = 'sm' }: ForecastBadgeProps) {
  const sizeClasses = size === 'lg' ? 'text-lg px-4 py-2' : ''

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusVariantMap[status]} className={sizeClasses}>
        {status.toUpperCase()}
      </Badge>
      {daysRemaining !== null && (
        <span className={`text-muted-foreground ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          {daysFromNow(daysRemaining)}
        </span>
      )}
    </div>
  )
}
