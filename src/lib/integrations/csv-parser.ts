import Papa from 'papaparse'
import { csvRowSchema, type CsvRowInput } from '@/lib/validations/csv'

export interface ParsedCsvResult {
  valid: CsvRowInput[]
  errors: { row: number; message: string }[]
  totalRows: number
}

export function parseCsvFile(file: File): Promise<ParsedCsvResult> {
  return new Promise((resolve) => {
    const valid: CsvRowInput[] = []
    const errors: { row: number; message: string }[] = []
    let rowIndex = 0

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      step: (results) => {
        rowIndex++
        const parsed = csvRowSchema.safeParse(results.data)
        if (parsed.success) {
          valid.push(parsed.data)
        } else {
          const messages = parsed.error.issues.map(e => e.message).join(', ')
          errors.push({ row: rowIndex, message: messages })
        }
      },
      complete: () => {
        resolve({ valid, errors, totalRows: rowIndex })
      },
      error: (error: Error) => {
        errors.push({ row: 0, message: error.message })
        resolve({ valid, errors, totalRows: rowIndex })
      },
    })
  })
}

export function parseCsvString(csvContent: string): ParsedCsvResult {
  const valid: CsvRowInput[] = []
  const errors: { row: number; message: string }[] = []

  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  result.data.forEach((row: unknown, index: number) => {
    const parsed = csvRowSchema.safeParse(row)
    if (parsed.success) {
      valid.push(parsed.data)
    } else {
      const messages = parsed.error.issues.map(e => e.message).join(', ')
      errors.push({ row: index + 1, message: messages })
    }
  })

  return { valid, errors, totalRows: result.data.length }
}
