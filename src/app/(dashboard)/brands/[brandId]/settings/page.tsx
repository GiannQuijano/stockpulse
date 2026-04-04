'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import type { Brand } from '@/lib/supabase/types'

export default function BrandSettingsPage() {
  const params = useParams()
  const brandId = params.brandId as string
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState('')
  const [platformUrl, setPlatformUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [alertEmail, setAlertEmail] = useState('')
  const [thresholdDays, setThresholdDays] = useState(7)

  useEffect(() => {
    async function loadBrand() {
      setLoading(true)
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (data) {
        setBrand(data)
        setName(data.name)
        setPlatformUrl(data.platform_url || '')
        setAccessToken(data.access_token || '')
        setApiKey(data.api_key || '')
        setApiSecret(data.api_secret || '')
        setSlackWebhookUrl(data.slack_webhook_url || '')
        setAlertEmail(data.alert_email || '')
        setThresholdDays(data.default_threshold_days)
      }
      setLoading(false)
    }
    loadBrand()
  }, [brandId, supabase])

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('brands')
        .update({
          name: name.trim(),
          platform_url: platformUrl.trim() || null,
          access_token: accessToken.trim() || null,
          api_key: apiKey.trim() || null,
          api_secret: apiSecret.trim() || null,
          slack_webhook_url: slackWebhookUrl.trim() || null,
          alert_email: alertEmail.trim() || null,
          default_threshold_days: thresholdDays,
        })
        .eq('id', brandId)

      if (error) throw error

      toast({ title: 'Settings saved', description: 'Brand settings have been updated' })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !brand) {
    return (
      <div>
        <Topbar title="Brand Settings" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Topbar title={`${brand.name} Settings`} description="Update brand configuration" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Input value={brand.platform} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Store URL</Label>
              <Input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {brand.platform === 'shopify' && (
          <Card>
            <CardHeader>
              <CardTitle>Shopify Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {brand.platform === 'woocommerce' && (
          <Card>
            <CardHeader>
              <CardTitle>WooCommerce Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Consumer Key</Label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Consumer Secret</Label>
                <Input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Slack Webhook URL</Label>
              <Input value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." />
            </div>
            <div className="space-y-2">
              <Label>Alert Email</Label>
              <Input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="team@agency.com" />
            </div>
            <div className="space-y-2">
              <Label>Default Alert Threshold (days)</Label>
              <Input type="number" min={1} max={90} value={thresholdDays} onChange={(e) => setThresholdDays(parseInt(e.target.value) || 7)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
