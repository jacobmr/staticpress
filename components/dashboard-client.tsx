'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import { Editor } from './editor'
import { FileBrowser } from './file-browser'
import { EmptyState } from './empty-state'
import { PublishModal } from './publish-modal'
import { HugoPost } from '@/lib/github'
import { User } from '@/lib/db'
import { setCachedPosts, clearCachedPosts } from '@/lib/client-cache'

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface DashboardClientProps {
  initialPosts: HugoPost[]
  repoOwner: string
  repoName: string
  userTier: User['subscription_tier']
  hasMorePosts?: boolean
  engine?: 'hugo' | 'krems'
}

export function DashboardClient({ initialPosts, repoOwner, repoName, userTier, hasMorePosts = false, engine = 'hugo' }: DashboardClientProps) {
  const repoKey = `${repoOwner}/${repoName}`
  const [posts, setPosts] = useState<HugoPost[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<HugoPost | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(initialPosts.length === 0)

  // Track uploaded images: base64 → hugo URL
  const uploadedImagesRef = useRef<Map<string, string>>(new Map())

  // Callback for when editor uploads an image
  const handleImageUploaded = useCallback((base64: string, hugoUrl: string) => {
    uploadedImagesRef.current.set(base64, hugoUrl)
    console.log('[Dashboard] Image uploaded, mapped base64 to:', hugoUrl)
  }, [])

  // Fetch remaining posts in background after initial render
  useEffect(() => {
    if (!hasMorePosts) return

    const fetchRemainingPosts = async () => {
      try {
        const response = await fetch(`/api/posts?offset=${initialPosts.length}`)
        if (response.ok) {
          const data = await response.json()
          // Merge with initial posts, avoiding duplicates
          setPosts(prev => {
            const existingPaths = new Set(prev.map(p => p.path))
            const newPosts = data.posts.filter((p: HugoPost) => !existingPaths.has(p.path))
            return [...prev, ...newPosts]
          })
        }
      } catch (error) {
        console.error('Error fetching remaining posts:', error)
      }
    }

    fetchRemainingPosts()
  }, [hasMorePosts, initialPosts.length])

  // Save posts to localStorage cache whenever they change
  useEffect(() => {
    setCachedPosts(repoKey, posts)
  }, [posts, repoKey])

  // Transform relative image URLs to absolute URLs for display in editor
  const transformImageUrls = (content: string): string => {
    // Convert relative URLs to absolute URLs using docnotes.com
    // TODO: Make this configurable per user/repo
    return content.replace(
      /(<img[^>]+src=["'])(\/)([^"']+)(["'])/gi,
      '$1https://docnotes.com/$3$4'
    )
  }

  // Reverse transformation: convert absolute URLs back to relative for saving
  const reverseTransformImageUrls = (content: string): string => {
    let result = content

    // First, convert base64 images to their hugo URLs
    uploadedImagesRef.current.forEach((hugoUrl, base64) => {
      // Need to escape special regex characters in base64
      const escapedBase64 = base64.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      result = result.replace(new RegExp(escapedBase64, 'g'), hugoUrl)
    })

    // Then, convert GitHub raw URLs back to relative URLs
    // Pattern: https://raw.githubusercontent.com/{owner}/{repo}/main/static/images/...
    result = result.replace(
      /(<img[^>]+src=["'])https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/static(\/images\/[^"']+)(["'])/gi,
      '$1$2$3'
    )

    // Finally, convert docnotes.com URLs back to relative URLs
    result = result.replace(
      /(<img[^>]+src=["'])https:\/\/docnotes\.com\/([^"']+)(["'])/gi,
      '$1/$2$3'
    )

    return result
  }

  const handleSelectPost = (post: HugoPost) => {
    setSelectedPost(post)
    setTitle(post.title)
    // Convert markdown to HTML for TipTap editor
    const htmlContent = marked.parse(post.content) as string
    setContent(transformImageUrls(htmlContent))

    setSaveMessage('')
    setShowEmptyState(false)
  }

  const handleNewPost = () => {
    setSelectedPost(null)
    setTitle('')
    setContent('')

    setSaveMessage('')
    setShowEmptyState(false)
  }

  const handlePublish = async () => {
    const postTitle = title.trim() || 'Untitled Post'

    setIsSaving(true)
    setSaveMessage('')
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postTitle,
          content: reverseTransformImageUrls(content),
          path: selectedPost?.path,
          draft: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      const result = await response.json()
      setSaveMessage(`✓ Published: ${result.path}`)
      setSaveStatus('saved')

      // Clear both server and client caches to force refresh on next load
      await fetch('/api/cache/clear', { method: 'POST' })
      clearCachedPosts(repoKey)

      const newPath: string = result.path
      const newPost: HugoPost = {
        title: postTitle,
        date: new Date().toISOString(),
        slug: newPath.split('/').pop()?.replace(/\.(md|markdown)$/, '') || postTitle,
        content,
        path: newPath,
      }

      setPosts((prev) => {
        if (selectedPost) {
          return prev.map((p) => (p.path === selectedPost.path ? newPost : p))
        }
        return [newPost, ...prev]
      })

      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveMessage('Error publishing post')
      setSaveStatus('error')
      console.error(error)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    const postTitle = title.trim() || 'Untitled Draft'

    setIsSaving(true)
    setSaveMessage('')
    setSaveStatus('saving')

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postTitle,
          content: reverseTransformImageUrls(content),
          path: selectedPost?.path,
          draft: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const result = await response.json()
      setSaveMessage(`✓ Draft saved: ${result.path}`)
      setSaveStatus('saved')

      // Clear both server and client caches to force refresh on next load
      await fetch('/api/cache/clear', { method: 'POST' })
      clearCachedPosts(repoKey)

      const newPath: string = result.path
      const newPost: HugoPost = {
        title: postTitle,
        date: new Date().toISOString(),
        slug: newPath.split('/').pop()?.replace(/\.(md|markdown)$/, '') || postTitle,
        content,
        path: newPath,
      }

      setPosts((prev) => {
        if (selectedPost) {
          return prev.map((p) => (p.path === selectedPost.path ? newPost : p))
        }
        return [newPost, ...prev]
      })

      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveMessage('Error saving draft')
      setSaveStatus('error')
      console.error(error)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePost = async (post: HugoPost) => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: post.path,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setSaveMessage(`✓ Deleted: ${post.title}`)

      // Clear both server and client caches to force refresh on next load
      await fetch('/api/cache/clear', { method: 'POST' })
      clearCachedPosts(repoKey)

      // Remove post from list
      setPosts((prev) => {
        const newPosts = prev.filter((p) => p.path !== post.path)
        if (newPosts.length === 0) {
          setShowEmptyState(true)
        }
        return newPosts
      })

      // Clear editor if deleted post was selected
      if (selectedPost?.path === post.path) {
        setSelectedPost(null)
        setTitle('')
        setContent('')
      }

    } catch (error) {
      setSaveMessage('Error deleting post')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1">
      {/* Sidebar - File Browser */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <FileBrowser
          posts={posts}
          selectedPost={selectedPost}
          onSelectPost={handleSelectPost}
          onNewPost={handleNewPost}
          onDeletePost={handleDeletePost}
          userTier={userTier}
        />
      </aside>

      {/* Editor Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {showEmptyState ? (
          <EmptyState onCreatePost={handleNewPost} />
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-none bg-transparent px-0 text-5xl font-bold placeholder-gray-300 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-600"
                  placeholder="Untitled"
                />
              </div>

              {/* Content Editor */}
              <div className="mt-2">
                <Editor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your post..."
                  onImageUploaded={handleImageUploaded}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Publishing...' : 'Publish'}
                </button>
                {engine === 'hugo' && (
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                )}

                {/* Enhanced Save Status Indicator */}
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Error</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
