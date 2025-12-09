'use client'

import { BottomNav } from './bottom-nav'
import { OfflineBanner } from '../shared/offline-banner'

interface AppShellProps {
  children: React.ReactNode
  hideNav?: boolean
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <main className={hideNav ? '' : 'pb-nav'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}

