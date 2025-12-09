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
import { cn, getRelativeTime } from '@/lib/utils'
import { Building2, Search, ChevronRight, Calendar, FileText, Mic } from 'lucide-react'
import Link from 'next/link'

interface Prospect {
  id: string
  name: string
  domain?: string
  industry?: string
  has_research: boolean
  has_preparation: boolean
  has_followup: boolean
  next_meeting?: string
  last_activity?: string
}

export default function ProspectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: prospects, isLoading } = useApi<Prospect[]>(
    `/api/v1/prospects?search=${encodeURIComponent(searchQuery)}`
  )

  // Separate prospects with upcoming meetings
  const withMeetings = prospects?.filter(p => p.next_meeting) || []
  const withoutMeetings = prospects?.filter(p => !p.next_meeting) || []

  return (
    <AppShell>
      <Header title="Prospects" />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Prospects List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : prospects && prospects.length > 0 ? (
          <div className="space-y-6">
            {/* With Upcoming Meetings */}
            {withMeetings.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  WITH UPCOMING MEETINGS
                </h2>
                <div className="space-y-3">
                  {withMeetings.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} />
                  ))}
                </div>
              </section>
            )}

            {/* All / Recent */}
            {withoutMeetings.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  {withMeetings.length > 0 ? 'OTHER PROSPECTS' : 'ALL PROSPECTS'} ({withoutMeetings.length})
                </h2>
                <div className="space-y-3">
                  {withoutMeetings.map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No prospects found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Start by researching a company"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  return (
    <Link href={`/prospects/${prospect.id}`}>
      <Card interactive>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{prospect.name}</p>
              
              {/* Status indicators */}
              <div className="flex items-center gap-2 mt-1">
                <StatusIndicator 
                  active={prospect.has_research} 
                  icon={FileText}
                  label="R" 
                />
                <StatusIndicator 
                  active={prospect.has_preparation} 
                  icon={FileText}
                  label="P" 
                />
                <StatusIndicator 
                  active={prospect.has_followup} 
                  icon={Mic}
                  label="F" 
                />
              </div>

              {/* Meta info */}
              <p className="text-xs text-muted-foreground mt-1">
                {prospect.next_meeting ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Next: {new Date(prospect.next_meeting).toLocaleDateString()}
                  </span>
                ) : prospect.last_activity ? (
                  `Last activity: ${getRelativeTime(prospect.last_activity)}`
                ) : prospect.industry ? (
                  prospect.industry
                ) : null}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusIndicator({ 
  active, 
  icon: Icon,
  label 
}: { 
  active: boolean
  icon: React.ElementType
  label: string 
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        active ? 'text-green-600' : 'text-muted-foreground/50'
      )}
    >
      {active ? '✅' : '○'} {label}
    </span>
  )
}

