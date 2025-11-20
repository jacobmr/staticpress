'use client'

import { useState } from 'react'
import { HUGO_THEMES } from '@/lib/themes'

interface ThemeSelectorProps {
  currentTheme?: string
}

export function ThemeSelector({ currentTheme }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChangeTheme = async () => {
    if (!selectedTheme || selectedTheme === currentTheme) {
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/repos/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: selectedTheme }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change theme')
      }

      setMessage(data.message || 'Theme changed successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change theme')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold">Theme</h2>

      {currentTheme && (
        <p className="mb-4 text-sm text-gray-500">
          Current theme: <span className="font-medium">{currentTheme}</span>
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {message}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        {HUGO_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelectedTheme(theme.id)}
            disabled={isLoading}
            className={`rounded-lg border p-3 text-left transition-colors disabled:opacity-50 ${
              selectedTheme === theme.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : theme.id === currentTheme
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/10'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
          >
            <div className="font-medium text-sm">
              {theme.name}
              {theme.id === currentTheme && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">(current)</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {theme.description}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleChangeTheme}
        disabled={isLoading || !selectedTheme || selectedTheme === currentTheme}
        className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Changing Theme...' : 'Change Theme'}
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Changing your theme will update your repository and trigger a rebuild.
      </p>
    </div>
  )
}
