'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface DeploymentStatus {
    provider: string
    state: 'pending' | 'success' | 'failure' | 'error'
    description: string | null
    url: string | null
    updated_at: string | null
}

export function DeploymentStatus() {
    const [status, setStatus] = useState<DeploymentStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchStatus = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/deployment/status')
            if (response.ok) {
                const data = await response.json()
                if (data.status) {
                    setStatus(data.status)
                } else {
                    // No status found yet
                    setStatus(null)
                }
                setError(false)
            } else {
                setError(true)
            }
        } catch (e) {
            console.error(e)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchStatus()

        // Poll every 30 seconds
        const interval = setInterval(fetchStatus, 30000)
        return () => clearInterval(interval)
    }, [])

    if (error) return null
    if (!status && !loading) return null

    return (
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {loading && !status ? (
                <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Checking status...</span>
                </div>
            ) : status ? (
                <>
                    <div className="flex items-center gap-2">
                        {status.state === 'pending' && (
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                            </span>
                        )}
                        {status.state === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {(status.state === 'failure' || status.state === 'error') && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        )}

                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                {status.state === 'pending' ? 'Building...' :
                                    status.state === 'success' ? 'Live' : 'Build Failed'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {status.provider}
                            </span>
                        </div>
                    </div>

                    {status.url && (
                        <a
                            href={status.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            title="View Deployment"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </>
            ) : null}
        </div>
    )
}
