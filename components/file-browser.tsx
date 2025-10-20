'use client'

import { HugoPost } from '@/lib/github'

interface FileBrowserProps {
  posts: HugoPost[]
  selectedPost: HugoPost | null
  onSelectPost: (post: HugoPost) => void
  onNewPost: () => void
}

export function FileBrowser({ posts, selectedPost, onSelectPost, onNewPost }: FileBrowserProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Posts</h2>
        <button
          onClick={onNewPost}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Post
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No posts found. Create your first post!
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {posts.map((post) => (
              <button
                key={post.path}
                onClick={() => onSelectPost(post)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedPost?.path === post.path
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {post.title}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(post.date).toLocaleDateString()}
                </div>
                <div className="mt-1 truncate text-xs text-gray-400">
                  {post.path}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
