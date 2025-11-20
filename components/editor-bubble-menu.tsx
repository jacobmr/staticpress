'use client'

import { BubbleMenu, BubbleMenuProps, isNodeSelection } from '@tiptap/react'
import { Editor } from '@tiptap/core'
import { Bold, Italic, Link as LinkIcon, Heading2, Heading3, Code } from 'lucide-react'
import { useCallback, useState } from 'react'

interface EditorBubbleMenuProps extends Omit<BubbleMenuProps, 'children'> {
  editor: Editor
}

export function EditorBubbleMenu({ editor, ...props }: EditorBubbleMenuProps) {
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setIsLinkOpen(true)
  }, [editor])

  const saveLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setIsLinkOpen(false)
  }, [editor, linkUrl])

  if (!editor) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      // @ts-expect-error - state type is complex from Tiptap
      shouldShow={({ from, to, state }: { from: number; to: number; state: any }) => {
        // Don't show if selection is empty or is a node selection (like an image)
        if (from === to || isNodeSelection(state.selection)) {
          return false
        }
        // Don't show if link input is open (handled by custom logic if needed, but basic check here)
        return true
      }}
      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900"
      {...props}
    >
      {isLinkOpen ? (
        <div className="flex items-center gap-2 p-1">
          <input
            type="url"
            className="h-8 w-40 rounded border border-gray-200 bg-transparent px-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:text-white"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveLink()
              if (e.key === 'Escape') setIsLinkOpen(false)
            }}
            autoFocus
          />
          <button
            onClick={saveLink}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('bold') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('italic') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={setLink}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('link') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 2 })
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('heading', { level: 3 })
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${editor.isActive('codeBlock') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Code className="h-4 w-4" />
          </button>
        </>
      )}
    </BubbleMenu>
  )
}
