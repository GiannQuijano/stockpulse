import type { InventorySnapshot, VelocityResult, VelocityTrend, VelocityConfidence } from '@/lib/supabase/types'

interface SnapshotPair {
  quantity: number
  timestamp: Date
}

function detectRestocks(snapshots: SnapshotPair[]): SnapshotPair[] {
  // Filter out intervals where quantity increased (restock events)
  if (snapshots.length < 2) return snapshots

  const filtered: SnapshotPair[] = [snapshots[0]]
  for (let i = 1; i < snapshots.length; i++) {
    // If quantity went up from previous, it's a restock - start fresh from here
    if (snapshots[i].quantity > snapshots[i - 1].quantity) {
      filtered.length = 0
      filtered.push(snapshots[i])
    } else {
      filtered.push(snapshots[i])
    }
  }
  return filtered
}

export function calculateVelocity(
  snapshots: Pick<InventorySnapshot, 'quantity' | 'created_at'>[],
  windowDays: number = 7
): VelocityResult | null {
  if (snapshots.length < 2) return null

  const now = new Date()
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  // Sort by created_at ascending
  const sorted = snapshots
    .map(s => ({ quantity: s.quantity, timestamp: new Date(s.created_at) }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .filter(s => s.timestamp >= windowStart)

  if (sorted.length < 2) return null

  // Remove restock intervals
  const cleaned = detectRestocks(sorted)
  if (cleaned.length < 2) return null

  // Calculate total units sold over the time window
  const first = cleaned[0]
  const last = cleaned[cleaned.length - 1]
  const unitsSold = first.quantity - last.quantity
  const daysBetween = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60 * 24)

  if (daysBetween <= 0) return null

  const dailyVelocity = Math.max(0, unitsSold / daysBetween)

  // Calculate trend: compare 3-day vs 7-day velocity
  const trend = calculateTrend(sorted, dailyVelocity)

  // Calculate confidence based on data points
  const dataPointDays = daysBetween
  const confidence: VelocityConfidence =
    dataPointDays >= 7 ? 'high' :
    dataPointDays >= 3 ? 'medium' :
    'low'

  return {
    productId: '', // Will be set by caller
    dailyVelocity: Math.round(dailyVelocity * 100) / 100,
    trend,
    confidence,
    dataPoints: cleaned.length,
  }
}

function calculateTrend(
  snapshots: SnapshotPair[],
  overallVelocity: number
): VelocityTrend {
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const recentSnapshots = snapshots.filter(s => s.timestamp >= threeDaysAgo)
  if (recentSnapshots.length < 2) return 'stable'

  const recentCleaned = detectRestocks(recentSnapshots)
  if (recentCleaned.length < 2) return 'stable'

  const first = recentCleaned[0]
  const last = recentCleaned[recentCleaned.length - 1]
  const recentUnitsSold = first.quantity - last.quantity
  const recentDays = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60 * 24)

  if (recentDays <= 0) return 'stable'

  const recentVelocity = Math.max(0, recentUnitsSold / recentDays)

  if (overallVelocity === 0) return 'stable'

  const ratio = recentVelocity / overallVelocity
  if (ratio > 1.2) return 'accelerating'
  if (ratio < 0.8) return 'decelerating'
  return 'stable'
}
