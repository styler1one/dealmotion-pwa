'use client'

import { Bell, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  showBack?: boolean
  rightContent?: React.ReactNode
  transparent?: boolean
}

export function Header({ 
  title, 
  showBack = false, 
  rightContent,
  transparent = false 
}: HeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-4 pt-safe',
        transparent
          ? 'bg-transparent'
          : 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'
      )}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : !showBack ? (
          /* Show logo on home page */
          <>
            <img src="/logo.svg" alt="DealMotion" className="h-7 dark:hidden" />
            <img src="/logo-dark.svg" alt="DealMotion" className="h-7 hidden dark:block" />
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {rightContent}
      </div>
    </header>
  )
}

export function NotificationBell({ count = 0 }: { count?: number }) {
  return (
    <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

