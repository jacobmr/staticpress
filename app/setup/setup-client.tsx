'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthButton } from '@/components/auth-buttons'
import { signOutUser } from '@/lib/auth-actions'

interface Repo {
  id: number
  full_name: string
  private: boolean
}

interface SetupClientProps {
  repos: Repo[]
  userId: string
  userEmail: string
  userName?: string | null
  userImage?: string | null
}

export function SetupClient({ repos, userId, userEmail, userName, userImage }: SetupClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'connect' | 'create'>('connect')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Connect existing repo state
  const [selectedRepo, setSelectedRepo] = useState('')
  const [contentPath, setContentPath] = useState('content/posts')

  // Create new blog state
  const [blogName, setBlogName] = useState('')
  const [blogDescription, setBlogDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepo) {
      setError('Please select a repository')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const [owner, repo] = selectedRepo.split('/')

      // Call server action to save repo config
      const response = await fetch('/api/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          contentPath,
          userId,
          userEmail,
          userName,
          userImage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect repository')
      }

      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect repository')
      setIsLoading(false)
    }
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blogName.trim()) {
      setError('Please enter a blog name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/repos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogName: blogName.trim(),
          description: blogDescription.trim(),
          isPrivate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create blog')
      }

      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blog')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with logout */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h2 className="text-xl font-semibold">Setup</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">v0.9.2</span>
            <AuthButton
              action={signOutUser}
              loadingText="Signing out..."
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-wait"
            >
              Sign Out
            </AuthButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2 text-4xl font-bold">Welcome to StaticPress</h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Get started with your Hugo blog
          </p>

          {/* Tab Buttons */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'connect'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Connect Existing Blog
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Create New Blog
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Connect Existing Tab */}
          {activeTab === 'connect' && (
            <form onSubmit={handleConnectRepo} className="space-y-6">
              <div>
                <label htmlFor="repo" className="mb-2 block text-sm font-medium">
                  Select Repository
                </label>
                <select
                  id="repo"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Choose a repository...</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                      {repo.private && ' (Private)'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Select the GitHub repository containing your Hugo blog
                </p>
              </div>

              <div>
                <label htmlFor="contentPath" className="mb-2 block text-sm font-medium">
                  Content Path (optional)
                </label>
                <input
                  type="text"
                  id="contentPath"
                  value={contentPath}
                  onChange={(e) => setContentPath(e.target.value)}
                  placeholder="content/posts"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The path to your Hugo posts directory (default: content/posts)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? 'Connecting...' : 'Connect Repository'}
              </button>
            </form>
          )}

          {/* Create New Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateBlog} className="space-y-6">
              <div>
                <label htmlFor="blogName" className="mb-2 block text-sm font-medium">
                  Blog Name
                </label>
                <input
                  type="text"
                  id="blogName"
                  value={blogName}
                  onChange={(e) => setBlogName(e.target.value)}
                  placeholder="My Awesome Blog"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This will be the title of your blog and repository name
                </p>
              </div>

              <div>
                <label htmlFor="blogDescription" className="mb-2 block text-sm font-medium">
                  Description (optional)
                </label>
                <input
                  type="text"
                  id="blogDescription"
                  value={blogDescription}
                  onChange={(e) => setBlogDescription(e.target.value)}
                  placeholder="A blog about..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-600 dark:text-gray-400">
                  Make repository private
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? 'Creating...' : 'Create Blog'}
              </button>
            </form>
          )}

          {/* Info Box */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            {activeTab === 'connect' ? (
              <>
                <h3 className="mb-2 font-semibold">What happens next?</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• StaticPress will read your existing Hugo posts</li>
                  <li>• You can create new posts or edit existing ones</li>
                  <li>• Changes are committed directly to your repository</li>
                  <li>• Your Hugo site will rebuild automatically</li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="mb-2 font-semibold">What you&apos;ll get</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• A new GitHub repository with Hugo pre-configured</li>
                  <li>• GitHub Actions workflow for automatic deployment</li>
                  <li>• A welcome post to get you started</li>
                  <li>• Ready for deployment to Cloudflare, Vercel, or Netlify</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
