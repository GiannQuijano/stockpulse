'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import type { Platform } from '@/lib/supabase/types'

type Step = 1 | 2 | 3

export default function NewBrandPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Step 1: Brand Info
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<Platform>('shopify')
  const [platformUrl, setPlatformUrl] = useState('')

  // Step 2: Credentials
  const [accessToken, setAccessToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')

  // Step 3: Alert Config
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [alertEmail, setAlertEmail] = useState('')
  const [thresholdDays, setThresholdDays] = useState(7)

  const steps = [
    { num: 1, label: 'Brand Info' },
    { num: 2, label: 'Credentials' },
    { num: 3, label: 'Alerts' },
  ]

  function canProceedStep1() {
    return name.trim().length > 0
  }

  function canProceedStep2() {
    if (platform === 'shopify') return platformUrl.trim().length > 0 && accessToken.trim().length > 0
    if (platform === 'woocommerce') return platformUrl.trim().length > 0 && apiKey.trim().length > 0 && apiSecret.trim().length > 0
    return true // csv and custom don't require credentials
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: brand, error } = await supabase
        .from('brands')
        .insert({
          name: name.trim(),
          platform,
          platform_url: platformUrl.trim() || null,
          access_token: platform === 'shopify' ? accessToken.trim() : null,
          api_key: platform === 'woocommerce' ? apiKey.trim() : null,
          api_secret: platform === 'woocommerce' ? apiSecret.trim() : null,
          slack_webhook_url: slackWebhookUrl.trim() || null,
          alert_email: alertEmail.trim() || null,
          default_threshold_days: thresholdDays,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Create default alert rules
      await supabase.from('alert_rules').insert([
        {
          brand_id: brand.id,
          name: 'Warning - 7 Day Threshold',
          threshold_days: thresholdDays * 2,
          severity: 'warning',
          channels: ['dashboard', ...(slackWebhookUrl ? ['slack'] : []), ...(alertEmail ? ['email'] : [])],
          cooldown_hours: 24,
          is_active: true,
        },
        {
          brand_id: brand.id,
          name: 'Critical - 3 Day Threshold',
          threshold_days: thresholdDays,
          severity: 'critical',
          channels: ['dashboard', ...(slackWebhookUrl ? ['slack'] : []), ...(alertEmail ? ['email'] : [])],
          cooldown_hours: 12,
          is_active: true,
        },
      ])

      toast({ title: 'Brand created', description: `${name} has been added successfully` })
      router.push(`/brands/${brand.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create brand',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Topbar title="Add New Brand" description="Connect a client brand to start tracking inventory" />
      <div className="p-6 max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  step > s.num ? 'bg-primary text-primary-foreground border-primary' :
                  step === s.num ? 'border-primary text-primary' :
                  'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Brand Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>Basic information about the client brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Fashion"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="csv">CSV Upload Only</SelectItem>
                    <SelectItem value="custom">Custom Platform</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(platform === 'shopify' || platform === 'woocommerce' || platform === 'custom') && (
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">Store URL</Label>
                  <Input
                    id="platformUrl"
                    placeholder={platform === 'shopify' ? 'https://store.myshopify.com' : 'https://store.com'}
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1()}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Credentials</CardTitle>
              <CardDescription>
                {platform === 'csv' ? 'No credentials needed for CSV-only brands' :
                 platform === 'custom' ? 'Optional credentials for custom integrations' :
                 `API credentials for ${platform}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform === 'shopify' && (
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="shpat_..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a custom app in your Shopify admin with read_products and read_inventory scopes
                  </p>
                </div>
              )}
              {platform === 'woocommerce' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Consumer Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="ck_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">Consumer Secret</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      placeholder="cs_..."
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                    />
                  </div>
                </>
              )}
              {(platform === 'csv' || platform === 'custom') && (
                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                  {platform === 'csv'
                    ? 'You can upload inventory data via CSV after creating the brand.'
                    : 'You can configure API credentials later in brand settings.'}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2()}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Alert Config */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Set up notifications for low inventory alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack Webhook URL (optional)</Label>
                <Input
                  id="slackWebhook"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alertEmail">Alert Email (optional)</Label>
                <Input
                  id="alertEmail"
                  type="email"
                  placeholder="team@agency.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Default Alert Threshold (days)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={1}
                  max={90}
                  value={thresholdDays}
                  onChange={(e) => setThresholdDays(parseInt(e.target.value) || 7)}
                />
                <p className="text-xs text-muted-foreground">
                  Critical alerts fire when a product has fewer than {thresholdDays} days of stock remaining.
                  Warning alerts fire at {thresholdDays * 2} days.
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Brand'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
