import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { VelocityTrend, VelocityConfidence } from '@/lib/supabase/types'

interface VelocityDisplayProps {
  dailyVelocity: number
  trend: VelocityTrend
  confidence: VelocityConfidence
}

const trendIcons: Record<VelocityTrend, React.ReactNode> = {
  accelerating: <TrendingUp className="h-4 w-4 text-red-500" />,
  stable: <Minus className="h-4 w-4 text-gray-500" />,
  decelerating: <TrendingDown className="h-4 w-4 text-emerald-500" />,
}

const trendLabels: Record<VelocityTrend, string> = {
  accelerating: 'Accelerating',
  stable: 'Stable',
  decelerating: 'Decelerating',
}

const confidenceColors: Record<VelocityConfidence, string> = {
  high: 'text-emerald-600',
  medium: 'text-amber-600',
  low: 'text-gray-400',
}

export function VelocityDisplay({ dailyVelocity, trend, confidence }: VelocityDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{dailyVelocity}</span>
        <span className="text-sm text-muted-foreground">units/day</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          {trendIcons[trend]}
          <span>{trendLabels[trend]}</span>
        </div>
        <span className={`${confidenceColors[confidence]}`}>
          {confidence} confidence
        </span>
      </div>
    </div>
  )
}
