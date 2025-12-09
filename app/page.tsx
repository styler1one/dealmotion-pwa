'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header, NotificationBell } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getGreeting, formatTime, isToday, getRelativeTime } from '@/lib/utils'
import { Calendar, FileText, Mic, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface DashboardStats {
  meetings_today: number
  meetings_prepared: number
  pending_analysis: number
  recent_activities: Array<{
    type: string
    title: string
    created_at: string
  }>
}

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
  
  const { data: stats, isLoading: statsLoading } = useApi<DashboardStats>(
    '/api/v1/dashboard/stats'
  )
  
  const { data: meetings, isLoading: meetingsLoading } = useApi<Meeting[]>(
    '/api/v1/calendar-meetings?filter=today'
  )

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    redirect('/login')
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <AppShell>
      <Header
        rightContent={<NotificationBell count={stats?.pending_analysis || 0} />}
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
        <div className="grid grid-cols-3 gap-3">
          <StatsCard
            icon={Calendar}
            label="Meetings"
            value={stats?.meetings_today ?? '-'}
            loading={statsLoading}
          />
          <StatsCard
            icon={CheckCircle}
            label="Prepared"
            value={stats?.meetings_prepared ?? '-'}
            loading={statsLoading}
            variant="success"
          />
          <StatsCard
            icon={Mic}
            label="Pending"
            value={stats?.pending_analysis ?? '-'}
            loading={statsLoading}
            variant="warning"
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
              {meetings.slice(0, 3).map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No meetings today</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </h2>

          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_activities.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent activity
            </p>
          )}
        </section>
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
      <CardContent className="p-3 text-center">
        {loading ? (
          <Skeleton className="h-8 w-8 mx-auto mb-1" />
        ) : (
          <p className={`text-2xl font-bold ${variantClasses[variant]}`}>
            {value}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </div>
      </CardContent>
    </Card>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card interactive>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatTime(meeting.start_time)}</span>
                {meeting.is_prepared ? (
                  <Badge variant="success">Prepared</Badge>
                ) : (
                  <Badge variant="warning">Not prepared</Badge>
                )}
              </div>
              <p className="font-semibold">{meeting.title}</p>
              {meeting.prospect_name && (
                <p className="text-sm text-muted-foreground">
                  {meeting.prospect_name}
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

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    research: { icon: FileText, color: 'text-blue-500' },
    preparation: { icon: FileText, color: 'text-green-500' },
    recording: { icon: Mic, color: 'text-red-500' },
    meeting: { icon: Calendar, color: 'text-purple-500' },
  }

  const { icon: Icon, color } = icons[type] || icons.meeting

  return (
    <div className={`p-2 rounded-full bg-muted ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  )
}

