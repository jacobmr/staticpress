'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface PublishModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isDraft?: boolean
    currentTitle: string
}

export function PublishModal({ isOpen, onClose, onConfirm, isDraft = false, currentTitle }: PublishModalProps) {
    const [showSuccess, setShowSuccess] = useState(false)

    if (!isOpen) return null

    const handleConfirm = () => {
        setShowSuccess(true)
        setTimeout(() => {
            onConfirm()
            setShowSuccess(false)
            onClose()
        }, 1500)
    }

    const title = currentTitle.trim() || 'Untitled'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isDraft ? 'Draft Saved!' : 'Published!'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Your post is {isDraft ? 'saved as a draft' : 'live now'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {isDraft ? 'Save Draft?' : 'Ready to Publish?'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {isDraft
                                        ? 'Your draft will be saved privately'
                                        : 'Your post will be visible to everyone'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</span>
                                {!currentTitle.trim() && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">Will default to &ldquo;Untitled&rdquo;</span>
                                )}
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                        </div>

                        {!isDraft && (
                            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800">
                                        <svg className="h-3 w-3 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Publishing to GitHub</p>
                                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                            Your post will be committed to your repository and deployed automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {isDraft ? 'Save Draft' : 'Publish Now'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
