'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CsvUploadDialogProps {
  brandId: string
}

export function CsvUploadDialog({ brandId }: CsvUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/brands/${brandId}/csv-import`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Upload failed')

      toast({
        title: 'CSV imported',
        description: `${data.imported} products imported, ${data.errors} errors`,
      })
      setOpen(false)
      setFile(null)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Inventory CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: sku, name, quantity (optional: variant_title, external_id)
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-foreground ml-2">
                Remove
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a CSV file, or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="secondary" size="sm" asChild>
                  <span>Browse files</span>
                </Button>
              </label>
            </div>
          )}
        </div>
        {file && (
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? 'Importing...' : 'Import CSV'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
