'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

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
    const [showLogs, setShowLogs] = useState(false)
    const [logs, setLogs] = useState<string | null>(null)
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [isFixing, setIsFixing] = useState(false)
    const [fixResult, setFixResult] = useState<string | null>(null)

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

    const fetchLogs = async () => {
        if (!status || (status.state !== 'failure' && status.state !== 'error')) return

        try {
            setLoadingLogs(true)
            setShowLogs(true)
            const response = await fetch('/api/deployment/logs')
            if (response.ok) {
                const data = await response.json()
                setLogs(data.logs || 'No logs available.')
            } else {
                setLogs('Failed to fetch logs.')
            }
        } catch (e) {
            console.error(e)
            setLogs('Error fetching logs.')
        } finally {
            setLoadingLogs(false)
        }
    }

    const handleAutoFix = async () => {
        if (!logs) return
        setIsFixing(true)
        setFixResult(null)
        try {
            const response = await fetch('/api/deployment/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs }),
            })
            const data = await response.json()
            if (data.success) {
                setFixResult(`✅ Fixed! ${data.message}. Rebuilding...`)
                // Refresh status after a short delay
                setTimeout(fetchStatus, 5000)
            } else {
                setFixResult(`❌ ${data.message || 'Could not auto-fix.'}`)
            }
        } catch {
            setFixResult('❌ Error attempting fix.')
        } finally {
            setIsFixing(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchStatus()

        // Poll every 30 seconds
        const interval = setInterval(fetchStatus, 30000)
        return () => clearInterval(interval)
    }, [])

    // Only hide if there's a persistent error
    if (error && !status) return null

    return (
        <>
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
                                <button onClick={fetchLogs} className="hover:opacity-80">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </button>
                            )}

                            <div className="flex flex-col leading-none">
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                    {status.state === 'pending' ? 'Building...' :
                                        status.state === 'success' ? 'Live' :
                                            status.state === 'failure' ? 'Build Failed' : 'Error'}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {status.provider}
                                </span>
                            </div>
                        </div>

                        {status.url && status.state === 'success' && (
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

                        {(status.state === 'failure' || status.state === 'error') && (
                            <button
                                onClick={fetchLogs}
                                className="ml-1 rounded-full p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                title="View Logs"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </>
                ) : null}
            </div>

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-4xl rounded-xl bg-gray-900 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between border-b border-gray-800 p-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-medium text-white">Build Logs</h3>
                                {!loadingLogs && logs && (
                                    <button
                                        onClick={handleAutoFix}
                                        disabled={isFixing || !!fixResult}
                                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isFixing ? 'Attempting Fix...' : '✨ Attempt Auto-Fix'}
                                    </button>
                                )}
                                {fixResult && (
                                    <span className="text-xs text-gray-300">{fixResult}</span>
                                )}
                            </div>
                            <button
                                onClick={() => setShowLogs(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-300">
                            {loadingLogs ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap">{logs}</pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
