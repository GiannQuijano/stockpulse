import type { AlertRule, ForecastResult, Brand, Product } from '@/lib/supabase/types'
import { sendSlackAlert } from '@/lib/notifications/slack'
import { sendEmailAlert } from '@/lib/notifications/email'

interface AlertContext {
  brand: Brand
  product: Product
  forecast: ForecastResult
}

export async function evaluateAlertRules(
  rules: AlertRule[],
  forecasts: Map<string, ForecastResult>,
  products: Product[],
  brand: Brand,
  recentAlerts: { product_id: string | null; alert_rule_id: string | null; created_at: string }[]
): Promise<{ ruleId: string; productId: string; severity: string; message: string; channels: string[] }[]> {
  const alertsToSend: { ruleId: string; productId: string; severity: string; message: string; channels: string[] }[] = []

  for (const rule of rules) {
    if (!rule.is_active) continue

    for (const product of products) {
      const forecast = forecasts.get(product.id)
      if (!forecast) continue

      // Check if forecast days_remaining crosses rule threshold
      const shouldAlert = shouldTriggerAlert(forecast, rule)
      if (!shouldAlert) continue

      // Check cooldown
      const lastAlert = recentAlerts.find(
        a => a.product_id === product.id && a.alert_rule_id === rule.id
      )
      if (lastAlert && isWithinCooldown(lastAlert.created_at, rule.cooldown_hours)) {
        continue
      }

      const message = buildAlertMessage({ brand, product, forecast })
      alertsToSend.push({
        ruleId: rule.id,
        productId: product.id,
        severity: rule.severity,
        message,
        channels: rule.channels,
      })
    }
  }

  return alertsToSend
}

function shouldTriggerAlert(forecast: ForecastResult, rule: AlertRule): boolean {
  if (forecast.daysRemaining === null) return false

  switch (rule.severity) {
    case 'stockout':
      return forecast.status === 'stockout'
    case 'critical':
      return forecast.daysRemaining <= rule.threshold_days
    case 'warning':
      return forecast.daysRemaining <= rule.threshold_days
    default:
      return false
  }
}

function isWithinCooldown(lastAlertTime: string, cooldownHours: number): boolean {
  const lastAlert = new Date(lastAlertTime)
  const cooldownEnd = new Date(lastAlert.getTime() + cooldownHours * 60 * 60 * 1000)
  return new Date() < cooldownEnd
}

function buildAlertMessage(ctx: AlertContext): string {
  const { brand, product, forecast } = ctx
  const daysText = forecast.daysRemaining !== null
    ? `${Math.round(forecast.daysRemaining)} days remaining`
    : 'Unknown days remaining'

  return `[${brand.name}] ${product.name} (${product.sku}): ${forecast.currentQuantity} units, selling ${forecast.dailyVelocity}/day, ${daysText}. Status: ${forecast.status.toUpperCase()}`
}

export async function dispatchAlert(
  channel: string,
  message: string,
  brand: Brand,
  severity: string
): Promise<boolean> {
  switch (channel) {
    case 'slack':
      if (!brand.slack_webhook_url) return false
      return await sendSlackAlert(brand.slack_webhook_url, message, severity)
    case 'email':
      if (!brand.alert_email) return false
      return await sendEmailAlert(brand.alert_email, `StockPulse Alert: ${brand.name}`, message, severity)
    case 'dashboard':
      return true // Dashboard alerts are just DB records
    default:
      return false
  }
}
