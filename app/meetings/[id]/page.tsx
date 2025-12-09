'use client'

export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTime } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  Building2,
  FileText,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  meeting_url?: string
  is_online: boolean
  prospect_id?: string
  prospect_name?: string
  attendees?: Array<{ email: string; name?: string; response_status?: string }>
  is_prepared: boolean
  preparation_id?: string
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  
  // API returns meeting object directly (not wrapped)
  const { data: meeting, isLoading, error } = useApi<Meeting>(
    `/api/v1/calendar-meetings/${meetingId}`
  )

  if (isLoading) {
    return (
      <AppShell>
        <Header showBack title="Meeting" />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    )
  }

  if (error || !meeting) {
    return (
      <AppShell>
        <Header showBack title="Meeting" />
        <div className="px-4 py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Meeting not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This meeting may have been deleted
          </p>
          <Button className="mt-4" onClick={() => router.push('/meetings')}>
            Back to Meetings
          </Button>
        </div>
      </AppShell>
    )
  }

  const startDate = new Date(meeting.start_time)

  return (
    <AppShell>
      <Header showBack title="Meeting" />

      <div className="px-4 py-6 space-y-4">
        {/* Title & Status */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold">{meeting.title}</h1>
            {meeting.is_prepared ? (
              <Badge variant="success" className="shrink-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Prepared
              </Badge>
            ) : (
              <Badge variant="warning" className="shrink-0">
                Not prepared
              </Badge>
            )}
          </div>
          {meeting.description && (
            <p className="text-muted-foreground mt-2 text-sm">
              {meeting.description}
            </p>
          )}
        </div>

        {/* Date & Time */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {startDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <p>
                {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
              </p>
            </div>

            {meeting.meeting_url && (
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <a 
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Join video call
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {meeting.location && !meeting.is_online && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <p>{meeting.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prospect */}
        {meeting.prospect_name && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{meeting.prospect_name}</p>
                  <p className="text-sm text-muted-foreground">Company</p>
                </div>
                {meeting.prospect_id && (
                  <Link href={`/prospects/${meeting.prospect_id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <p className="font-medium">Attendees ({meeting.attendees.length})</p>
              </div>
              <div className="space-y-2">
                {meeting.attendees.map((attendee, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {(attendee.name || attendee.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p>{attendee.name || attendee.email}</p>
                      {attendee.name && (
                        <p className="text-xs text-muted-foreground">{attendee.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {!meeting.is_prepared && meeting.prospect_id && (
            <Link href={`/prep/new?prospectId=${meeting.prospect_id}&meetingId=${meeting.id}`} className="block">
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Prepare for this meeting
              </Button>
            </Link>
          )}
          
          {meeting.preparation_id && (
            <Link href={`/prep/${meeting.preparation_id}`} className="block">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Preparation
              </Button>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  )
}

