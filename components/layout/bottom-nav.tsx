'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Calendar, Users, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { QuickActions } from './quick-actions'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/meetings', icon: Calendar, label: 'Meetings' },
  { href: '#', icon: Plus, label: 'New', isAction: true },
  { href: '/prospects', icon: Users, label: 'Prospects' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.href === pathname
            const Icon = item.icon

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => setQuickActionsOpen(true)}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <QuickActions open={quickActionsOpen} onOpenChange={setQuickActionsOpen} />
    </>
  )
}

