export async function sendSlackAlert(
  webhookUrl: string,
  message: string,
  severity: string
): Promise<boolean> {
  const colorMap: Record<string, string> = {
    warning: '#f59e0b',
    critical: '#ef4444',
    stockout: '#111827',
  }

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `StockPulse ${severity.toUpperCase()} Alert`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
    attachments: [
      {
        color: colorMap[severity] || '#6b7280',
        blocks: [],
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (error) {
    console.error('Slack alert failed:', error)
    return false
  }
}
