import { z } from 'zod'

export const brandInfoSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  platform: z.enum(['shopify', 'woocommerce', 'csv', 'custom']),
  platform_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export const brandCredentialsSchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('shopify'),
    platform_url: z.string().url('Shopify store URL is required'),
    access_token: z.string().min(1, 'Access token is required'),
  }),
  z.object({
    platform: z.literal('woocommerce'),
    platform_url: z.string().url('WooCommerce store URL is required'),
    api_key: z.string().min(1, 'Consumer key is required'),
    api_secret: z.string().min(1, 'Consumer secret is required'),
  }),
  z.object({
    platform: z.literal('csv'),
  }),
  z.object({
    platform: z.literal('custom'),
    platform_url: z.string().url().optional().or(z.literal('')),
  }),
])

export const brandAlertConfigSchema = z.object({
  slack_webhook_url: z.string().url('Must be a valid Slack webhook URL').optional().or(z.literal('')),
  alert_email: z.string().email('Must be a valid email').optional().or(z.literal('')),
  default_threshold_days: z.number().min(1).max(90).default(7),
})

export type BrandInfoInput = z.infer<typeof brandInfoSchema>
export type BrandCredentialsInput = z.infer<typeof brandCredentialsSchema>
export type BrandAlertConfigInput = z.infer<typeof brandAlertConfigSchema>
