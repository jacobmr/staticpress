'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { EditorBubbleMenu } from './editor-bubble-menu'
import { SlashCommand, suggestion } from './editor-slash-command'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  onImageUploaded?: (base64: string, hugoUrl: string) => void
}

export function Editor({ content, onChange, placeholder = 'Start writing your post...', onImageUploaded }: EditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  // Track uploaded images: base64 src → hugo URL
  const uploadedImagesRef = useRef<Map<string, string>>(new Map())

  // Handle pasting images from clipboard
  const handlePastedImage = useCallback(async (file: File) => {
    console.log('[PasteImage] Starting upload for:', file.name, file.size)
    const currentEditor = editorRef.current
    if (!currentEditor) {
      console.error('[PasteImage] No editor available!')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('[PasteImage] Not an image:', file.type)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        // Insert base64 preview immediately (works for private repos)
        currentEditor.chain().focus().setImage({ src: base64 }).run()
        console.log('[PasteImage] Base64 preview inserted')

        // Upload to GitHub in background
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name || `pasted-image-${Date.now()}.png`,
            content: base64.split(',')[1], // Remove data:image/png;base64, prefix
            contentType: file.type,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload image')
        }

        const data = await response.json()
        const { hugoUrl } = data
        console.log('[PasteImage] Upload successful, Hugo URL:', hugoUrl)

        // Store mapping for conversion when saving
        uploadedImagesRef.current.set(base64, hugoUrl)

        // Notify parent for conversion on save
        if (onImageUploaded) {
          onImageUploaded(base64, hugoUrl)
        }

        setIsUploading(false)
      }

      reader.onerror = () => {
        console.error('[PasteImage] FileReader error')
        alert('Failed to read image file')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[PasteImage] Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      setIsUploading(false)
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4 shadow-md',
        },
      }),
      BubbleMenuExtension,
      SlashCommand.configure({
        suggestion: suggestion,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert mx-auto focus:outline-none min-h-[400px] px-8 py-6 max-w-3xl',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        console.log('[Paste] Clipboard items:', items?.length || 0)
        if (!items) return false

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          console.log('[Paste] Item type:', item.type)
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            console.log('[Paste] Got image file:', file?.name, file?.size)
            if (file) {
              event.preventDefault()
              handlePastedImage(file)
              return true
            }
          }
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Keep editorRef in sync with editor for paste handler
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return

    // Get existing link URL if editing
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setShowLinkModal(true)
  }, [editor])

  const saveLink = useCallback(() => {
    if (!editor) return

    if (linkUrl === '') {
      // Remove link if URL is empty
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      // Add or update link
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }

    setShowLinkModal(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setShowLinkModal(false)
    setLinkUrl('')
  }, [editor])

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        // Insert base64 preview immediately (works for private repos)
        editor.chain().focus().setImage({ src: base64 }).run()

        // Upload to GitHub in background
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            content: base64.split(',')[1], // Remove data:image/png;base64, prefix
            contentType: file.type,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload image')
        }

        const data = await response.json()
        const { hugoUrl } = data

        // Store mapping and notify parent
        uploadedImagesRef.current.set(base64, hugoUrl)
        if (onImageUploaded) {
          onImageUploaded(base64, hugoUrl)
        }

        setIsUploading(false)
      }

      reader.onerror = () => {
        alert('Failed to read image file')
        setIsUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      setIsUploading(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [editor])

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div
      className={`flex flex-col border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 ${isFocusMode
          ? 'fixed inset-0 z-50 h-screen w-screen border-0'
          : 'rounded-md border min-h-[500px]'
        }`}
    >
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white/80 px-2 py-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bold') ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('italic') ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 2 })
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 3 })
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bulletList')
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('orderedList')
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('blockquote')
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('codeBlock')
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Divider"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={setLink}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('link')
              ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
            }`}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Upload Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${isFocusMode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
            }`}
          title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
        >
          {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Editor Content */}
      <div className={`flex-1 overflow-y-auto ${isFocusMode ? 'px-4 py-8 md:px-0' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      <EditorBubbleMenu editor={editor} />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-gray-100">
                {editor?.getAttributes('link').href ? 'Edit Link' : 'Add Link'}
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setLinkUrl('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium dark:text-gray-300">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    saveLink()
                  } else if (e.key === 'Escape') {
                    setShowLinkModal(false)
                    setLinkUrl('')
                  }
                }}
                placeholder="https://example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              {editor.isActive('link') && (
                <button
                  onClick={removeLink}
                  className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  type="button"
                >
                  Remove Link
                </button>
              )}
              <button
                onClick={saveLink}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
