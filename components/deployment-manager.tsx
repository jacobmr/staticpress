'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  RefreshCw,
  Rocket,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  ChevronDown,
  ChevronUp,
  PartyPopper,
} from 'lucide-react'
import { PlatformSelector, Platform } from './platform-selector'
import { PlatformConnectModal } from './platform-connect-modal'

interface Deployment {
  id: string
  status: 'pending' | 'building' | 'success' | 'failure' | 'cancelled'
  createdAt: string
  completedAt?: string
  commitMessage?: string
  commitSha?: string
  url?: string
  error?: string
}

interface CustomDomain {
  domain: string
  status: 'pending' | 'active' | 'error'
  verificationRecord?: {
    type: string
    name: string
    value: string
  }
}

interface DeploymentManagerProps {
  repositoryId: string
}

export function DeploymentManager({ repositoryId }: DeploymentManagerProps) {
  // URL search params for success state
  const searchParams = useSearchParams()

  // State
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [platformToConnect, setPlatformToConnect] = useState<Platform>('github-pages')

  // Deployment state
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)

  // Domain state
  const [domains, setDomains] = useState<CustomDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [showDnsInstructions, setShowDnsInstructions] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [copiedDns, setCopiedDns] = useState(false)

  // Success state from OAuth redirect
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupPlatform, setSetupPlatform] = useState<string | null>(null)
  const [productionUrl, setProductionUrl] = useState<string | null>(null)

  // Check for success state from URL params
  useEffect(() => {
    const success = searchParams.get('success')
    const platform = searchParams.get('platform')
    const url = searchParams.get('url')

    if (success === 'true' && platform && url) {
      setSetupComplete(true)
      setSetupPlatform(platform)
      setProductionUrl(url)
      setCurrentPlatform(platform as Platform)

      // Clear the URL params after reading
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [searchParams])

  // Fetch deployment data
  const fetchDeploymentData = useCallback(async () => {
    try {
      const [statusRes, historyRes, domainsRes] = await Promise.all([
        fetch('/api/deployment/status'),
        fetch('/api/deployment/history'),
        fetch('/api/deployment/domains'),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        if (data.status) {
          setCurrentDeployment({
            id: data.status.id || 'current',
            status: data.status.state,
            createdAt: data.status.updated_at || new Date().toISOString(),
            url: data.status.url,
          })
          setCurrentPlatform(data.status.provider as Platform || 'github-pages')
        }
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setDeployments(data.deployments || [])
      }

      if (domainsRes.ok) {
        const data = await domainsRes.json()
        setDomains(data.domains || [])
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch deployment data:', err)
      setError('Failed to load deployment information')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and polling
  useEffect(() => {
    fetchDeploymentData()

    // Poll every 5 seconds when deployment is pending/building
    const interval = setInterval(() => {
      if (currentDeployment?.status === 'pending' || currentDeployment?.status === 'building') {
        fetchDeploymentData()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchDeploymentData, currentDeployment?.status])

  // Deploy handler
  const handleDeploy = async () => {
    setIsDeploying(true)
    setError(null)

    try {
      const response = await fetch('/api/deployment/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: currentPlatform }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to trigger deployment')
      }

      const data = await response.json()
      setCurrentDeployment({
        id: data.deploymentId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })

      // Start polling
      fetchDeploymentData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy')
    } finally {
      setIsDeploying(false)
    }
  }

  // Rollback handler
  const handleRollback = async (deploymentId: string) => {
    try {
      const response = await fetch('/api/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rollback')
      }

      fetchDeploymentData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback')
    }
  }

  // Add domain handler
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) return

    setIsAddingDomain(true)
    setError(null)

    try {
      const response = await fetch('/api/deployment/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add domain')
      }

      const data = await response.json()
      setDomains(prev => [...prev, data.domain])
      setNewDomain('')
      setShowDnsInstructions(data.domain.domain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain')
    } finally {
      setIsAddingDomain(false)
    }
  }

  // Remove domain handler
  const handleRemoveDomain = async (domain: string) => {
    try {
      const response = await fetch('/api/deployment/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove domain')
      }

      setDomains(prev => prev.filter(d => d.domain !== domain))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain')
    }
  }

  // Platform selection handler
  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform)
  }

  // Connect platform handler
  const handleConnectPlatform = () => {
    if (selectedPlatform) {
      setPlatformToConnect(selectedPlatform)
      setShowConnectModal(true)
    }
  }

  // Connection success handler
  const handleConnectionSuccess = () => {
    setCurrentPlatform(selectedPlatform)
    fetchDeploymentData()
  }

  // Copy DNS record to clipboard
  const copyDnsRecord = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedDns(true)
    setTimeout(() => setCopiedDns(false), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'building':
        return <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'building':
        return 'Building...'
      case 'success':
        return 'Live'
      case 'failure':
        return 'Failed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success state after auto-setup */}
      {setupComplete && productionUrl && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
              <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Deployment Configured!
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Your site is now connected to {setupPlatform === 'github-pages' ? 'GitHub Pages' : setupPlatform?.charAt(0).toUpperCase() + (setupPlatform?.slice(1) || '')}.
                It will deploy automatically on every push to your repository.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={productionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View your site
                </a>
                <button
                  onClick={() => setSetupComplete(false)}
                  className="text-sm text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-3 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Deployment Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Deployment Status
            </h3>
            {currentPlatform && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Deploying to {currentPlatform === 'github-pages' ? 'GitHub Pages' : currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)}
              </p>
            )}
          </div>

          <button
            onClick={handleDeploy}
            disabled={isDeploying || currentDeployment?.status === 'building'}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isDeploying || currentDeployment?.status === 'building' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Deploy Now
              </>
            )}
          </button>
        </div>

        {currentDeployment && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(currentDeployment.status)}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getStatusText(currentDeployment.status)}
              </span>
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(currentDeployment.createdAt).toLocaleString()}
            </span>

            {currentDeployment.url && currentDeployment.status === 'success' && (
              <a
                href={currentDeployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Site
              </a>
            )}
          </div>
        )}
      </div>

      {/* Platform Selector */}
      {!currentPlatform && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Deployment Platform
          </h3>

          <PlatformSelector
            selectedPlatform={selectedPlatform}
            onSelect={handlePlatformSelect}
          />

          {selectedPlatform && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleConnectPlatform}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Connect {selectedPlatform === 'github-pages' ? 'GitHub Pages' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Deployment History */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-between p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Deployment History
          </h3>
          {showHistory ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {showHistory && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {deployments.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No deployment history yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {deployments.slice(0, 5).map(deployment => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {getStatusText(deployment.status)}
                          </span>
                          {deployment.commitSha && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              {deployment.commitSha.slice(0, 7)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(deployment.createdAt).toLocaleString()}
                          {deployment.commitMessage && (
                            <span className="ml-2">&bull; {deployment.commitMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {deployment.url && deployment.status === 'success' && (
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="View"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {deployment.status === 'success' && currentPlatform !== 'github-pages' && (
                        <button
                          onClick={() => handleRollback(deployment.id)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="Rollback to this version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Domains */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Custom Domains
        </h3>

        {/* Domain list */}
        {domains.length > 0 && (
          <div className="mb-4 space-y-3">
            {domains.map(domain => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {domain.domain}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      domain.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : domain.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {domain.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {domain.status === 'pending' && domain.verificationRecord && (
                    <button
                      onClick={() =>
                        setShowDnsInstructions(
                          showDnsInstructions === domain.domain ? null : domain.domain
                        )
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      DNS Setup
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveDomain(domain.domain)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-700"
                    title="Remove domain"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DNS Instructions */}
        {showDnsInstructions && (
          <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              DNS Configuration Required
            </h4>
            <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
              Add the following DNS record to verify ownership of {showDnsInstructions}:
            </p>

            {domains.find(d => d.domain === showDnsInstructions)?.verificationRecord && (
              <div className="rounded-md bg-white p-3 dark:bg-gray-800">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Type</span>
                    <p className="font-mono text-gray-900 dark:text-gray-100">
                      {domains.find(d => d.domain === showDnsInstructions)?.verificationRecord?.type}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Name</span>
                    <p className="font-mono text-gray-900 dark:text-gray-100">
                      {domains.find(d => d.domain === showDnsInstructions)?.verificationRecord?.name}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Value</span>
                    <div className="flex items-center gap-2">
                      <p className="truncate font-mono text-gray-900 dark:text-gray-100">
                        {domains.find(d => d.domain === showDnsInstructions)?.verificationRecord?.value}
                      </p>
                      <button
                        onClick={() =>
                          copyDnsRecord(
                            domains.find(d => d.domain === showDnsInstructions)?.verificationRecord?.value || ''
                          )
                        }
                        className="flex-shrink-0 text-gray-500 hover:text-gray-700"
                        title="Copy"
                      >
                        {copiedDns ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
              DNS changes can take up to 48 hours to propagate. We&apos;ll automatically verify once the record is detected.
            </p>
          </div>
        )}

        {/* Add domain form */}
        <form onSubmit={handleAddDomain} className="flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="example.com"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
          />
          <button
            type="submit"
            disabled={isAddingDomain || !newDomain.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isAddingDomain ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Domain
          </button>
        </form>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Enter your custom domain without https:// prefix
        </p>
      </div>

      {/* Platform Connect Modal */}
      <PlatformConnectModal
        platform={platformToConnect}
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectionSuccess}
      />
    </div>
  )
}
