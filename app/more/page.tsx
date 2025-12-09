'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useAuth } from '@/lib/hooks/use-auth'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Settings, 
  HelpCircle, 
  ExternalLink, 
  LogOut,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MorePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  // Get user info from auth - no separate API call needed
  const userEmail = user?.email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const menuItems = [
    {
      icon: User,
      label: 'Profile Settings',
      href: 'https://dealmotion.ai/dashboard/settings',
      external: true,
    },
    {
      icon: Settings,
      label: 'All Settings',
      href: 'https://dealmotion.ai/dashboard/settings',
      external: true,
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: 'https://dealmotion.ai/help',
      external: true,
    },
  ]

  return (
    <AppShell>
      <Header title="More" />

      <div className="px-4 py-4 space-y-4">
        {/* User Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {userName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {userName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-4 px-4 py-3.5 hover:bg-muted transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b' : ''
                }`}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.external ? (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          DealMotion PWA v1.0.0
        </p>
      </div>
    </AppShell>
  )
}

