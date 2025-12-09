'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { cn, formatDuration } from '@/lib/utils'
import { Mic, Square, Pause, Play, Upload, AlertTriangle, ChevronDown, Check } from 'lucide-react'
import { api } from '@/lib/api'

interface Meeting {
  id: string
  title: string
  start_time: string
  prospect_name?: string
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'complete'

export default function RecordPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { data: meetings } = useApi<Meeting[]>('/api/v1/calendar-meetings?filter=today')

  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showMeetingPicker, setShowMeetingPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Auto-select first meeting
  useEffect(() => {
    if (meetings && meetings.length > 0 && !selectedMeeting) {
      setSelectedMeeting(meetings[0])
    }
  }, [meetings, selectedMeeting])

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

  const startRecording = async () => {
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
    setState('uploading')
    setError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
      const extension = mimeType.includes('webm') ? 'webm' : 'mp4'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', blob, `recording.${extension}`)
      formData.append('duration', duration.toString())
      if (selectedMeeting) {
        formData.append('meeting_id', selectedMeeting.id)
      }

      // Upload with progress
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response)
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/recordings/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })

      setState('complete')
      
      // Redirect after success
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload recording. Please try again.')
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
        {/* Meeting Selector */}
        <Card>
          <CardContent className="p-4">
            <button
              onClick={() => setShowMeetingPicker(!showMeetingPicker)}
              className="w-full flex items-center justify-between"
              disabled={state !== 'idle'}
            >
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Meeting</p>
                <p className="font-medium">
                  {selectedMeeting ? selectedMeeting.title : 'Select a meeting'}
                </p>
              </div>
              <ChevronDown className={cn(
                'h-5 w-5 transition-transform',
                showMeetingPicker && 'rotate-180'
              )} />
            </button>

            {showMeetingPicker && meetings && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {meetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setShowMeetingPicker(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg text-left',
                      selectedMeeting?.id === meeting.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.prospect_name && (
                        <p className="text-sm text-muted-foreground">
                          {meeting.prospect_name}
                        </p>
                      )}
                    </div>
                    {selectedMeeting?.id === meeting.id && (
                      <Check className="h-5 w-5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recording UI */}
        <div className="flex flex-col items-center py-8">
          {/* Timer / Status */}
          <div className="text-center mb-8">
            {state === 'recording' && (
              <Badge variant="recording\" className="mb-2 animate-pulse">
                ● REC
              </Badge>
            )}
            {state === 'paused' && (
              <Badge variant="warning" className="mb-2">
                ⏸ PAUSED
              </Badge>
            )}
            {state === 'uploading' && (
              <Badge variant="info" className="mb-2">
                ↑ UPLOADING
              </Badge>
            )}
            {state === 'complete' && (
              <Badge variant="success" className="mb-2">
                ✓ COMPLETE
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
                variant="recording"
                onClick={startRecording}
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
                  Upload Recording
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
                <p className="text-muted-foreground">
                  Uploading... {uploadProgress}%
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
                  Redirecting...
                </p>
              </div>
            )}
          </div>
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
        {state === 'idle' && (
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
      </div>
    </AppShell>
  )
}

