'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ChartDataPoint {
  date: string
  quantity: number
}

interface InventoryChartProps {
  data: ChartDataPoint[]
  thresholdQuantity?: number
}

export function InventoryChart({ data, thresholdQuantity }: InventoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        No snapshot data available yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Line
          type="monotone"
          dataKey="quantity"
          stroke="hsl(222.2, 47.4%, 11.2%)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        {thresholdQuantity !== undefined && (
          <ReferenceLine
            y={thresholdQuantity}
            stroke="hsl(0, 84%, 60%)"
            strokeDasharray="5 5"
            label={{ value: 'Threshold', position: 'right', fontSize: 11, fill: 'hsl(0, 84%, 60%)' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
