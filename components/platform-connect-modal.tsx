'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, AlertCircle, CheckCircle, Github, Cloud } from 'lucide-react'
import type { Platform } from './platform-selector'

interface PlatformConnectModalProps {
  platform: Platform
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const platformInfo: Record<Platform, { name: string; color: string }> = {
  'github-pages': { name: 'GitHub Pages', color: 'gray' },
  'vercel': { name: 'Vercel', color: 'black' },
  'netlify': { name: 'Netlify', color: 'teal' },
  'cloudflare': { name: 'Cloudflare Pages', color: 'orange' },
}

export function PlatformConnectModal({ platform, isOpen, onClose, onSuccess }: PlatformConnectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Cloudflare-specific form state
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')

  const info = platformInfo[platform]

  const handleOAuthConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/deployment/oauth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to initialize OAuth')
      }

      const { authUrl } = await response.json()

      // Redirect to OAuth provider
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const handleCloudflareConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/deployment/connect/cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken, accountId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect Cloudflare')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubPagesConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/deploy/github-pages', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to enable GitHub Pages')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Connect {info.name}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {platform === 'github-pages'
              ? 'GitHub Pages will be enabled for your repository.'
              : platform === 'cloudflare'
              ? 'Enter your Cloudflare API credentials to connect.'
              : `Authorize StaticPress to deploy to ${info.name}.`}
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>Successfully connected! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Content based on platform */}
        {!success && (
          <>
            {platform === 'github-pages' && (
              <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <Github className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Already authenticated
                      </p>
                      <p className="mt-1">
                        Your GitHub connection will be used to enable Pages for your repository.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGitHubPagesConnect}
                  disabled={isLoading}
                  className="w-full rounded-md bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enabling GitHub Pages...
                    </span>
                  ) : (
                    'Enable GitHub Pages'
                  )}
                </button>
              </div>
            )}

            {(platform === 'vercel' || platform === 'netlify') && (
              <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You&apos;ll be redirected to {info.name} to authorize StaticPress. After approval, you&apos;ll be
                    returned here automatically.
                  </p>
                </div>

                <button
                  onClick={handleOAuthConnect}
                  disabled={isLoading}
                  className={`w-full rounded-md px-4 py-3 font-medium text-white disabled:opacity-50 ${
                    platform === 'vercel'
                      ? 'bg-black hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100'
                      : 'bg-teal-500 hover:bg-teal-600'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Connect with {info.name}
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </div>
            )}

            {platform === 'cloudflare' && (
              <form onSubmit={handleCloudflareConnect} className="space-y-4">
                <div>
                  <label
                    htmlFor="apiToken"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    API Token
                  </label>
                  <input
                    id="apiToken"
                    type="password"
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    placeholder="Enter your Cloudflare API token"
                    required
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Create a token with &quot;Edit Cloudflare Pages&quot; permissions.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="accountId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Account ID
                  </label>
                  <input
                    id="accountId"
                    type="text"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="Enter your Cloudflare Account ID"
                    required
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Found in your Cloudflare dashboard URL or account settings.
                  </p>
                </div>

                <div className="rounded-md bg-orange-50 p-4 dark:bg-orange-900/20">
                  <div className="flex items-start gap-3">
                    <Cloud className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      <a
                        href="https://dash.cloudflare.com/profile/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:no-underline"
                      >
                        Get your API token
                      </a>
                      {' '}from the Cloudflare dashboard.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !apiToken || !accountId}
                  className="w-full rounded-md bg-orange-500 px-4 py-3 font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    'Connect Cloudflare'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Your credentials are encrypted and stored securely.
        </div>
      </div>
    </div>
  )
}
