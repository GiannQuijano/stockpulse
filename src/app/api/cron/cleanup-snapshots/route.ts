import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const serviceClient = await createServiceRoleClient()

    // Delete snapshots older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await serviceClient
      .from('inventory_snapshots')
      .delete()
      .lt('created_at', ninetyDaysAgo)
      .select('id')

    return NextResponse.json({
      success: true,
      deletedSnapshots: data?.length || 0,
      cutoffDate: ninetyDaysAgo,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
