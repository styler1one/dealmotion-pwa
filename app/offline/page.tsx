import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        It looks like you&apos;ve lost your internet connection. 
        Some features may be limited until you&apos;re back online.
      </p>

      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>

      <p className="text-xs text-muted-foreground mt-8">
        Cached content is still available
      </p>
    </div>
  )
}

