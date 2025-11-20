'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OnboardingWizardProps {
  repoOwner: string
  repoName: string
  userName: string
  engine?: 'hugo' | 'krems'
}

type Platform = 'github-pages' | 'cloudflare' | 'vercel' | 'netlify' | null

export function OnboardingWizard({ repoOwner, repoName, userName, engine = 'hugo' }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null)
  const [customDomain, setCustomDomain] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [manualSiteUrl, setManualSiteUrl] = useState('')

  // Krems uses 2 steps (auto-deploy), Hugo uses 4 steps
  const totalSteps = engine === 'krems' ? 2 : 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const handleDeployGitHubPages = async () => {
    setIsDeploying(true)
    setDeployError('')

    try {
      const response = await fetch('/api/deploy/github-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: customDomain.trim() || null }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy')
      }

      setSiteUrl(data.url)
      handleNext()
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : 'Deployment failed')
    } finally {
      setIsDeploying(false)
    }
  }

  const handleManualDeployComplete = async () => {
    if (!manualSiteUrl.trim()) {
      setDeployError('Please enter your site URL')
      return
    }

    setIsDeploying(true)
    setDeployError('')

    try {
      const response = await fetch('/api/repos/site-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: manualSiteUrl.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save site URL')
      }

      setSiteUrl(data.url)
      handleNext()
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : 'Failed to save site URL')
    } finally {
      setIsDeploying(false)
    }
  }

  // Check if domain is apex (example.com) vs subdomain (blog.example.com)
  const isApexDomain = customDomain && !customDomain.includes('.') ||
    (customDomain.match(/\./g) || []).length === 1

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">StaticPress</h1>
          <span className="text-sm text-gray-500">Setup Wizard</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                  }`}
                >
                  {step < currentStep ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {step < totalSteps && (
                  <div
                    className={`mx-2 h-1 w-16 sm:w-24 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            {engine === 'krems' ? (
              <>
                <span>Created</span>
                <span>Complete</span>
              </>
            ) : (
              <>
                <span>Created</span>
                <span>Platform</span>
                <span>Deploy</span>
                <span>Complete</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          {/* Step 1: Repository Created */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-4 text-3xl font-bold">Repository Created!</h2>
              <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
                Welcome, {userName}! Your blog repository is ready.
              </p>
              <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500">Repository</p>
                <p className="text-lg font-semibold">{repoOwner}/{repoName}</p>
                <a
                  href={`https://github.com/${repoOwner}/${repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                >
                  View on GitHub
                </a>
              </div>

              {engine === 'krems' ? (
                <>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Your blog will be automatically deployed to GitHub Pages!
                  </p>
                  {deployError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {deployError}
                    </div>
                  )}
                  <button
                    onClick={handleDeployGitHubPages}
                    disabled={isDeploying}
                    className="rounded-md bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deploying...
                      </span>
                    ) : (
                      'Deploy to GitHub Pages'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-8 text-gray-600 dark:text-gray-400">
                    Next, let&apos;s get your blog live on the internet!
                  </p>
                  <button
                    onClick={handleNext}
                    className="rounded-md bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    Choose Hosting Platform
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Choose Platform (Hugo only) */}
          {currentStep === 2 && engine === 'hugo' && (
            <div>
              <h2 className="mb-4 text-center text-3xl font-bold">Choose Your Hosting</h2>
              <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Select where you&apos;d like to host your blog. All options are free!
              </p>

              <div className="space-y-4">
                {/* GitHub Pages - Auto-deploy */}
                <button
                  onClick={() => setSelectedPlatform('github-pages')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPlatform === 'github-pages'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">GitHub Pages</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Free hosting from GitHub. One-click setup!
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      Auto-deploy
                    </span>
                  </div>
                </button>

                {/* Other platforms - Manual */}
                <button
                  onClick={() => setSelectedPlatform('cloudflare')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPlatform === 'cloudflare'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold">Cloudflare Pages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fast global CDN. Manual setup required.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedPlatform('vercel')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPlatform === 'vercel'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold">Vercel</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Zero-config deployments. Manual setup required.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedPlatform('netlify')}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    selectedPlatform === 'netlify'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                  }`}
                >
                  <h3 className="font-semibold">Netlify</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Popular choice. Manual setup required.
                  </p>
                </button>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedPlatform}
                  className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Deploy (Hugo only) */}
          {currentStep === 3 && engine === 'hugo' && (
            <div>
              <h2 className="mb-4 text-center text-3xl font-bold">
                {selectedPlatform === 'github-pages' ? 'Deploy to GitHub Pages' : 'Set Up Deployment'}
              </h2>

              {/* GitHub Pages - Auto deploy */}
              {selectedPlatform === 'github-pages' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-6">
                    <label htmlFor="customDomain" className="mb-2 block text-sm font-medium">
                      Custom Domain (optional)
                    </label>
                    <input
                      type="text"
                      id="customDomain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="blog.example.com"
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to use {repoOwner}.github.io/{repoName}
                    </p>
                  </div>

                  {customDomain && (
                    <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                      <h4 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
                        DNS Configuration Required
                      </h4>
                      <p className="mb-3 text-sm text-yellow-700 dark:text-yellow-300">
                        Add these records at your domain registrar:
                      </p>
                      {isApexDomain ? (
                        <div className="space-y-2 text-sm">
                          <code className="block rounded bg-yellow-100 p-2 dark:bg-yellow-900">
                            A @ 185.199.108.153
                          </code>
                          <code className="block rounded bg-yellow-100 p-2 dark:bg-yellow-900">
                            A @ 185.199.109.153
                          </code>
                          <code className="block rounded bg-yellow-100 p-2 dark:bg-yellow-900">
                            A @ 185.199.110.153
                          </code>
                          <code className="block rounded bg-yellow-100 p-2 dark:bg-yellow-900">
                            A @ 185.199.111.153
                          </code>
                        </div>
                      ) : (
                        <code className="block rounded bg-yellow-100 p-2 text-sm dark:bg-yellow-900">
                          CNAME {customDomain.split('.')[0]} {repoOwner}.github.io
                        </code>
                      )}
                      <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        DNS propagation can take 1-24 hours
                      </p>
                    </div>
                  )}

                  {deployError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {deployError}
                    </div>
                  )}

                  <button
                    onClick={handleDeployGitHubPages}
                    disabled={isDeploying}
                    className="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deploying...
                      </span>
                    ) : (
                      'Deploy to GitHub Pages'
                    )}
                  </button>
                </div>
              )}

              {/* Other platforms - Manual instructions */}
              {selectedPlatform === 'cloudflare' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Go to Cloudflare Pages
                      </a>
                    </li>
                    <li>Connect your GitHub account</li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Set Framework preset to <strong>Hugo</strong></li>
                    <li>Click <strong>Save and Deploy</strong></li>
                  </ol>
                  <div className="mb-4">
                    <label htmlFor="cloudflareUrl" className="mb-2 block text-sm font-medium">
                      Your Cloudflare Pages URL
                    </label>
                    <input
                      type="text"
                      id="cloudflareUrl"
                      value={manualSiteUrl}
                      onChange={(e) => setManualSiteUrl(e.target.value)}
                      placeholder="your-project.pages.dev"
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Find this in your Cloudflare dashboard after deployment
                    </p>
                  </div>
                  {deployError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {deployError}
                    </div>
                  )}
                  <button
                    onClick={handleManualDeployComplete}
                    disabled={isDeploying}
                    className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDeploying ? 'Saving...' : 'I\'ve Set Up Deployment'}
                  </button>
                </div>
              )}

              {selectedPlatform === 'vercel' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Go to Vercel
                      </a>
                    </li>
                    <li>Sign in with GitHub</li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Click <strong>Deploy</strong></li>
                  </ol>
                  <div className="mb-4">
                    <label htmlFor="vercelUrl" className="mb-2 block text-sm font-medium">
                      Your Vercel URL
                    </label>
                    <input
                      type="text"
                      id="vercelUrl"
                      value={manualSiteUrl}
                      onChange={(e) => setManualSiteUrl(e.target.value)}
                      placeholder="your-project.vercel.app"
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Find this in your Vercel dashboard after deployment
                    </p>
                  </div>
                  {deployError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {deployError}
                    </div>
                  )}
                  <button
                    onClick={handleManualDeployComplete}
                    disabled={isDeploying}
                    className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDeploying ? 'Saving...' : 'I\'ve Set Up Deployment'}
                  </button>
                </div>
              )}

              {selectedPlatform === 'netlify' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <ol className="mb-6 list-decimal space-y-3 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a href="https://app.netlify.com/start" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Go to Netlify
                      </a>
                    </li>
                    <li>Connect your GitHub account</li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Build command: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">hugo</code></li>
                    <li>Publish directory: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public</code></li>
                  </ol>
                  <div className="mb-4">
                    <label htmlFor="netlifyUrl" className="mb-2 block text-sm font-medium">
                      Your Netlify URL
                    </label>
                    <input
                      type="text"
                      id="netlifyUrl"
                      value={manualSiteUrl}
                      onChange={(e) => setManualSiteUrl(e.target.value)}
                      placeholder="your-site.netlify.app"
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Find this in your Netlify dashboard after deployment
                    </p>
                  </div>
                  {deployError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {deployError}
                    </div>
                  )}
                  <button
                    onClick={handleManualDeployComplete}
                    disabled={isDeploying}
                    className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isDeploying ? 'Saving...' : 'I\'ve Set Up Deployment'}
                  </button>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  &larr; Back to platform selection
                </button>
              </div>
            </div>
          )}

          {/* Final Step: Complete */}
          {currentStep === totalSteps && (
            <div className="text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mb-4 text-3xl font-bold">You&apos;re All Set!</h2>

              {siteUrl && (
                <div className="mb-6">
                  <p className="mb-2 text-gray-600 dark:text-gray-400">Your blog is deploying to:</p>
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {siteUrl}
                  </a>
                  <p className="mt-2 text-sm text-gray-500">
                    First deployment takes 1-2 minutes
                  </p>
                </div>
              )}

              <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 text-left dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 font-semibold">What&apos;s Next?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Write and publish your first post
                  </li>
                  {engine === 'hugo' && (
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Customize your hugo.toml for theme and settings
                    </li>
                  )}
                  {engine === 'krems' && (
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Edit config.yaml to customize your blog title
                    </li>
                  )}
                  {!customDomain && (
                    <li className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Set up a custom domain (optional)
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={handleComplete}
                className="rounded-md bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
              >
                Go to Dashboard
              </button>

              <p className="mt-4 text-sm text-gray-500">
                Need help?{' '}
                <Link href="/help" className="text-blue-600 hover:underline">
                  View documentation
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
