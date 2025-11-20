'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OnboardingWizardProps {
  repoOwner: string
  repoName: string
  userName: string
}

type Platform = 'github-pages' | 'cloudflare' | 'vercel' | 'netlify' | null

export function OnboardingWizard({ repoOwner, repoName, userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null)

  const totalSteps = 4

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
            {[1, 2, 3, 4].map((step) => (
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
                {step < 4 && (
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
            <span>Created</span>
            <span>Platform</span>
            <span>Deploy</span>
            <span>Complete</span>
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
              <p className="mb-8 text-gray-600 dark:text-gray-400">
                Next, let&apos;s get your blog live on the internet!
              </p>
              <button
                onClick={handleNext}
                className="rounded-md bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700"
              >
                Choose Hosting Platform
              </button>
            </div>
          )}

          {/* Step 2: Choose Platform */}
          {currentStep === 2 && (
            <div>
              <h2 className="mb-4 text-center text-3xl font-bold">Choose Your Hosting</h2>
              <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Select where you&apos;d like to host your blog. All options are free!
              </p>

              <div className="space-y-4">
                {/* GitHub Pages */}
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
                        Free hosting from GitHub. Easiest setup.
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      Recommended
                    </span>
                  </div>
                </button>

                {/* Cloudflare */}
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
                    Fast global CDN. Great for custom domains.
                  </p>
                </button>

                {/* Vercel */}
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
                    Zero-config deployments. Great developer experience.
                  </p>
                </button>

                {/* Netlify */}
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
                    Popular choice with forms and functions.
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

          {/* Step 3: Deploy Instructions */}
          {currentStep === 3 && (
            <div>
              <h2 className="mb-4 text-center text-3xl font-bold">Set Up Deployment</h2>
              <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Follow these steps to deploy your blog
              </p>

              {selectedPlatform === 'github-pages' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-4 text-xl font-semibold">GitHub Pages Setup</h3>
                  <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a
                        href={`https://github.com/${repoOwner}/${repoName}/settings/pages`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Click here to open Pages settings
                      </a>
                    </li>
                    <li>Under <strong>Build and deployment</strong>, set Source to <strong>GitHub Actions</strong></li>
                    <li>Wait 1-2 minutes for the first build</li>
                    <li>
                      Your blog will be live at:{' '}
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                        {repoOwner}.github.io/{repoName}
                      </code>
                    </li>
                  </ol>
                  <a
                    href={`https://github.com/${repoOwner}/${repoName}/settings/pages`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Open GitHub Pages Settings
                  </a>
                </div>
              )}

              {selectedPlatform === 'cloudflare' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-4 text-xl font-semibold">Cloudflare Pages Setup</h3>
                  <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a
                        href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Click here to go to Cloudflare Pages
                      </a>
                    </li>
                    <li>Connect your GitHub account if prompted</li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Set Framework preset to <strong>Hugo</strong></li>
                    <li>Click <strong>Save and Deploy</strong></li>
                  </ol>
                  <a
                    href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Open Cloudflare Pages
                  </a>
                </div>
              )}

              {selectedPlatform === 'vercel' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-4 text-xl font-semibold">Vercel Setup</h3>
                  <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a
                        href="https://vercel.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Click here to go to Vercel
                      </a>
                    </li>
                    <li>Sign in with GitHub</li>
                    <li>Click <strong>Import Project</strong></li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Vercel auto-detects Hugo - click <strong>Deploy</strong></li>
                  </ol>
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Open Vercel
                  </a>
                </div>
              )}

              {selectedPlatform === 'netlify' && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="mb-4 text-xl font-semibold">Netlify Setup</h3>
                  <ol className="mb-6 list-decimal space-y-4 pl-6 text-gray-600 dark:text-gray-400">
                    <li>
                      <a
                        href="https://app.netlify.com/start"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Click here to go to Netlify
                      </a>
                    </li>
                    <li>Connect your GitHub account</li>
                    <li>Select repository: <strong>{repoOwner}/{repoName}</strong></li>
                    <li>Build command: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">hugo</code></li>
                    <li>Publish directory: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">public</code></li>
                    <li>Click <strong>Deploy site</strong></li>
                  </ol>
                  <a
                    href="https://app.netlify.com/start"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Open Netlify
                  </a>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
                >
                  I&apos;ve Set Up Deployment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mb-4 text-3xl font-bold">You&apos;re All Set!</h2>
              <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
                Your blog is ready. Time to start writing!
              </p>

              <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 text-left dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 font-semibold">What&apos;s Next?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Write and publish your first post
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Customize your hugo.toml for theme and settings
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Set up a custom domain (optional)
                  </li>
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
