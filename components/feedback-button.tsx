
'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message }),
            })

            if (response.ok) {
                setSent(true)
                setTimeout(() => {
                    setIsOpen(false)
                    setSent(false)
                    setMessage('')
                }, 2000)
            } else {
                alert('Failed to send feedback. Please try again.')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                title="Send Feedback"
            >
                <MessageSquare className="h-6 w-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center sm:p-0">
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-gray-800 sm:m-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Send Feedback</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {sent ? (
                            <div className="flex h-40 flex-col items-center justify-center text-center text-green-600 dark:text-green-400">
                                <svg className="mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="font-medium">Thank you for your feedback!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Type
                                    </label>
                                    <div className="flex gap-2">
                                        {(['bug', 'feature', 'other'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize focus:outline-none ${type === t
                                                        ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        placeholder="Tell us what you think..."
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
                                    >
                                        {isSending ? 'Sending...' : 'Send Feedback'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
