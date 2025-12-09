'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Settings, 
  Bell, 
  Globe, 
  HelpCircle, 
  ExternalLink, 
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserProfile {
  full_name?: string
  email?: string
  subscription_tier?: string
}

interface UsageStats {
  research_used: number
  research_limit: number
  flows_used: number
  flows_limit: number
}

export default function MorePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { data: profile } = useApi<UserProfile>('/api/v1/profile')
  const { data: usage } = useApi<UsageStats>('/api/v1/subscription/usage')

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      href: '/settings/profile',
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/settings/notifications',
    },
    {
      icon: Globe,
      label: 'Language',
      href: '/settings/language',
    },
    {
      icon: Settings,
      label: 'Full Settings',
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
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  {profile?.subscription_tier || 'Free'} Plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        {usage && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-primary" />
                Usage This Month
              </div>
              
              <UsageBar
                label="Research"
                used={usage.research_used}
                limit={usage.research_limit}
              />
              
              <UsageBar
                label="Flows"
                used={usage.flows_used}
                limit={usage.flows_limit}
              />
            </CardContent>
          </Card>
        )}

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

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const percentage = Math.min((used / limit) * 100, 100)
  const isNearLimit = percentage >= 80

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isNearLimit ? 'text-amber-500 font-medium' : ''}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

