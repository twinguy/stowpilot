'use client'

import { useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { DashboardHeader } from './dashboard-header'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userEmail?: string
  userName?: string
}

export function DashboardLayoutClient({
  children,
  userEmail,
  userName,
}: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <AppSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="lg:pl-64 flex flex-col flex-1">
        <DashboardHeader
          userEmail={userEmail}
          userName={userName}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <main className="flex-1">{children}</main>
      </div>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
