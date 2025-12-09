'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn, formatTime, formatDate, isToday, isTomorrow } from '@/lib/utils'
import { Calendar, MapPin, Video, Users, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  start_time: string
  end_time: string
  location?: string
  video_link?: string
  prospect_name?: string
  attendees_count?: number
  is_prepared: boolean
  preparation_id?: string
}

type FilterOption = 'today' | 'tomorrow' | 'week'

export default function MeetingsPage() {
  const [filter, setFilter] = useState<FilterOption>('today')
  
  const { data: meetings, isLoading, mutate } = useApi<Meeting[]>(
    `/api/v1/calendar-meetings?filter=${filter}`
  )

  // Group meetings by date
  const groupedMeetings = groupMeetingsByDate(meetings || [])

  return (
    <AppShell>
      <Header
        title="Meetings"
        rightContent={
          <button
            onClick={() => mutate()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['today', 'tomorrow', 'week'] as const).map((option) => (
            <Button
              key={option}
              variant={filter === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(option)}
              className="capitalize"
            >
              {option === 'week' ? 'This Week' : option}
            </Button>
          ))}
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : groupedMeetings.length > 0 ? (
          <div className="space-y-6">
            {groupedMeetings.map((group, index) => (
              <div key={group.label || index}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.meetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No meetings scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'today'
                  ? "You're free today!"
                  : filter === 'tomorrow'
                  ? "Nothing scheduled for tomorrow"
                  : "No meetings this week"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const isNow = checkIfMeetingIsNow(meeting.start_time, meeting.end_time)

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card interactive className={cn(isNow && 'border-primary border-2')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              {/* Time */}
              <div className="flex items-center gap-2">
                {isNow && (
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span className={cn('font-medium', isNow && 'text-primary')}>
                  {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                </span>
              </div>

              {/* Title */}
              <p className="font-semibold text-lg leading-tight">{meeting.title}</p>

              {/* Prospect */}
              {meeting.prospect_name && (
                <p className="text-sm text-muted-foreground">
                  🏢 {meeting.prospect_name}
                </p>
              )}

              {/* Location / Video */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {meeting.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {meeting.location}
                  </span>
                )}
                {meeting.video_link && (
                  <span className="flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    Video call
                  </span>
                )}
                {meeting.attendees_count && meeting.attendees_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {meeting.attendees_count}
                  </span>
                )}
              </div>

              {/* Prep Status */}
              <div className="pt-2">
                {meeting.is_prepared ? (
                  <Badge variant="success">✅ Prepared</Badge>
                ) : (
                  <Badge variant="warning">⚠️ Not prepared</Badge>
                )}
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function groupMeetingsByDate(meetings: Meeting[]) {
  const groups: Record<string, { label: string; meetings: Meeting[] }> = {}

  meetings.forEach((meeting) => {
    const date = new Date(meeting.start_time).toDateString()
    
    if (!groups[date]) {
      let label = formatDate(meeting.start_time, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
      
      if (isToday(meeting.start_time)) {
        label = `Today - ${label}`
      } else if (isTomorrow(meeting.start_time)) {
        label = `Tomorrow - ${label}`
      }
      
      groups[date] = { label, meetings: [] }
    }
    
    groups[date].meetings.push(meeting)
  })

  return Object.values(groups).sort((a, b) => {
    const dateA = new Date(a.meetings[0].start_time)
    const dateB = new Date(b.meetings[0].start_time)
    return dateA.getTime() - dateB.getTime()
  })
}

function checkIfMeetingIsNow(start: string, end: string): boolean {
  const now = new Date()
  const startTime = new Date(start)
  const endTime = new Date(end)
  return now >= startTime && now <= endTime
}

