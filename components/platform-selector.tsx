'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Globe, Cloud, Github } from 'lucide-react'

export type Platform = 'github-pages' | 'vercel' | 'netlify' | 'cloudflare'

export interface PlatformInfo {
  id: Platform
  name: string
  description: string
  capabilities: string[]
  connected: boolean
  requiresOAuth: boolean
}

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void
  selectedPlatform: Platform | null
  disabled?: boolean
}

const platformData: Omit<PlatformInfo, 'connected'>[] = [
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    description: 'Free hosting directly from your GitHub repository',
    capabilities: ['Free hosting', 'Custom domains', 'Automatic HTTPS'],
    requiresOAuth: false,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Fast global CDN with preview deployments',
    capabilities: ['Preview deployments', 'Edge functions', 'Analytics', 'Custom domains'],
    requiresOAuth: true,
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'All-in-one platform for web projects',
    capabilities: ['Preview deployments', 'Forms', 'Functions', 'Custom domains'],
    requiresOAuth: true,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    description: 'Ultra-fast edge network with unlimited bandwidth',
    capabilities: ['Unlimited bandwidth', 'Edge functions', 'Web analytics', 'Custom domains'],
    requiresOAuth: true,
  },
]

const PlatformIcon = ({ platform, className }: { platform: Platform; className?: string }) => {
  switch (platform) {
    case 'github-pages':
      return <Github className={className} />
    case 'vercel':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 19.5h20L12 2z" />
        </svg>
      )
    case 'netlify':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954zM12.06 6.546a1.305 1.305 0 0 1 .209.574l3.497 1.482a1.044 1.044 0 0 1 .366-.325l.502-3.016-3.01-2.98-1.564 4.265zM14.035 13.277l.079-.006a1.044 1.044 0 0 1 .206.026l3.25-4.028-.014-.007a1.044 1.044 0 0 1-.062-.18l-3.498-1.483a1.305 1.305 0 0 1-.112.182l.151 5.496zM15.61 16.204l4.028-4.988-2.234-.997-3.25 4.028a1.044 1.044 0 0 1 .27.14l1.186 1.817zM8.73 7.165l-3.242 2.14 2.974 1.078.268-3.218zM14.156 13.941a1.044 1.044 0 0 1-.185-.78l-.15-5.497a1.305 1.305 0 0 1-.18-.042L9.82 9.7l-.274 3.281 4.61.96zM9.517 11.07l-2.764-1.01-2.037 1.344 4.801 1.063v-.03a1.044 1.044 0 0 1 0-.367v-.001z" />
        </svg>
      )
    case 'cloudflare':
      return <Cloud className={className} />
    default:
      return <Globe className={className} />
  }
}

export function PlatformSelector({ onSelect, selectedPlatform, disabled = false }: PlatformSelectorProps) {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConnectedPlatforms = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/deployment/platforms')

        if (response.ok) {
          const data = await response.json()
          const connectedPlatforms: Platform[] = data.connected || []

          setPlatforms(
            platformData.map(p => ({
              ...p,
              connected: connectedPlatforms.includes(p.id) || p.id === 'github-pages',
            }))
          )
        } else {
          // If API fails, assume only GitHub Pages is connected
          setPlatforms(
            platformData.map(p => ({
              ...p,
              connected: p.id === 'github-pages',
            }))
          )
        }
        setError(null)
      } catch (err) {
        console.error('Failed to fetch connected platforms:', err)
        // Default: only GitHub Pages connected
        setPlatforms(
          platformData.map(p => ({
            ...p,
            connected: p.id === 'github-pages',
          }))
        )
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchConnectedPlatforms()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="animate-pulse rounded-lg border-2 border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="h-6 w-6 rounded bg-gray-300 dark:bg-gray-600" />
            <div className="mt-3 h-5 w-24 rounded bg-gray-300 dark:bg-gray-600" />
            <div className="mt-2 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            disabled={disabled}
            className={`relative rounded-lg border-2 p-6 text-left transition-all ${
              selectedPlatform === platform.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950 dark:ring-blue-800'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-750'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {/* Selected indicator */}
            {selectedPlatform === platform.id && (
              <div className="absolute right-3 top-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
            )}

            {/* Connection status badge */}
            {platform.connected && (
              <div className="absolute left-3 top-3">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
              </div>
            )}

            {/* Platform icon and info */}
            <div className={`${platform.connected ? 'mt-6' : ''}`}>
              <PlatformIcon
                platform={platform.id}
                className={`h-8 w-8 ${
                  selectedPlatform === platform.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              />

              <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {platform.name}
              </h3>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {platform.description}
              </p>

              {/* Capabilities badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {platform.capabilities.slice(0, 3).map(capability => (
                  <span
                    key={capability}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {capability}
                  </span>
                ))}
                {platform.capabilities.length > 3 && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    +{platform.capabilities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
