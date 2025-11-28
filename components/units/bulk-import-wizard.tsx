'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { bulkUnitImportSchema, type BulkUnitImportData } from '@/lib/validations/unit'
import { type Facility } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BulkImportWizardProps {
  facilities: Facility[]
  onSubmit: (data: BulkUnitImportData) => Promise<void>
}

interface ParsedUnit {
  unit_number: string
  width: number
  length: number
  type: string
  floor_level: number
  monthly_rate: number
  status: string
  features: string[]
  row: number
  size?: {
    width: number
    length: number
    square_feet: number
  }
  errors?: string[]
}

export function BulkImportWizard({ facilities, onSubmit }: BulkImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload')
  const [parsedUnits, setParsedUnits] = useState<ParsedUnit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BulkUnitImportData>({
    resolver: zodResolver(bulkUnitImportSchema),
    defaultValues: {
      facility_id: facilities[0]?.id || '',
      units: [],
    },
  })

  const parseCSV = (csvText: string): ParsedUnit[] => {
    const lines = csvText.split('\n').filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const requiredHeaders = ['unit_number', 'width', 'length', 'monthly_rate']
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    const units: ParsedUnit[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const unit: ParsedUnit = {
        unit_number: '',
        width: 0,
        length: 0,
        type: 'standard',
        floor_level: 1,
        monthly_rate: 0,
        status: 'available',
        features: [],
        row: i + 1,
        errors: [],
      }

      headers.forEach((header, index) => {
        const value = values[index] || ''
        switch (header) {
          case 'unit_number':
            unit.unit_number = value
            break
          case 'width':
            unit.width = parseFloat(value) || 0
            break
          case 'length':
            unit.length = parseFloat(value) || 0
            break
          case 'type':
            unit.type = value || 'standard'
            break
          case 'floor_level':
            unit.floor_level = parseInt(value) || 1
            break
          case 'monthly_rate':
            unit.monthly_rate = parseFloat(value) || 0
            break
          case 'status':
            unit.status = value || 'available'
            break
          case 'features':
            unit.features = value ? value.split(';').map((f) => f.trim()) : []
            break
        }
      })

      // Validate unit
      if (!unit.unit_number) {
        unit.errors?.push('Unit number is required')
      }
      if (unit.width <= 0) {
        unit.errors?.push('Width must be greater than 0')
      }
      if (unit.length <= 0) {
        unit.errors?.push('Length must be greater than 0')
      }
      if (unit.monthly_rate <= 0) {
        unit.errors?.push('Monthly rate must be greater than 0')
      }

      unit.size = {
        width: unit.width,
        length: unit.length,
        square_feet: unit.width * unit.length,
      }

      units.push(unit)
    }

    return units
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const parsed = parseCSV(csvText)
        setParsedUnits(parsed)
        setError(null)
        setStep('review')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const validUnits = parsedUnits
        .filter((u) => !u.errors || u.errors.length === 0)
        .map((u) => ({
          facility_id: form.getValues('facility_id'),
          unit_number: u.unit_number,
          size: {
            width: u.width,
            length: u.length,
            square_feet: u.width * u.length,
          },
          type: (u.type || 'standard') as 'standard' | 'climate_controlled' | 'outdoor' | 'vehicle',
          floor_level: u.floor_level || 1,
          features: u.features || [],
          monthly_rate: u.monthly_rate,
          status: (u.status || 'available') as
            | 'available'
            | 'occupied'
            | 'reserved'
            | 'maintenance'
            | 'out_of_service',
          photos: [],
          notes: '',
        }))

      await onSubmit({
        facility_id: form.getValues('facility_id'),
        units: validUnits,
      })

      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import units')
    } finally {
      setIsLoading(false)
    }
  }

  const validUnits = parsedUnits.filter((u) => !u.errors || u.errors.length === 0)
  const invalidUnits = parsedUnits.filter((u) => u.errors && u.errors.length > 0)

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Units</CardTitle>
            <CardDescription>
              Upload a CSV file to import multiple units at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Form {...form}>
              <FormField
                control={form.control}
                name="facility_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>CSV File</FormLabel>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="csv-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <FormDescription>
                  CSV should include columns: unit_number, width, length, monthly_rate, type
                  (optional), floor_level (optional), status (optional), features (optional,
                  semicolon-separated)
                </FormDescription>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Import</CardTitle>
            <CardDescription>
              Review the parsed units before importing. {validUnits.length} valid,{' '}
              {invalidUnits.length} invalid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invalidUnits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-destructive">Invalid Units</h4>
                <div className="space-y-2">
                  {invalidUnits.map((unit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2"
                    >
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">Row {unit.row}: {unit.unit_number || 'N/A'}</div>
                        <ul className="mt-1 list-disc list-inside text-xs text-destructive">
                          {unit.errors?.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validUnits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Valid Units ({validUnits.length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {validUnits.map((unit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">{unit.unit_number}</span>
                        <span className="text-muted-foreground ml-2">
                          {unit.width}×{unit.length}ft ({unit.width * unit.length} sq ft)
                        </span>
                      </div>
                      <Badge variant="outline">${unit.monthly_rate}/mo</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSubmit} disabled={isLoading || validUnits.length === 0}>
                {isLoading ? 'Importing...' : `Import ${validUnits.length} Units`}
              </Button>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Successfully imported {validUnits.length} units
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>View Units</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
