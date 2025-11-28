'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { unitFormSchema, type UnitFormData } from '@/lib/validations/unit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { type Unit, type Facility } from '@/types'

interface UnitFormProps {
  unit?: Unit
  facilities: Facility[]
  onSubmit: (data: UnitFormData) => Promise<void>
}

export function UnitForm({ unit, facilities, onSubmit }: UnitFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: unit
      ? {
          facility_id: unit.facility_id,
          unit_number: unit.unit_number,
          size: unit.size,
          type: unit.type,
          floor_level: unit.floor_level,
          features: unit.features,
          monthly_rate: unit.monthly_rate,
          photos: unit.photos,
          notes: unit.notes || '',
          status: unit.status,
        }
      : {
          facility_id: facilities[0]?.id || '',
          unit_number: '',
          size: {
            width: 0,
            length: 0,
            square_feet: 0,
          },
          type: 'standard',
          floor_level: 1,
          features: [],
          monthly_rate: 0,
          photos: [],
          notes: '',
          status: 'available',
        },
  })

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: 'features',
  })

  // Calculate square feet when width or length changes
  const width = form.watch('size.width')
  const length = form.watch('size.length')

  useEffect(() => {
    if (width > 0 && length > 0) {
      form.setValue('size.square_feet', width * length)
    }
  }, [width, length, form])

  const handleSubmit = async (data: UnitFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(data)
      // Use startTransition to handle navigation smoothly
      startTransition(() => {
        router.push(`/facilities/${data.facility_id}`)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
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

          <FormField
            control={form.control}
            name="unit_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Number</FormLabel>
                <FormControl>
                  <Input placeholder="A101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="climate_controlled">Climate Controlled</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Size</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="size.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (ft)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size.length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (ft)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size.square_feet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Feet</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Calculated automatically</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="floor_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor Level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Rate ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Features</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendFeature('')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </div>

          {featureFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features added yet</p>
          ) : (
            <div className="space-y-2">
              {featureFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`features.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Drive-up access, 24/7 access" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this unit..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about this unit</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || isPending}>
            {isLoading || isPending ? 'Saving...' : unit ? 'Update Unit' : 'Create Unit'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
