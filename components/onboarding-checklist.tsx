'use client'

import { useState, useEffect } from 'react'
import { HugoPost } from '@/lib/github'

interface OnboardingChecklistProps {
  posts: HugoPost[]
  repoOwner: string
  repoName: string
  onCreatePost: () => void
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  action?: () => void
  actionLabel?: string
  externalUrl?: string
}

export function OnboardingChecklist({ posts, repoOwner, repoName, onCreatePost }: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding-dismissed-${repoOwner}/${repoName}`)
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [repoOwner, repoName])

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${repoOwner}/${repoName}`, 'true')
    setIsDismissed(true)
  }

  // Determine completion status
  const hasRealPost = posts.some(post =>
    !post.path.includes('welcome.md') &&
    !post.title.toLowerCase().includes('welcome to my blog')
  )

  const items: ChecklistItem[] = [
    {
      id: 'connect',
      title: 'Connect repository',
      description: 'Your Hugo blog is connected to StaticPress',
      completed: true, // Always true if they're on dashboard
    },
    {
      id: 'first-post',
      title: 'Create your first post',
      description: 'Write and publish your first blog post',
      completed: hasRealPost,
      action: onCreatePost,
      actionLabel: 'Create Post',
    },
    {
      id: 'deploy',
      title: 'Set up deployment',
      description: 'Deploy your blog to GitHub Pages, Cloudflare, or Vercel',
      completed: false, // We can't easily detect this
      externalUrl: `https://github.com/${repoOwner}/${repoName}/settings/pages`,
      actionLabel: 'Setup Pages',
    },
    {
      id: 'customize',
      title: 'Customize your blog',
      description: 'Update your theme, title, and settings in hugo.toml',
      completed: false, // Optional step
      externalUrl: `https://github.com/${repoOwner}/${repoName}/blob/main/hugo.toml`,
      actionLabel: 'Edit Config',
    },
  ]

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = (completedCount / totalCount) * 100

  // Don't show if dismissed or all items complete
  if (isDismissed || completedCount === totalCount) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Getting Started</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      {isExpanded && (
        <div className="p-4 pt-3">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                  item.completed
                    ? 'bg-green-500 text-white'
                    : 'border-2 border-gray-300 dark:border-gray-600'
                }`}>
                  {item.completed && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    item.completed
                      ? 'text-gray-500 line-through dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>

                {/* Action button */}
                {!item.completed && (item.action || item.externalUrl) && (
                  item.externalUrl ? (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {item.actionLabel}
                    </a>
                  ) : (
                    <button
                      onClick={item.action}
                      className="flex-shrink-0 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {item.actionLabel}
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
