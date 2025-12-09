'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header, NotificationBell } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getGreeting, formatTime } from '@/lib/utils'
import { Calendar, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  prospect_name?: string
  is_prepared: boolean
}

export default function HomePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  
  const { data: meetings, isLoading: meetingsLoading } = useApi<Meeting[]>(
    '/api/v1/calendar-meetings?filter=today'
  )

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    redirect('/login')
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  
  // Calculate stats from meetings data
  const meetingsToday = meetings?.length || 0
  const meetingsPrepared = meetings?.filter(m => m.is_prepared).length || 0

  return (
    <AppShell>
      <Header
        rightContent={<NotificationBell count={0} />}
      />

      <div className="px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={Calendar}
            label="Meetings Today"
            value={meetingsToday}
            loading={meetingsLoading}
          />
          <StatsCard
            icon={CheckCircle}
            label="Prepared"
            value={meetingsPrepared}
            loading={meetingsLoading}
            variant="success"
          />
        </div>

        {/* Today's Meetings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today&apos;s Meetings
            </h2>
            <Link href="/meetings" className="text-sm text-primary">
              View all
            </Link>
          </div>

          {meetingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : meetings && meetings.length > 0 ? (
            <div className="space-y-3">
              {meetings.slice(0, 5).map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No meetings today</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enjoy your free day! 🎉
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Actions Hint */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Quick Tip</p>
                <p className="text-sm text-muted-foreground">
                  Tap the + button to record, research, or prepare
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function StatsCard({
  icon: Icon,
  label,
  value,
  loading,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  value: number | string
  loading?: boolean
  variant?: 'default' | 'success' | 'warning'
}) {
  const variantClasses = {
    default: 'text-primary',
    success: 'text-green-500',
    warning: 'text-amber-500',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${variantClasses[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className={`text-2xl font-bold ${variantClasses[variant]}`}>
                {value}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="card-touch cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatTime(meeting.start_time)}</span>
                {meeting.is_prepared ? (
                  <Badge variant="success">✅ Prepared</Badge>
                ) : (
                  <Badge variant="warning">⚠️ Not prepared</Badge>
                )}
              </div>
              <p className="font-semibold">{meeting.title}</p>
              {meeting.prospect_name && (
                <p className="text-sm text-muted-foreground">
                  🏢 {meeting.prospect_name}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
