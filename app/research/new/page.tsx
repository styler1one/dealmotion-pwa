'use client'

// Force dynamic rendering - this page uses authentication
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { AppShell } from '@/components/layout/app-shell'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Search, Building2, Globe, MapPin, Check, ArrowRight, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

interface CompanyResult {
  name: string
  domain: string
  industry?: string
  location?: string
  logo_url?: string
  existing_research_id?: string
}

export default function NewResearchPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CompanyResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCompanies = async () => {
    if (!query.trim()) return
    
    setSearching(true)
    setError(null)
    
    try {
      const token = await getToken()
      const data = await api<CompanyResult[]>(
        `/api/v1/company-search?q=${encodeURIComponent(query)}`,
        { token: token! }
      )
      setResults(data)
    } catch (err) {
      setError('Search failed. Please try again.')
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const createResearch = async () => {
    if (!selectedCompany) return
    
    setCreating(true)
    setError(null)
    
    try {
      const token = await getToken()
      const data = await api<{ id: string }>(
        '/api/v1/research',
        {
          method: 'POST',
          body: {
            company_name: selectedCompany.name,
            company_domain: selectedCompany.domain,
            language: 'en',
          },
          token: token!,
        }
      )
      
      router.push(`/research/${data.id}`)
    } catch (err) {
      setError('Failed to start research. Please try again.')
      console.error(err)
      setCreating(false)
    }
  }

  return (
    <AppShell>
      <Header title="New Research" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Search Input */}
        <div>
          <p className="text-lg font-medium mb-3">
            Which company do you want to research?
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCompanies()}
              placeholder="Search by name or domain..."
              className="w-full rounded-xl border bg-background pl-11 pr-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {query && (
              <Button
                size="sm"
                onClick={searchCompanies}
                disabled={searching}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {searching ? <Spinner size="sm" /> : 'Search'}
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && !selectedCompany && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              🌐 SEARCH RESULTS
            </p>
            {results.map((company, index) => (
              <button
                key={index}
                onClick={() => setSelectedCompany(company)}
                className="w-full text-left"
              >
                <Card interactive>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{company.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {company.domain && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {company.domain}
                            </span>
                          )}
                          {company.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {company.location}
                            </span>
                          )}
                        </div>
                        {company.existing_research_id && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ Research exists
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Selected Company Confirmation */}
        {selectedCompany && (
          <div className="space-y-6">
            <Card className="border-primary">
              <CardContent className="p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                  <Building2 className="h-8 w-8" />
                </div>
                <p className="text-xl font-bold">{selectedCompany.name}</p>
                {selectedCompany.domain && (
                  <p className="text-muted-foreground">
                    {selectedCompany.industry} • {selectedCompany.domain}
                  </p>
                )}
                {selectedCompany.location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    📍 {selectedCompany.location}
                  </p>
                )}
              </CardContent>
            </Card>

            {selectedCompany.existing_research_id ? (
              <div className="space-y-3">
                <p className="text-center text-muted-foreground">
                  ✅ Research already exists
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => router.push(`/research/${selectedCompany.existing_research_id}`)}
                >
                  View Research
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedCompany(null)}
                >
                  Search Again
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={createResearch}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Starting Research...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start Research
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Uses 1 research credit
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedCompany(null)}
                >
                  Choose Different Company
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searching && results.length === 0 && query && (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No companies found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

