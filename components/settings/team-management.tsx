'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { teamInvitationSchema, type TeamInvitationFormData } from '@/lib/validations/team'
import { useUserStore } from '@/lib/stores/user-store'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TeamMember } from '@/types'

export function TeamManagement() {
  const { user } = useUserStore()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TeamInvitationFormData>({
    resolver: zodResolver(teamInvitationSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'staff',
    },
  })

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error loading team members:', fetchError)
        return
      }

      setTeamMembers(data || [])
    } catch (err) {
      console.error('Error loading team members:', err)
    }
  }

  const onSubmit = async (data: TeamInvitationFormData) => {
    if (!user) {
      setError('You must be logged in to invite team members')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Call the team invitation edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'team-invitation',
        {
          body: {
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            permissions: data.permissions || {},
          },
        }
      )

      if (functionError) {
        setError(functionError.message || 'Failed to send invitation')
        setIsLoading(false)
        return
      }

      // Reload team members
      await loadTeamMembers()

      // Reset form and close dialog
      form.reset()
      setIsInviteDialogOpen(false)
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      await loadTeamMembers()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Invite and manage team members for your storage facilities
            </CardDescription>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>Invite Team Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to a team member to join your account
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="team-member@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Staff members have limited access, while managers can manage facilities
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No team members yet. Invite someone to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <span className="capitalize">{member.role}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString()
                      : 'Pending'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

