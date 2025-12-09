'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Spinner } from '@/components/ui/spinner'
import { use } from 'react'

export default function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // Redirect to web app - the PWA doesn't have a research detail view yet
  useEffect(() => {
    window.location.href = `https://dealmotion.ai/dashboard/research/${id}`
  }, [id])

  return (
    <AppShell hideNav>
      <Header title="Research" showBack />
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground mt-4">Opening research in web app...</p>
      </div>
    </AppShell>
  )
}
