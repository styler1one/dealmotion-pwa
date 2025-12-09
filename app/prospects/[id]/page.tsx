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
import { 
  Building2, 
  Globe,
  Users,
  MapPin,
  Calendar,
  FileText,
  Mic,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Prospect {
  id: string
  company_name: string
  domain?: string
  industry?: string
  company_size?: string
  location?: string
  description?: string
  created_at: string
}

interface ProspectHub {
  prospect: Prospect
  research?: {
    id: string
    created_at: string
    status: string
  }
  preparations?: Array<{
    id: string
    created_at: string
    meeting_title?: string
  }>
  followups?: Array<{
    id: string
    created_at: string
    meeting_title?: string
  }>
  upcoming_meetings?: Array<{
    id: string
    title: string
    start_time: string
  }>
}

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prospectId = params.id as string
  
  const { data: hub, isLoading, error } = useApi<ProspectHub>(
    `/api/v1/prospects/${prospectId}/hub`
  )

  if (isLoading) {
    return (
      <AppShell hideNav>
        <Header showBack title="Prospect" />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppShell>
    )
  }

  if (error || !hub) {
    return (
      <AppShell hideNav>
        <Header showBack title="Prospect" />
        <div className="px-4 py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Prospect not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This prospect may have been deleted
          </p>
          <Button className="mt-4" onClick={() => router.push('/prospects')}>
            Back to Prospects
          </Button>
        </div>
      </AppShell>
    )
  }

  const { prospect, research, preparations, followups, upcoming_meetings } = hub

  return (
    <AppShell hideNav>
      <Header showBack title="Prospect" />

      <div className="px-4 py-6 space-y-4">
        {/* Company Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{prospect.company_name}</h1>
                {prospect.industry && (
                  <p className="text-muted-foreground">{prospect.industry}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {prospect.domain && (
                    <a 
                      href={`https://${prospect.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary"
                    >
                      <Globe className="h-3 w-3" />
                      {prospect.domain}
                    </a>
                  )}
                  {prospect.company_size && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {prospect.company_size}
                    </span>
                  )}
                  {prospect.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {prospect.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/research/new?prospectId=${prospect.id}`}>
            <Button variant="outline" className="w-full h-auto py-3">
              <div className="flex flex-col items-center gap-1">
                <Search className="h-5 w-5" />
                <span className="text-xs">Research</span>
              </div>
            </Button>
          </Link>
          <Link href={`/prep/new?prospectId=${prospect.id}`}>
            <Button variant="outline" className="w-full h-auto py-3">
              <div className="flex flex-col items-center gap-1">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Prepare</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Research */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <span className="font-medium">Research</span>
              </div>
              {research ? (
                <Badge variant="success">Complete</Badge>
              ) : (
                <Badge variant="outline">Not started</Badge>
              )}
            </div>
            {research ? (
              <Link href={`/research/${research.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Research
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href={`/research/new?prospectId=${prospect.id}`}>
                <Button size="sm" className="w-full">
                  Start Research
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        {upcoming_meetings && upcoming_meetings.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Upcoming Meetings</span>
              </div>
              <div className="space-y-2">
                {upcoming_meetings.slice(0, 3).map(meeting => (
                  <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(meeting.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preparations */}
        {preparations && preparations.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">Preparations ({preparations.length})</span>
              </div>
              <div className="space-y-2">
                {preparations.slice(0, 3).map(prep => (
                  <Link key={prep.id} href={`/prep/${prep.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          {prep.meeting_title || 'Preparation'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(prep.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Followups */}
        {followups && followups.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="h-5 w-5 text-primary" />
                <span className="font-medium">Follow-ups ({followups.length})</span>
              </div>
              <div className="space-y-2">
                {followups.slice(0, 3).map(followup => (
                  <Link key={followup.id} href={`/followup/${followup.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          {followup.meeting_title || 'Follow-up'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(followup.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open in Web */}
        <a 
          href={`https://dealmotion.ai/dashboard/prospects/${prospect.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Web App
          </Button>
        </a>
      </div>
    </AppShell>
  )
}

