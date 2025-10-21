'use client'

import { useState } from 'react'
import { Editor } from './editor'
import { FileBrowser } from './file-browser'
import { HugoPost } from '@/lib/github'
import { User } from '@/lib/db'

interface DashboardClientProps {
  initialPosts: HugoPost[]
  repoOwner: string
  repoName: string
  userTier: User['subscription_tier']
}

export function DashboardClient({ initialPosts, userTier }: DashboardClientProps) {
  const [posts, setPosts] = useState<HugoPost[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<HugoPost | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSelectPost = (post: HugoPost) => {
    setSelectedPost(post)
    setTitle(post.title)
    setContent(post.content)
    setSaveMessage('')
  }

  const handleNewPost = () => {
    setSelectedPost(null)
    setTitle('')
    setContent('')
    setSaveMessage('')
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      setSaveMessage('Please enter a title')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          path: selectedPost?.path,
          draft: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish post')
      }

      const result = await response.json()
      setSaveMessage(`✓ Published: ${result.path}`)

      const newPath: string = result.path
      const newPost: HugoPost = {
        title,
        date: new Date().toISOString(),
        slug: newPath.split('/').pop()?.replace(/\.(md|markdown)$/,'') || title,
        content,
        path: newPath,
      }

      setPosts((prev) => {
        if (selectedPost) {
          return prev.map((p) => (p.path === selectedPost.path ? newPost : p))
        }
        return [newPost, ...prev]
      })
    } catch (error) {
      setSaveMessage('Error publishing post')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setSaveMessage('Please enter a title')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          path: selectedPost?.path,
          draft: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const result = await response.json()
      setSaveMessage(`✓ Draft saved: ${result.path}`)

      const newPath: string = result.path
      const newPost: HugoPost = {
        title,
        date: new Date().toISOString(),
        slug: newPath.split('/').pop()?.replace(/\.(md|markdown)$/,'') || title,
        content,
        path: newPath,
      }

      setPosts((prev) => {
        if (selectedPost) {
          return prev.map((p) => (p.path === selectedPost.path ? newPost : p))
        }
        return [newPost, ...prev]
      })
    } catch (error) {
      setSaveMessage('Error saving draft')
      console.error(error)
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
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-3xl font-bold">
            {selectedPost ? 'Edit Post' : 'New Post'}
          </h2>

          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Enter post title..."
              />
            </div>

            {/* Content Editor */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium">
                Content
              </label>
              <Editor
                content={content}
                onChange={setContent}
                placeholder="Start writing your post..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Publishing...' : 'Publish'}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              {saveMessage && (
                <span className={`text-sm ${saveMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
