import { z } from 'zod'

export const csvRowSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be non-negative'),
  variant_title: z.string().optional(),
  external_id: z.string().optional(),
})

export type CsvRowInput = z.infer<typeof csvRowSchema>
