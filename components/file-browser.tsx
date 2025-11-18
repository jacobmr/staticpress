'use client'

import { useState } from 'react'
import { HugoPost } from '@/lib/github'
import { User } from '@/lib/db'

interface FileBrowserProps {
  posts: HugoPost[]
  selectedPost: HugoPost | null
  onSelectPost: (post: HugoPost) => void
  onNewPost: () => void
  onDeletePost: (post: HugoPost) => void
  userTier: User['subscription_tier']
}

// Extract first image URL from HTML content
function extractFirstImage(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = htmlContent.match(imgRegex)
  if (match) {
    let imageUrl = match[1]
    // Convert relative URLs to absolute URLs
    if (imageUrl.startsWith('/')) {
      imageUrl = `https://docnotes.net${imageUrl}`
    }
    return imageUrl
  }
  return null
}

export function FileBrowser({ posts, selectedPost, onSelectPost, onNewPost, onDeletePost, userTier }: FileBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteModalPost, setDeleteModalPost] = useState<HugoPost | null>(null)

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMenuToggle = (postPath: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === postPath ? null : postPath)
  }

  const handleEdit = (post: HugoPost, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onSelectPost(post)
  }

  const handleDeleteClick = (post: HugoPost, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    setDeleteModalPost(post)
  }

  const confirmDelete = () => {
    if (deleteModalPost) {
      onDeletePost(deleteModalPost)
      setDeleteModalPost(null)
    }
  }

  const cancelDelete = () => {
    setDeleteModalPost(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Posts</h2>
          <button
            onClick={onNewPost}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Post
          </button>
        </div>
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="mt-2 text-xs text-gray-500">
          Showing {filteredPosts.length} of {posts.length} posts
          {userTier === 'free' && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {' '}(Free: 5 most recent)
            </span>
          )}
        </div>
        {userTier === 'free' && posts.length === 5 && (
          <a
            href="/pricing"
            className="mt-2 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-blue-700"
          >
            Upgrade to Edit All Posts
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPosts.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {posts.length === 0 ? 'No posts found. Create your first post!' : 'No posts match your search.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredPosts.map((post) => (
              <div
                key={post.path}
                className={`relative flex items-start gap-3 px-4 py-3 transition-colors ${
                  selectedPost?.path === post.path
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {/* Thumbnail - only if post has an image */}
                {(() => {
                  const imageUrl = extractFirstImage(post.content)
                  if (imageUrl) {
                    return (
                      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )
                  }
                  return null
                })()}

                <button
                  onClick={() => onSelectPost(post)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {post.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-400">
                    {post.path}
                  </div>
                </button>

                {/* Three-dot menu */}
                <div className="relative ml-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleMenuToggle(post.path, e)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="More options"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {openMenuId === post.path && (
                    <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={(e) => handleEdit(post, e)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(post, e)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Post?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>{deleteModalPost.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Yep - I&apos;m sure
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
