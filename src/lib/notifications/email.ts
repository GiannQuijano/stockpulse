import { Resend } from 'resend'

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmailAlert(
  to: string,
  subject: string,
  message: string,
  severity: string
): Promise<boolean> {
  const colorMap: Record<string, string> = {
    warning: '#f59e0b',
    critical: '#ef4444',
    stockout: '#111827',
  }

  const color = colorMap[severity] || '#6b7280'

  try {
    const resend = getResendClient()
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'StockPulse <alerts@stockpulse.app>',
      to: [to],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${color}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">StockPulse ${severity.toUpperCase()} Alert</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 14px; line-height: 1.6; color: #374151;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="font-size: 12px; color: #9ca3af;">Sent by StockPulse Inventory Tracking</p>
          </div>
        </div>
      `,
    })
    if (error) {
      console.error('Email alert failed:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Email alert failed:', error)
    return false
  }
}
