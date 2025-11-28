'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SubscriptionTier } from '@/types'

const SUBSCRIPTION_TIERS: {
  tier: SubscriptionTier
  name: string
  price: string
  features: string[]
}[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0/month',
    features: [
      'Up to 1 facility',
      'Up to 50 units',
      'Basic customer management',
      'Email support',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$99/month',
    features: [
      'Unlimited facilities',
      'Unlimited units',
      'Advanced reporting',
      'Priority support',
      'API access',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom training',
    ],
  },
]

export function SubscriptionSettings() {
  const { profile, subscription, setSubscription } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTier = subscription?.tier || profile?.subscription_tier || 'free'

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!profile) {
      setError('You must be logged in to change your subscription')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Call the subscription management edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'subscription-management',
        {
          body: {
            user_id: profile.id,
            action: tier === 'free' ? 'downgrade' : 'upgrade',
            tier: tier,
          },
        }
      )

      if (functionError) {
        setError(functionError.message || 'Failed to update subscription')
        setIsLoading(false)
        return
      }

      // Update local state
      setSubscription({
        tier,
        status: 'active',
      })

      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const getCurrentTierInfo = () => {
    return SUBSCRIPTION_TIERS.find((t) => t.tier === currentTier) || SUBSCRIPTION_TIERS[0]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Settings</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h3 className="mb-2 text-lg font-semibold">Current Plan</h3>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{getCurrentTierInfo().name}</p>
                <p className="text-sm text-muted-foreground">
                  {getCurrentTierInfo().price}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold">Available Plans</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {SUBSCRIPTION_TIERS.map((plan) => {
              const isCurrentPlan = plan.tier === currentTier
              const isUpgrade = plan.tier !== 'free' && currentTier === 'free'
              const isDowngrade = plan.tier === 'free' && currentTier !== 'free'

              return (
                <div
                  key={plan.tier}
                  className={`rounded-lg border p-4 ${
                    isCurrentPlan ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-2xl font-bold">{plan.price}</p>
                  </div>
                  <ul className="mb-4 space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : isUpgrade
                        ? 'Upgrade'
                        : isDowngrade
                          ? 'Downgrade'
                          : 'Switch Plan'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 font-semibold">Billing Information</h4>
          <p className="text-sm text-muted-foreground">
            To update your payment method or view billing history, please contact support or
            manage your subscription through the Stripe customer portal.
          </p>
          <Button variant="outline" className="mt-4" disabled>
            Manage Billing (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

