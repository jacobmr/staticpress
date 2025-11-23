'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ThemeMigrationWarningProps {
  currentTheme: string
  onDismiss?: () => void
}

export function ThemeMigrationWarning({ currentTheme, onDismiss }: ThemeMigrationWarningProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed this warning before
    const dismissedThemes = localStorage.getItem('dismissed-theme-warnings')
    if (dismissedThemes) {
      const themes = JSON.parse(dismissedThemes)
      if (themes.includes(currentTheme)) {
        setDismissed(true)
      }
    }
  }, [currentTheme])

  const handleDismiss = () => {
    // Store dismissal in localStorage
    const dismissedThemes = localStorage.getItem('dismissed-theme-warnings')
    const themes = dismissedThemes ? JSON.parse(dismissedThemes) : []
    if (!themes.includes(currentTheme)) {
      themes.push(currentTheme)
      localStorage.setItem('dismissed-theme-warnings', JSON.stringify(themes))
    }
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
            Theme No Longer Fully Supported
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Your current theme (<strong>{currentTheme}</strong>) is no longer fully supported.
            Featured images and some settings may not work correctly.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            We recommend switching to <strong>PaperMod</strong> or <strong>Ananke</strong> in{' '}
            <a href="/settings" className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100">
              Settings
            </a>{' '}
            for the best experience.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-300 p-1"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
