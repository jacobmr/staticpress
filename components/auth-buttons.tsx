'use client'

import { useState } from 'react'

interface AuthButtonProps {
  action: () => Promise<void>
  children: React.ReactNode
  loadingText: string
  className?: string
}

export function AuthButton({ action, children, loadingText, className }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Auth action failed:', error)
      setIsLoading(false)
    }
    // Don't set loading to false on success - we'll redirect
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isLoading}
        className={className}
      >
        {isLoading ? loadingText : children}
      </button>
    </form>
  )
}

// Pre-configured buttons for common use cases
export function SignInButton({
  action,
  variant = 'primary'
}: {
  action: () => Promise<void>
  variant?: 'primary' | 'secondary' | 'outline'
}) {
  const baseClasses = "px-8 py-4 text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait"

  const variantClasses = {
    primary: "rounded-lg bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300",
    secondary: "rounded-lg border-2 border-gray-900 text-gray-900 hover:bg-gray-100 dark:border-gray-100 dark:text-gray-100 dark:hover:bg-gray-800",
    outline: "rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
  }

  return (
    <AuthButton
      action={action}
      loadingText="Signing in..."
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {variant === 'primary' ? 'Get Started Free' :
       variant === 'secondary' ? 'Sign In' :
       'Get Started'}
    </AuthButton>
  )
}

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <AuthButton
      action={action}
      loadingText="Signing out..."
      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait"
    >
      Sign Out
    </AuthButton>
  )
}
