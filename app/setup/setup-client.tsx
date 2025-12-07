'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthButton } from '@/components/auth-buttons'
import { signOutUser } from '@/lib/auth-actions'
import { HUGO_THEMES, DEFAULT_THEME_ID } from '@/lib/themes'

type BlogEngine = 'hugo' | 'krems'

interface Repo {
  id: number
  full_name: string
  private: boolean
}

interface DetectionResult {
  isHugoSite: boolean
  configPath?: string
  theme?: string
  themeSupported: boolean
  contentPath?: string
  baseURL?: string
  title?: string
  errors: string[]
  warnings: string[]
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
  const [detectedTheme, setDetectedTheme] = useState<string | undefined>()
  const [selectedThemeOverride, setSelectedThemeOverride] = useState<string | undefined>()

  // Detection state
  const [isDetecting, setIsDetecting] = useState(false)
  const [detection, setDetection] = useState<DetectionResult | null>(null)

  // Create new blog state
  const [blogName, setBlogName] = useState('')
  const [blogDescription, setBlogDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedEngine, setSelectedEngine] = useState<BlogEngine>('krems')
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME_ID)

  // Detect Hugo site when repo is selected
  useEffect(() => {
    if (!selectedRepo) {
      setDetection(null)
      setDetectedTheme(undefined)
      setSelectedThemeOverride(undefined)
      return
    }

    const detectSite = async () => {
      setIsDetecting(true)
      setError('')
      setDetection(null)

      try {
        const [owner, repo] = selectedRepo.split('/')
        const response = await fetch(`/api/repos/detect?owner=${owner}&repo=${repo}`)

        if (!response.ok) {
          throw new Error('Failed to detect site configuration')
        }

        const result: DetectionResult = await response.json()
        setDetection(result)

        // Update content path if detected
        if (result.contentPath) {
          setContentPath(result.contentPath)
        }

        // Update theme if detected
        if (result.theme) {
          setDetectedTheme(result.theme)
          if (!result.themeSupported) {
            // Pre-select first supported theme for override suggestion
            setSelectedThemeOverride(undefined)
          }
        }

      } catch (err) {
        console.error('Detection error:', err)
        // Non-blocking error - user can still proceed
      } finally {
        setIsDetecting(false)
      }
    }

    detectSite()
  }, [selectedRepo])

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepo) {
      setError('Please select a repository')
      return
    }

    // Warn if not a Hugo site but allow proceeding
    if (detection && !detection.isHugoSite) {
      const proceed = window.confirm(
        'This does not appear to be a Hugo site. Are you sure you want to continue?'
      )
      if (!proceed) return
    }

    setIsLoading(true)
    setError('')

    try {
      const [owner, repo] = selectedRepo.split('/')

      // Use override theme if selected, otherwise use detected theme
      const themeToUse = selectedThemeOverride || detectedTheme

      // Call server action to save repo config
      const response = await fetch('/api/repos/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          contentPath,
          engine: 'hugo',
          theme: themeToUse,
          siteUrl: detection?.baseURL,
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
          engine: selectedEngine,
          theme: selectedEngine === 'hugo' ? selectedTheme : undefined,
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
            <span className="text-xs text-gray-400">v0.9.6</span>
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

              {/* Detection Status */}
              {isDetecting && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-blue-700 dark:text-blue-300">Detecting Hugo site configuration...</span>
                  </div>
                </div>
              )}

              {/* Detection Results */}
              {detection && !isDetecting && (
                <div className={`rounded-lg border p-4 ${
                  detection.isHugoSite
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-start gap-2">
                    {detection.isHugoSite ? (
                      <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        detection.isHugoSite
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {detection.isHugoSite ? 'Hugo site detected' : 'Not a Hugo site'}
                      </p>
                      {detection.isHugoSite && (
                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {detection.title && <p>Title: <strong>{detection.title}</strong></p>}
                          {detection.theme && (
                            <p>
                              Theme: <strong>{detection.theme}</strong>
                              {detection.themeSupported ? (
                                <span className="ml-2 text-green-600">✓ Supported</span>
                              ) : (
                                <span className="ml-2 text-yellow-600">⚠ Generic profile will be used</span>
                              )}
                            </p>
                          )}
                          {detection.contentPath && <p>Content path: <strong>{detection.contentPath}</strong></p>}
                        </div>
                      )}
                      {/* Warnings */}
                      {detection.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {detection.warnings.map((warning, i) => (
                            <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400">⚠ {warning}</p>
                          ))}
                        </div>
                      )}
                      {/* Errors */}
                      {detection.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {detection.errors.map((err, i) => (
                            <p key={i} className="text-sm text-red-600 dark:text-red-400">✕ {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Theme Override (if unsupported theme detected) */}
              {detection?.theme && !detection.themeSupported && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Select Theme Profile (Optional)
                  </label>
                  <p className="mb-2 text-sm text-gray-500">
                    Your theme &quot;{detection.theme}&quot; isn&apos;t fully supported. You can use the generic profile (recommended) or select a similar supported theme.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedThemeOverride(undefined)}
                      className={`rounded-lg border p-2 text-left text-sm transition-colors ${
                        !selectedThemeOverride
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <span className="font-medium">Generic</span>
                      <span className="text-xs text-gray-500 block">Preserves all frontmatter</span>
                    </button>
                    {HUGO_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedThemeOverride(theme.id)}
                        className={`rounded-lg border p-2 text-left text-sm transition-colors ${
                          selectedThemeOverride === theme.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <span className="font-medium">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="contentPath" className="mb-2 block text-sm font-medium">
                  Content Path
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
                  {detection?.contentPath
                    ? 'Auto-detected from your Hugo config'
                    : 'The path to your Hugo posts directory'}
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

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Blog Engine
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEngine('krems')}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedEngine === 'krems'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm">Krems</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Simple, fast. Built-in Bootstrap styling.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEngine('hugo')}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedEngine === 'hugo'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm">Hugo</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Flexible themes. More customization.
                    </div>
                  </button>
                </div>
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

              {selectedEngine === 'hugo' && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Select Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {HUGO_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        selectedTheme === theme.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{theme.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {theme.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              )}

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
