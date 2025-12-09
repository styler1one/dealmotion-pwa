'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn, formatTime } from '@/lib/utils'
import { Building2, Calendar, Check, ChevronDown, Sparkles, Search, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface Prospect {
  id: string
  name: string
  domain?: string
  has_research: boolean
}

interface Meeting {
  id: string
  title: string
  start_time: string
  prospect_id?: string
  prospect_name?: string
  is_prepared: boolean
}

const MEETING_TYPES = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'demo', label: 'Demo' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'closing', label: 'Closing' },
]

function NewPrepContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken } = useAuth()
  
  const preselectedMeetingId = searchParams.get('meeting')
  
  const { data: meetings } = useApi<Meeting[]>('/api/v1/calendar-meetings?filter=week&unprepared=true')
  const { data: prospects } = useApi<Prospect[]>('/api/v1/prospects')
  
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [meetingType, setMeetingType] = useState('discovery')
  const [notes, setNotes] = useState('')
  const [showProspectPicker, setShowProspectPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-select meeting if provided
  useEffect(() => {
    if (preselectedMeetingId && meetings) {
      const meeting = meetings.find(m => m.id === preselectedMeetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
        if (meeting.prospect_id && prospects) {
          const prospect = prospects.find(p => p.id === meeting.prospect_id)
          if (prospect) setSelectedProspect(prospect)
        }
      }
    }
  }, [preselectedMeetingId, meetings, prospects])

  const filteredProspects = prospects?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const createPreparation = async () => {
    if (!selectedProspect) {
      setError('Please select a company')
      return
    }
    
    setCreating(true)
    setError(null)
    
    try {
      const token = await getToken()
      const data = await api<{ id: string }>(
        '/api/v1/prep',
        {
          method: 'POST',
          body: {
            prospect_id: selectedProspect.id,
            meeting_id: selectedMeeting?.id,
            meeting_type: meetingType,
            notes: notes || undefined,
            language: 'en',
          },
          token: token!,
        }
      )
      
      router.push(`/prep/${data.id}`)
    } catch (err) {
      setError('Failed to create preparation. Please try again.')
      console.error(err)
      setCreating(false)
    }
  }

  return (
    <AppShell hideNav>
      <Header title="New Preparation" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Unprepared Meetings */}
        {meetings && meetings.length > 0 && !selectedMeeting && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              UPCOMING MEETINGS (not prepared)
            </p>
            <div className="space-y-2">
              {meetings.slice(0, 3).map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => {
                    setSelectedMeeting(meeting)
                    if (meeting.prospect_id && prospects) {
                      const prospect = prospects.find(p => p.id === meeting.prospect_id)
                      if (prospect) setSelectedProspect(prospect)
                    }
                  }}
                  className="w-full text-left"
                >
                  <Card interactive>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(meeting.start_time)}
                            {meeting.prospect_name && ` • ${meeting.prospect_name}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Company Selector */}
        <div>
          <p className="text-sm font-medium mb-2">Company *</p>
          <Card>
            <CardContent className="p-0">
              <button
                onClick={() => setShowProspectPicker(!showProspectPicker)}
                className="w-full flex items-center justify-between p-4"
              >
                {selectedProspect ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{selectedProspect.name}</p>
                      {selectedProspect.has_research ? (
                        <p className="text-xs text-green-600">✅ Research available</p>
                      ) : (
                        <p className="text-xs text-amber-600">⚠️ No research</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select a company</span>
                )}
                <ChevronDown className={cn(
                  'h-5 w-5 transition-transform',
                  showProspectPicker && 'rotate-180'
                )} />
              </button>

              {showProspectPicker && (
                <div className="border-t p-3 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search companies..."
                      className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredProspects.map((prospect) => (
                      <button
                        key={prospect.id}
                        onClick={() => {
                          setSelectedProspect(prospect)
                          setShowProspectPicker(false)
                          setSearchQuery('')
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-lg text-left',
                          selectedProspect?.id === prospect.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <span className="font-medium">{prospect.name}</span>
                        {selectedProspect?.id === prospect.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* No Research Warning */}
        {selectedProspect && !selectedProspect.has_research && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    No research available
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Research helps create better preparations with relevant talking points.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/research/new')}
                  >
                    Research First (recommended)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meeting Type */}
        <div>
          <p className="text-sm font-medium mb-2">Meeting Type</p>
          <div className="grid grid-cols-2 gap-2">
            {MEETING_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setMeetingType(type.value)}
                className={cn(
                  'py-3 px-4 rounded-xl border text-sm font-medium transition-colors',
                  meetingType === type.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-medium mb-2">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific context or focus areas..."
            rows={3}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          size="lg"
          className="w-full"
          onClick={createPreparation}
          disabled={creating || !selectedProspect}
        >
          {creating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Creating Preparation...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Start Preparation
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Uses 1 flow credit
        </p>
      </div>
    </AppShell>
  )
}

export default function NewPrepPage() {
  return (
    <Suspense fallback={
      <AppShell hideNav>
        <Header title="New Preparation" showBack />
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AppShell>
    }>
      <NewPrepContent />
    </Suspense>
  )
}
