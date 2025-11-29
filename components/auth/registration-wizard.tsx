'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { RegisterFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const STEPS = [
  {
    id: 'account',
    title: 'Create Account',
    description: 'Enter your email and password',
  },
  {
    id: 'profile',
    title: 'Profile Information',
    description: 'Tell us about yourself',
  },
] as const

// Step 1 validation schema (account info only)
const step1Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Step 2 validation schema (profile info only)
const step2Schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  business_name: z.string().optional(),
  phone: z.string().optional(),
})

export function RegistrationWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      business_name: '',
      phone: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Step 1: Create user account
      if (currentStep === 0) {
        // Validate step 1 data
        const step1Data = step1Schema.parse({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        })
        
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: step1Data.email,
          password: step1Data.password,
        })

        if (signUpError) {
          setError(signUpError.message)
          setIsLoading(false)
          return
        }

        // Check if email confirmation is required
        if (signUpData.user && !signUpData.session) {
          // Email confirmation required
          setError('Please check your email to confirm your account before continuing.')
          setIsLoading(false)
          return
        }

        // Move to next step
        setCurrentStep(1)
        setIsLoading(false)
        return
      }

      // Step 2: Complete profile
      if (currentStep === 1) {
        // Validate step 2 data
        const step2Data = step2Schema.parse({
          full_name: data.full_name,
          business_name: data.business_name,
          phone: data.phone,
        })
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('You must be logged in to complete your profile')
          setIsLoading(false)
          return
        }

        // Update profile in database
        // Type assertion needed because TypeScript can't infer the table type from Database
        const { error: profileError } = await (supabase.from('profiles') as any).upsert({
          id: user.id,
          email: user.email!,
          full_name: step2Data.full_name,
          business_name: step2Data.business_name || null,
          phone: step2Data.phone || null,
          })

        if (profileError) {
          setError(profileError.message || 'Failed to create profile')
          setIsLoading(false)
          return
        }

        // Redirect to dashboard
        router.push('/dashboard?onboarding=true')
        router.refresh()
      }
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        const firstError = err.errors[0]
        setError(firstError?.message || 'Please check your input and try again.')
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
      setIsLoading(false)
    }
  }

  const currentStepConfig = STEPS[currentStep]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{currentStepConfig.title}</CardTitle>
        <CardDescription>{currentStepConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 1: Account Information */}
            {currentStep === 0 && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase, and a number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Profile Information */}
            {currentStep === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Storage Business"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          autoComplete="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading
                  ? 'Processing...'
                  : currentStep === STEPS.length - 1
                    ? 'Complete Registration'
                    : 'Continue'}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Form>

        {/* Step indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

