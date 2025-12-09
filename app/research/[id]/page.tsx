'use client'

import { useApi } from '@/lib/hooks/use-api'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDate, getRelativeTime } from '@/lib/utils'
import { Building2, Globe, MapPin, ExternalLink, RefreshCw, Share2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { use } from 'react'

interface Research {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  company_name: string
  company_domain?: string
  company_industry?: string
  company_location?: string
  brief?: string
  key_insights?: string[]
  recent_news?: Array<{
    title: string
    summary: string
    date: string
  }>
  created_at: string
  updated_at: string
}

export default function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: research, isLoading, mutate } = useApi<Research>(
    `/api/v1/research/${id}`
  )

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Research" showBack />
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppShell>
    )
  }

  if (!research) {
    return (
      <AppShell>
        <Header title="Research" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">Research not found</p>
        </div>
      </AppShell>
    )
  }

  const isProcessing = research.status === 'pending' || research.status === 'processing'

  return (
    <AppShell>
      <Header
        title="Research Brief"
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
        {/* Company Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{research.company_name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {research.company_industry && (
                    <span>{research.company_industry}</span>
                  )}
                  {research.company_domain && (
                    <a
                      href={`https://${research.company_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {research.company_domain}
                    </a>
                  )}
                </div>
                {research.company_location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {research.company_location}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={research.status === 'completed' ? 'success' : 'warning'}>
            {research.status === 'completed' ? '✅ Complete' : '⏳ Processing...'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {getRelativeTime(research.updated_at)}
          </span>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="font-medium">Researching {research.company_name}...</p>
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
        {research.brief && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📋 Brief</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {research.brief}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Insights */}
        {research.key_insights && research.key_insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {research.key_insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recent News */}
        {research.recent_news && research.recent_news.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📰 Recent News</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {research.recent_news.map((news, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <p className="font-medium">{news.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {news.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(news.date)}
                  </p>
                </div>
              ))}
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
              href={`https://dealmotion.ai/dashboard/research/${research.id}`}
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

