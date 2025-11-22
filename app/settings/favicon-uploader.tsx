'use client'

import { useState, useRef } from 'react'

interface FaviconUploaderProps {
    repoOwner: string
    repoName: string
}

export function FaviconUploader({ repoOwner, repoName }: FaviconUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [message, setMessage] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setMessage('')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('owner', repoOwner)
        formData.append('repo', repoName)

        try {
            const response = await fetch('/api/settings/favicon', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            setMessage('✓ Favicon updated successfully')
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (error) {
            console.error(error)
            setMessage('Error uploading favicon')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Favicon</h2>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload a favicon.ico or .png to be used as your site icon.
                </p>
                <div className="flex items-center gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ico,.png"
                        onChange={handleUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                    />
                    {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {message && (
                    <p className={`text-sm ${message.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
