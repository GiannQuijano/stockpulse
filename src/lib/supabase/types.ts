export type Platform = 'shopify' | 'woocommerce' | 'csv' | 'custom'
export type AlertSeverity = 'warning' | 'critical' | 'stockout'
export type AlertChannel = 'slack' | 'email' | 'dashboard'
export type StockStatus = 'healthy' | 'warning' | 'critical' | 'stockout'
export type VelocityTrend = 'accelerating' | 'stable' | 'decelerating'
export type VelocityConfidence = 'high' | 'medium' | 'low'

export interface Brand {
  id: string
  created_at: string
  updated_at: string
  name: string
  platform: Platform
  platform_url: string | null
  api_key: string | null
  api_secret: string | null
  access_token: string | null
  slack_webhook_url: string | null
  alert_email: string | null
  default_threshold_days: number
  is_active: boolean
  last_synced_at: string | null
  user_id: string
}

export interface Product {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  external_id: string | null
  sku: string
  name: string
  variant_title: string | null
  current_quantity: number
  alert_threshold_days: number
  image_url: string | null
  is_active: boolean
}

export interface InventorySnapshot {
  id: string
  created_at: string
  product_id: string
  quantity: number
  source: 'sync' | 'csv' | 'manual' | 'webhook'
}

export interface Alert {
  id: string
  created_at: string
  brand_id: string
  product_id: string | null
  alert_rule_id: string | null
  severity: AlertSeverity
  channel: AlertChannel
  message: string
  metadata: Record<string, unknown> | null
  sent_at: string | null
}

export interface AlertRule {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  name: string
  threshold_days: number
  severity: AlertSeverity
  channels: AlertChannel[]
  cooldown_hours: number
  is_active: boolean
}

export interface CsvImport {
  id: string
  created_at: string
  brand_id: string
  filename: string
  row_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  user_id: string
}

export interface VelocityResult {
  productId: string
  dailyVelocity: number
  trend: VelocityTrend
  confidence: VelocityConfidence
  dataPoints: number
}

export interface ForecastResult {
  productId: string
  daysRemaining: number | null
  status: StockStatus
  dailyVelocity: number
  currentQuantity: number
}

export interface BrandHealthScore {
  brandId: string
  totalProducts: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  stockoutCount: number
  healthPercentage: number
}

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: Brand
        Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Brand, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      inventory_snapshots: {
        Row: InventorySnapshot
        Insert: Omit<InventorySnapshot, 'id' | 'created_at'>
        Update: Partial<Omit<InventorySnapshot, 'id' | 'created_at'>>
        Relationships: []
      }
      alerts: {
        Row: Alert
        Insert: Omit<Alert, 'id' | 'created_at'>
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>
        Relationships: []
      }
      alert_rules: {
        Row: AlertRule
        Insert: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      csv_imports: {
        Row: CsvImport
        Insert: Omit<CsvImport, 'id' | 'created_at'>
        Update: Partial<Omit<CsvImport, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
