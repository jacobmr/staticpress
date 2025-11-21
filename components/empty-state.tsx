
import Link from 'next/link'
import { FileText, BookOpen, ArrowRight } from 'lucide-react'

interface EmptyStateProps {
    onCreatePost: () => void
}

export function EmptyState({ onCreatePost }: EmptyStateProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-8 rounded-full bg-blue-50 p-8 dark:bg-blue-900/20">
                <FileText className="h-16 w-16 text-blue-500 dark:text-blue-400" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Write your first post
            </h2>

            <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
                Your blog is ready to go! Create your first post to share your thoughts with the world.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
                <button
                    onClick={onCreatePost}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    <FileText className="h-5 w-5" />
                    Create New Post
                </button>

                <Link
                    href="/help"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
                >
                    <BookOpen className="h-5 w-5" />
                    View Setup Guide
                </Link>
            </div>

            <div className="mt-12 border-t border-gray-100 pt-8 dark:border-gray-800">
                <p className="text-sm text-gray-400">
                    Need inspiration? <a href="#" className="text-blue-500 hover:underline">Read our writing tips</a>
                </p>
            </div>
        </div>
    )
}
