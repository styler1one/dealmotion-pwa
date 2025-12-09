'use client'

import { useState, useEffect } from 'react'
import { X, Share, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Detect iOS Safari (not standalone)
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      return /iphone|ipad|ipod/.test(userAgent)
    }

    const isInStandaloneMode = () => {
      return (
        ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone) ||
        window.matchMedia('(display-mode: standalone)').matches
      )
    }

    const isSafari = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      return /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
    }

    // Show prompt if iOS Safari and not already installed
    if (isIos() && !isInStandaloneMode()) {
      // Delay showing to not interrupt initial load
      const timer = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    // Don't save to localStorage - will show again next visit
  }

  if (!showPrompt || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src="/logo.svg" 
                alt="DealMotion" 
                className="w-10 h-10"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">Install DealMotion</h2>
              <p className="text-white/80 text-sm">Add to your home screen</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Install this app on your iPhone for the best experience with quick access from your home screen.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                1
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm">Tap the</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <Share className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Share</span>
                </div>
                <span className="text-sm">button below</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                2
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm">Scroll down and tap</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <PlusSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Add to Home Screen</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                3
              </div>
              <div className="pt-1">
                <span className="text-sm">Tap <strong>Add</strong> in the top right corner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRemindLater}
          >
            Maybe Later
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground text-sm"
            onClick={handleDismiss}
          >
            Don&apos;t show again
          </Button>
        </div>

        {/* Safari share button indicator */}
        <div className="flex justify-center pb-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Look for</span>
            <Share className="h-4 w-4" />
            <span>in Safari&apos;s toolbar</span>
          </div>
        </div>
      </div>
    </div>
  )
}

