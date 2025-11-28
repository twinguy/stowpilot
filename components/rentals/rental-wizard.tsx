'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2, User, Package, Calendar, DollarSign, FileText } from 'lucide-react'
import { rentalFormSchema, type RentalFormData } from '@/lib/validations/rental'
import { type Customer, type Unit } from '@/types'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RentalWizardProps {
  customers: Customer[]
  units: Unit[]
  onSubmit: (data: RentalFormData) => Promise<void>
  defaultValues?: RentalFormData
  isEditMode?: boolean
}

const steps = [
  { id: 1, name: 'Customer & Unit', icon: User },
  { id: 2, name: 'Rental Terms', icon: Calendar },
  { id: 3, name: 'Insurance & Terms', icon: FileText },
  { id: 4, name: 'Review', icon: CheckCircle2 },
]

export function RentalWizard({
  customers,
  units,
  onSubmit,
  defaultValues,
  isEditMode = false,
}: RentalWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: defaultValues || {
      customer_id: '',
      unit_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      monthly_rate: 0,
      security_deposit: 0,
      late_fee_rate: 0,
      auto_renew: true,
      insurance_required: false,
      insurance_provider: null,
      insurance_policy_number: null,
      special_terms: null,
      status: 'draft',
    },
  })

  const selectedCustomer = form.watch('customer_id')
  const selectedUnit = form.watch('unit_id')
  const insuranceRequired = form.watch('insurance_required')

  // Auto-populate monthly rate from selected unit (only in create mode)
  useEffect(() => {
    if (selectedUnit && !isEditMode) {
      const unit = units.find((u) => u.id === selectedUnit)
      if (unit && form.getValues('monthly_rate') === 0) {
        form.setValue('monthly_rate', unit.monthly_rate)
      }
    }
  }, [selectedUnit, units, form, isEditMode])

  const customer = customers.find((c) => c.id === selectedCustomer)
  const selectedUnitData = units.find((u) => u.id === selectedUnit)

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof RentalFormData)[] = []

    switch (step) {
      case 1:
        fieldsToValidate = ['customer_id', 'unit_id']
        break
      case 2:
        fieldsToValidate = ['start_date', 'monthly_rate', 'security_deposit', 'late_fee_rate']
        break
      case 3:
        fieldsToValidate = ['insurance_required']
        if (insuranceRequired) {
          fieldsToValidate.push('insurance_provider', 'insurance_policy_number')
        }
        break
      default:
        return true
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
      setError(null)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async (data: RentalFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(data)
      // Navigation is handled by the parent component (RentalEditForm or NewRentalPage)
      if (!isEditMode) {
        router.push('/rentals')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                          {customer.email && ` (${customer.email})`}
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
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units
                        .filter((u) => {
                          if (isEditMode && defaultValues?.unit_id === u.id) {
                            return true // Always show the current unit in edit mode
                          }
                          return u.status === 'available' || u.status === 'reserved'
                        })
                        .map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unit_number} - ${unit.monthly_rate}/month
                            {unit.status === 'reserved' && ' (Reserved)'}
                            {unit.status === 'occupied' && isEditMode && defaultValues?.unit_id === unit.id && ' (Current)'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEditMode
                      ? 'You can change the unit or keep the current one'
                      : 'Only available and reserved units are shown'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCustomer && customer && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong> {customer.first_name} {customer.last_name}
                    </p>
                    {customer.email && (
                      <p>
                        <strong>Email:</strong> {customer.email}
                      </p>
                    )}
                    {customer.phone && (
                      <p>
                        <strong>Phone:</strong> {customer.phone}
                      </p>
                    )}
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedUnit && selectedUnitData && (
              <Card>
                <CardHeader>
                  <CardTitle>Unit Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>Unit Number:</strong> {selectedUnitData.unit_number}
                    </p>
                    <p>
                      <strong>Size:</strong> {selectedUnitData.size.square_feet} sq ft
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedUnitData.type}
                    </p>
                    <p>
                      <strong>Monthly Rate:</strong> ${selectedUnitData.monthly_rate}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || null)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Leave blank for month-to-month</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="monthly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
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
                name="security_deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
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
                name="late_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late Fee Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Percentage or flat rate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auto_renew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-Renew</FormLabel>
                    <FormDescription>
                      Automatically renew the rental agreement each month
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="insurance_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Insurance Required</FormLabel>
                    <FormDescription>
                      Require customer to provide proof of insurance
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {insuranceRequired && (
              <>
                <FormField
                  control={form.control}
                  name="insurance_provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Insurance company name"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurance_policy_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Policy number"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="special_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special terms or conditions for this rental..."
                      {...field}
                      value={field.value || ''}
                      rows={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional terms and conditions specific to this rental agreement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Agreement Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer</h4>
                  <p>
                    {customer?.first_name} {customer?.last_name}
                  </p>
                  {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Unit</h4>
                  <p>{selectedUnitData?.unit_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUnitData?.size.square_feet} sq ft - {selectedUnitData?.type}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rental Terms</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Start Date:</strong> {form.getValues('start_date')}
                    </p>
                    <p>
                      <strong>End Date:</strong>{' '}
                      {form.getValues('end_date') || 'Month-to-month'}
                    </p>
                    <p>
                      <strong>Monthly Rate:</strong> ${form.getValues('monthly_rate')}
                    </p>
                    <p>
                      <strong>Security Deposit:</strong> ${form.getValues('security_deposit')}
                    </p>
                    <p>
                      <strong>Late Fee Rate:</strong> ${form.getValues('late_fee_rate')}
                    </p>
                    <p>
                      <strong>Auto-Renew:</strong> {form.getValues('auto_renew') ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {insuranceRequired && (
                  <div>
                    <h4 className="font-semibold mb-2">Insurance</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Provider:</strong> {form.getValues('insurance_provider')}
                      </p>
                      <p>
                        <strong>Policy Number:</strong> {form.getValues('insurance_policy_number')}
                      </p>
                    </div>
                  </div>
                )}

                {form.getValues('special_terms') && (
                  <div>
                    <h4 className="font-semibold mb-2">Special Terms</h4>
                    <p className="text-sm whitespace-pre-wrap">{form.getValues('special_terms')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          // Only allow submission from the submit button on the review step
          if (currentStep === steps.length) {
            form.handleSubmit(handleSubmit)(e)
          }
        }}
        className="space-y-6"
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={(e) => handleNext(e)} disabled={isLoading}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                form.handleSubmit(handleSubmit)(e)
              }}
              disabled={isLoading}
            >
              {isLoading
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Rental Agreement'
                  : 'Create Rental Agreement'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
