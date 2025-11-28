'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Receipt,
  DollarSign,
  BookOpen,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  subItems?: Array<{
    name: string
    href: string
    icon: LucideIcon
  }>
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Facilities', href: '/facilities', icon: Building2 },
  { name: 'Units', href: '/units', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Rentals', href: '/rentals', icon: FileText },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    subItems: [
      { name: 'Invoices', href: '/billing', icon: Receipt },
      { name: 'Payments', href: '/billing/payments', icon: DollarSign },
      { name: 'Ledger', href: '/billing/ledger', icon: BookOpen },
      { name: 'Reports', href: '/billing/reports', icon: FileBarChart },
    ],
  },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface AppSidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export function AppSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: AppSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand billing if we're on a billing page
    if (pathname?.startsWith('/billing')) {
      return ['Billing']
    }
    return []
  })

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  const isBillingActive = pathname?.startsWith('/billing')

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 border-r bg-background transition-transform lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <span className="text-xl font-semibold">StowPilot</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/'))
              const Icon = item.icon
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expandedItems.includes(item.name)

              if (hasSubItems) {
                return (
                  <div key={item.name}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isBillingActive && item.name === 'Billing'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(item.name)
                        }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          isBillingActive && item.name === 'Billing'
                            ? 'text-primary-foreground hover:bg-primary/80'
                            : 'text-muted-foreground hover:bg-accent'
                        )}
                        aria-label={`Toggle ${item.name} submenu`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                        {item.subItems!.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                isSubActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <SubIcon className="h-4 w-4" />
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

      </aside>
    </>
  )
}
