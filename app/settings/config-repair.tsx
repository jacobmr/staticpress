'use client'

import { useState } from 'react'
import { Wrench } from 'lucide-react'

export function ConfigRepair() {
    const [isRepairing, setIsRepairing] = useState(false)
    const [message, setMessage] = useState('')

    const handleRepair = async () => {
        setIsRepairing(true)
        setMessage('')

        try {
            const response = await fetch('/api/settings/fix-config', {
                method: 'POST',
            })
            const data = await response.json()

            if (response.ok) {
                setMessage(`✓ ${data.message}`)
            } else {
                setMessage(`❌ ${data.error || 'Failed to repair'}`)
            }
        } catch (_error) {
            setMessage('❌ Error repairing configuration')
        } finally {
            setIsRepairing(false)
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Troubleshooting</h2>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    If your site is failing to build or images are not showing, try repairing the configuration.
                    This will ensure your <code>hugo.toml</code> has the correct settings.
                </p>
                <button
                    onClick={handleRepair}
                    disabled={isRepairing}
                    className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                    <Wrench className="h-4 w-4" />
                    {isRepairing ? 'Repairing...' : 'Repair Configuration'}
                </button>
                {message && (
                    <p className={`text-sm ${message.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
