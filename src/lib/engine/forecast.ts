import type { StockStatus, ForecastResult } from '@/lib/supabase/types'

export function calculateForecast(
  productId: string,
  currentQuantity: number,
  dailyVelocity: number,
  thresholdDays: number
): ForecastResult {
  // No velocity data or zero velocity
  if (dailyVelocity <= 0) {
    return {
      productId,
      daysRemaining: currentQuantity > 0 ? null : 0,
      status: currentQuantity > 0 ? 'healthy' : 'stockout',
      dailyVelocity: 0,
      currentQuantity,
    }
  }

  // Already out of stock
  if (currentQuantity <= 0) {
    return {
      productId,
      daysRemaining: 0,
      status: 'stockout',
      dailyVelocity,
      currentQuantity: 0,
    }
  }

  const daysRemaining = currentQuantity / dailyVelocity
  const status = classifyStatus(daysRemaining, thresholdDays)

  return {
    productId,
    daysRemaining: Math.round(daysRemaining * 10) / 10,
    status,
    dailyVelocity,
    currentQuantity,
  }
}

function classifyStatus(daysRemaining: number, thresholdDays: number): StockStatus {
  if (daysRemaining <= 0) return 'stockout'
  if (daysRemaining <= thresholdDays) return 'critical'
  if (daysRemaining <= thresholdDays * 2) return 'warning'
  return 'healthy'
}

export function calculateBrandHealth(forecasts: ForecastResult[]) {
  const total = forecasts.length
  if (total === 0) {
    return {
      totalProducts: 0,
      healthyCount: 0,
      warningCount: 0,
      criticalCount: 0,
      stockoutCount: 0,
      healthPercentage: 100,
    }
  }

  const counts = forecasts.reduce(
    (acc, f) => {
      acc[f.status]++
      return acc
    },
    { healthy: 0, warning: 0, critical: 0, stockout: 0 }
  )

  return {
    totalProducts: total,
    healthyCount: counts.healthy,
    warningCount: counts.warning,
    criticalCount: counts.critical,
    stockoutCount: counts.stockout,
    healthPercentage: Math.round((counts.healthy / total) * 100),
  }
}
