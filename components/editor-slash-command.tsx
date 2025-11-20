'use client'

import { Extension, Range, Editor } from '@tiptap/core'
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, GetReferenceClientRect } from 'tippy.js'
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Image as ImageIcon,
    Code,
    Quote,
    Minus,
} from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

interface CommandItemProps {
    title: string
    description: string
    icon: React.ReactNode
    command: (props: { editor: Editor; range: Range }) => void
}

interface CommandListProps {
    items: CommandItemProps[]
    command: (item: CommandItemProps) => void
    editor: Editor
}

// 1. Command List Component (The Menu UI)
export const CommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }
            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }
            if (event.key === 'Enter') {
                enterHandler()
                return true
            }
            return false
        },
    }))

    return (
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-gray-200 bg-white px-1 py-2 shadow-md transition-all dark:border-gray-800 dark:bg-gray-900">
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 ${index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                            {item.icon}
                        </div>
                        <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No result</div>
            )}
        </div>
    )
})

CommandList.displayName = 'CommandList'

// 2. Suggestion Configuration
const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: 'Heading 1',
            description: 'Big section heading.',
            icon: <Heading1 className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading.',
            icon: <Heading2 className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading.',
            icon: <Heading3 className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
            },
        },
        {
            title: 'Bullet List',
            description: 'Create a simple bullet list.',
            icon: <List className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: 'Numbered List',
            description: 'Create a list with numbering.',
            icon: <ListOrdered className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },
        {
            title: 'Image',
            description: 'Upload an image from your computer.',
            icon: <ImageIcon className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).run()
                // Trigger the file input click via a custom event or DOM manipulation
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                if (fileInput) {
                    fileInput.click()
                }
            },
        },
        {
            title: 'Blockquote',
            description: 'Capture a quote.',
            icon: <Quote className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run()
            },
        },
        {
            title: 'Code Block',
            description: 'Capture a code snippet.',
            icon: <Code className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
            },
        },
        {
            title: 'Divider',
            description: 'Visually separate content.',
            icon: <Minus className="h-4 w-4" />,
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run()
            },
        },
    ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
}

const renderItems = () => {
    let component: ReactRenderer | null = null
    let popup: Instance[] | null = null

    return {
        onStart: (props: SuggestionProps) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            })

            if (!props.clientRect) {
                return
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect as GetReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            })
        },

        onUpdate: (props: SuggestionProps) => {
            component?.updateProps(props)

            if (!props.clientRect) {
                return
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect as GetReferenceClientRect,
            })
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') {
                popup?.[0].hide()
                return true
            }

            // @ts-expect-error - ref type is complex
            return component?.ref?.onKeyDown(props)
        },

        onExit: () => {
            popup?.[0].destroy()
            component?.destroy()
        },
    }
}

// 3. The Extension
export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                // @ts-expect-error - props type is complex
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})

export const suggestion = {
    items: getSuggestionItems,
    render: renderItems,
}
