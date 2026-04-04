'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface SyncButtonProps {
  brandId: string
}

export function SyncButton({ brandId }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSync() {
    setSyncing(true)
    try {
      const response = await fetch(`/api/brands/${brandId}/sync`, { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      toast({
        title: 'Sync complete',
        description: `Updated ${data.productsUpdated} products`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync Now'}
    </Button>
  )
}
