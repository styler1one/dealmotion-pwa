'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn, formatDuration } from '@/lib/utils'
import { Mic, Square, Pause, Play, Upload, AlertTriangle, ChevronDown, Check, Building2, Search, FileText } from 'lucide-react'

interface Prospect {
  id: string
  company_name: string
  domain?: string
}

interface ProspectsResponse {
  prospects: Prospect[]
  total: number
}

interface Preparation {
  id: string
  meeting_subject?: string
  meeting_date?: string
  created_at: string
  status: string
}

interface ProspectHubResponse {
  prospect: Prospect
  preparations: Preparation[]
  followups: unknown[]
  research: unknown
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'complete'

function RecordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken } = useAuth()
  
  // Get pre-selected prospect from URL
  const preselectedProspectId = searchParams.get('prospectId')
  
  const { data: prospectsData } = useApi<ProspectsResponse>('/api/v1/prospects')
  const prospects = prospectsData?.prospects || []

  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showProspectPicker, setShowProspectPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  
  // Preparation state
  const [preparations, setPreparations] = useState<Preparation[]>([])
  const [selectedPreparation, setSelectedPreparation] = useState<Preparation | null>(null)
  const [showPrepPicker, setShowPrepPicker] = useState(false)
  const [loadingPreps, setLoadingPreps] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Auto-select prospect from URL
  useEffect(() => {
    if (preselectedProspectId && prospects.length > 0 && !selectedProspect) {
      const prospect = prospects.find(p => p.id === preselectedProspectId)
      if (prospect) setSelectedProspect(prospect)
    }
  }, [preselectedProspectId, prospects, selectedProspect])

  // Fetch preparations when prospect changes
  useEffect(() => {
    const fetchPreparations = async () => {
      if (!selectedProspect) {
        setPreparations([])
        setSelectedPreparation(null)
        return
      }

      setLoadingPreps(true)
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/prospects/${selectedProspect.id}/hub`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const data: ProspectHubResponse = await response.json()
          // Filter to only show completed preparations
          const completedPreps = (data.preparations || []).filter(
            p => p.status === 'completed'
          )
          setPreparations(completedPreps)
        }
      } catch (err) {
        console.error('Error fetching preparations:', err)
      } finally {
        setLoadingPreps(false)
      }
    }

    fetchPreparations()
  }, [selectedProspect, getToken])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const filteredProspects = prospects.filter(p =>
    p.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const startRecording = async () => {
    if (!selectedProspect) {
      setError('Please select a company first')
      return
    }

    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      // Set up audio analyser for level visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
        }
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Determine best format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }

      mediaRecorder.start(1000) // Collect data every second

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

      setState('recording')
    } catch (err) {
      console.error('Recording error:', err)
      setError('Could not access microphone. Please allow microphone access.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      if (timerRef.current) clearInterval(timerRef.current)
      setState('paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
      setState('recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
      setState('stopped')
    }
  }

  const uploadRecording = async () => {
    if (!selectedProspect) {
      setError('Please select a company')
      return
    }

    setState('uploading')
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
      const extension = mimeType.includes('webm') ? 'webm' : 'mp4'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      
      // Create form data - use followup/upload endpoint (same as webapp)
      const formData = new FormData()
      formData.append('file', blob, `recording_${Date.now()}.${extension}`)
      formData.append('prospect_company_name', selectedProspect.company_name)
      formData.append('include_coaching', 'false')
      formData.append('language', 'en')
      
      // Link to preparation if selected (provides extra context for analysis)
      if (selectedPreparation) {
        formData.append('meeting_prep_id', selectedPreparation.id)
      }

      // Upload with progress
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      const response = await new Promise<{ id: string; prospect_id?: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              resolve({ id: '' })
            }
          } else {
            let errorMsg = 'Upload failed'
            try {
              const errorData = JSON.parse(xhr.responseText)
              // Handle both string and object detail responses
              if (typeof errorData.detail === 'string') {
                errorMsg = errorData.detail
              } else if (errorData.detail?.message) {
                errorMsg = errorData.detail.message
              } else if (errorData.message) {
                errorMsg = errorData.message
              }
              
              // Special handling for subscription limits (402)
              if (xhr.status === 402 && errorData.detail?.error === 'limit_exceeded') {
                errorMsg = 'You have reached your monthly limit. Please upgrade your plan to continue.'
              }
            } catch {}
            reject(new Error(errorMsg))
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed - network error'))
        
        // Use the followup/upload endpoint (triggers Inngest processing)
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/followup/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })

      console.log('Upload response:', response)
      setState('complete')
      
      // Redirect to followup detail or home after success
      setTimeout(() => {
        if (response.id) {
          // Redirect to web app followup page (PWA doesn't have followup detail yet)
          window.location.href = `https://dealmotion.ai/dashboard/followup/${response.id}`
        } else {
          router.push('/')
        }
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload recording. Please try again.')
      setState('stopped')
    }
  }

  const discardRecording = () => {
    chunksRef.current = []
    setDuration(0)
    setState('idle')
    setError(null)
  }

  return (
    <AppShell hideNav>
      <Header title="Record Meeting" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Company Selector (Required) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Company *</span>
            </div>
            <button
              onClick={() => setShowProspectPicker(!showProspectPicker)}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              disabled={state !== 'idle'}
            >
              <div className="text-left">
                {selectedProspect ? (
                  <p className="font-medium">{selectedProspect.company_name}</p>
                ) : (
                  <p className="text-muted-foreground">Select a company</p>
                )}
              </div>
              <ChevronDown className={cn(
                'h-5 w-5 transition-transform',
                showProspectPicker && 'rotate-180'
              )} />
            </button>

            {showProspectPicker && (
              <div className="mt-3 pt-3 border-t space-y-3">
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
                  {filteredProspects.length > 0 ? (
                    filteredProspects.map((prospect) => (
                      <button
                        key={prospect.id}
                        onClick={() => {
                          setSelectedProspect(prospect)
                          setSelectedPreparation(null) // Reset preparation when company changes
                          setShowProspectPicker(false)
                          setSearchQuery('')
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg text-left',
                          selectedProspect?.id === prospect.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <span className="font-medium">{prospect.company_name}</span>
                        {selectedProspect?.id === prospect.id && (
                          <Check className="h-5 w-5" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No companies found
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preparation Selector (Optional) - only show when prospect is selected */}
        {selectedProspect && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Meeting Preparation</span>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              
              {loadingPreps ? (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Spinner size="sm" />
                  <span>Loading preparations...</span>
                </div>
              ) : preparations.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">
                  No preparations found for this company
                </p>
              ) : (
                <>
                  <button
                    onClick={() => setShowPrepPicker(!showPrepPicker)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                    disabled={state !== 'idle'}
                  >
                    <div className="text-left">
                      {selectedPreparation ? (
                        <div>
                          <p className="font-medium text-sm">
                            {selectedPreparation.meeting_subject || 'Meeting Preparation'}
                          </p>
                          {selectedPreparation.meeting_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(selectedPreparation.meeting_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Select a preparation (optional)</p>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      'h-5 w-5 transition-transform',
                      showPrepPicker && 'rotate-180'
                    )} />
                  </button>

                  {showPrepPicker && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {/* Option to clear selection */}
                        <button
                          onClick={() => {
                            setSelectedPreparation(null)
                            setShowPrepPicker(false)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg text-left',
                            !selectedPreparation ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                          )}
                        >
                          <span className="text-sm text-muted-foreground">No preparation</span>
                          {!selectedPreparation && <Check className="h-5 w-5" />}
                        </button>
                        
                        {preparations.map((prep) => (
                          <button
                            key={prep.id}
                            onClick={() => {
                              setSelectedPreparation(prep)
                              setShowPrepPicker(false)
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-lg text-left',
                              selectedPreparation?.id === prep.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            )}
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {prep.meeting_subject || 'Meeting Preparation'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {prep.meeting_date 
                                  ? new Date(prep.meeting_date).toLocaleDateString()
                                  : new Date(prep.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {selectedPreparation?.id === prep.id && (
                              <Check className="h-5 w-5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recording UI */}
        <div className="flex flex-col items-center py-8">
          {/* Timer / Status */}
          <div className="text-center mb-8">
            {state === 'recording' && (
              <Badge variant="recording" className="mb-2 animate-pulse">
                ● REC
              </Badge>
            )}
            {state === 'paused' && (
              <Badge variant="warning" className="mb-2">
                ⏸ PAUSED
              </Badge>
            )}
            {state === 'uploading' && (
              <Badge variant="secondary" className="mb-2">
                ↑ UPLOADING {uploadProgress}%
              </Badge>
            )}
            {state === 'complete' && (
              <Badge variant="success" className="mb-2">
                ✓ PROCESSING
              </Badge>
            )}
            
            <p className="text-5xl font-mono font-bold">
              {formatDuration(duration)}
            </p>
          </div>

          {/* Audio Level Indicator */}
          {(state === 'recording' || state === 'paused') && (
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          )}

          {/* Main Recording Button */}
          <div className="flex items-center gap-4">
            {state === 'idle' && (
              <Button
                size="xl"
                variant={selectedProspect ? "recording" : "outline"}
                onClick={startRecording}
                disabled={!selectedProspect}
                className="h-20 w-20 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {state === 'recording' && (
              <>
                <Button
                  size="icon-lg"
                  variant="outline"
                  onClick={pauseRecording}
                >
                  <Pause className="h-6 w-6" />
                </Button>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-20 w-20 rounded-full"
                >
                  <Square className="h-8 w-8" />
                </Button>
              </>
            )}

            {state === 'paused' && (
              <>
                <Button
                  size="icon-lg"
                  variant="outline"
                  onClick={resumeRecording}
                >
                  <Play className="h-6 w-6" />
                </Button>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-20 w-20 rounded-full"
                >
                  <Square className="h-8 w-8" />
                </Button>
              </>
            )}

            {state === 'stopped' && (
              <div className="flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  onClick={uploadRecording}
                  className="w-48"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload & Analyze
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={discardRecording}
                  className="w-48"
                >
                  Discard
                </Button>
              </div>
            )}

            {state === 'uploading' && (
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Uploading recording...
                </p>
              </div>
            )}

            {state === 'complete' && (
              <div className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-4">
                  <Check className="h-8 w-8" />
                </div>
                <p className="font-medium">Recording uploaded!</p>
                <p className="text-sm text-muted-foreground">
                  Opening analysis...
                </p>
              </div>
            )}
          </div>

          {/* Help text for idle state */}
          {state === 'idle' && !selectedProspect && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Select a company above to start recording
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Consent Reminder */}
        {state === 'idle' && selectedProspect && (
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Consent Reminder
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Remember to ask permission from all meeting participants before recording.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {(state === 'recording' || state === 'paused') && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Keep this tab open while recording. 
                The screen can be turned off, but don&apos;t close the browser.
              </p>
            </CardContent>
          </Card>
        )}

        {/* What happens next */}
        {state === 'stopped' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="font-medium text-sm mb-2">What happens next?</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Recording is uploaded to DealMotion</li>
                <li>AI transcribes the conversation</li>
                <li>AI generates summary & action items</li>
                <li>You&apos;ll see the analysis in ~2 minutes</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default function RecordPage() {
  return (
    <Suspense fallback={
      <AppShell hideNav>
        <Header title="Record Meeting" showBack />
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AppShell>
    }>
      <RecordContent />
    </Suspense>
  )
}
