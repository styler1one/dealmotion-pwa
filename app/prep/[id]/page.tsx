'use client'

import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getRelativeTime } from '@/lib/utils'
import { Building2, ExternalLink, RefreshCw, Share2, MessageSquare, Target, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { use } from 'react'

interface Preparation {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prospect_name: string
  meeting_type?: string
  brief?: string
  talking_points?: string[]
  questions_to_ask?: string[]
  strategy?: string
  created_at: string
  updated_at: string
}

export default function PrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: prep, isLoading, mutate } = useApi<Preparation>(
    `/api/v1/prep/${id}`
  )

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Preparation" showBack />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppShell>
    )
  }

  if (!prep) {
    return (
      <AppShell>
        <Header title="Preparation" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">Preparation not found</p>
        </div>
      </AppShell>
    )
  }

  const isProcessing = prep.status === 'pending' || prep.status === 'processing'

  return (
    <AppShell>
      <Header
        title="Meeting Prep"
        showBack
        rightContent={
          <button
            onClick={() => mutate()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-6 space-y-4">
        {/* Header Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{prep.prospect_name}</h1>
                {prep.meeting_type && (
                  <Badge variant="secondary" className="capitalize mt-1">
                    {prep.meeting_type}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant={prep.status === 'completed' ? 'success' : 'warning'}>
            {prep.status === 'completed' ? '✅ Ready' : '⏳ Preparing...'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {getRelativeTime(prep.updated_at)}
          </span>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="font-medium">Preparing for your meeting...</p>
              <p className="text-sm text-muted-foreground mt-1">
                This usually takes 1-2 minutes
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Brief */}
        {prep.brief && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                📋 Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prep.brief}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Talking Points */}
        {prep.talking_points && prep.talking_points.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {prep.talking_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Questions to Ask */}
        {prep.questions_to_ask && prep.questions_to_ask.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Questions to Ask
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {prep.questions_to_ask.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    {question}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Strategy */}
        {prep.strategy && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prep.strategy}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <a
              href={`https://dealmotion.ai/dashboard/prep/${prep.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full
            </a>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

