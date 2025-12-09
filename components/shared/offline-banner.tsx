'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Show "back online" briefly then hide
      setTimeout(() => setShowBanner(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white transition-colors pt-safe',
        isOnline ? 'bg-green-500' : 'bg-amber-500'
      )}
    >
      {isOnline ? (
        <>Back online</>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You&apos;re offline
        </>
      )}
    </div>
  )
}

