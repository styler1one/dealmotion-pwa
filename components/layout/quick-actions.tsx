'use client'

import { Drawer } from 'vaul'
import { useRouter } from 'next/navigation'
import { Mic, Search, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const actions = [
  {
    icon: Mic,
    label: 'Record Meeting',
    description: 'Start recording now',
    href: '/record',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  {
    icon: Search,
    label: 'New Research',
    description: 'Research a company',
    href: '/research/new',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: FileText,
    label: 'New Preparation',
    description: 'Prepare for a meeting',
    href: '/prep/new',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
]

export function QuickActions({ open, onOpenChange }: QuickActionsProps) {
  const router = useRouter()

  const handleAction = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl bg-background">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
          
          <div className="flex items-center justify-between px-4 py-3">
            <Drawer.Title className="text-lg font-semibold">
              Quick Actions
            </Drawer.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 p-4 pb-8">
            {actions.map((action) => (
              <button
                key={action.href}
                onClick={() => handleAction(action.href)}
                className={cn(
                  'flex items-center gap-4 rounded-xl p-4 text-left transition-colors',
                  'hover:bg-muted active:scale-[0.98]'
                )}
              >
                <div className={cn('rounded-xl p-3', action.bgColor)}>
                  <action.icon className={cn('h-6 w-6', action.color)} />
                </div>
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

