'use client';

import { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export default function Toolbar({ editor, disabled = false }: ToolbarProps) {
  if (!editor) return null;

  const toolGroups = [
    [
      {
        name: 'bold',
        label: 'B',
        title: 'Bold (Ctrl+B)',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive('bold'),
      },
      {
        name: 'italic',
        label: 'I',
        title: 'Italic (Ctrl+I)',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive('italic'),
      },
      {
        name: 'underline',
        label: 'U',
        title: 'Underline (Ctrl+U)',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive('underline'),
      },
    ],
    [
      {
        name: 'h1',
        label: 'H1',
        title: 'Heading 1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive('heading', { level: 1 }),
      },
      {
        name: 'h2',
        label: 'H2',
        title: 'Heading 2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive('heading', { level: 2 }),
      },
      {
        name: 'h3',
        label: 'H3',
        title: 'Heading 3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive('heading', { level: 3 }),
      },
      {
        name: 'paragraph',
        label: 'P',
        title: 'Paragraph',
        action: () => editor.chain().focus().setParagraph().run(),
        isActive: editor.isActive('paragraph') && !editor.isActive('heading'),
      },
    ],
    [
      {
        name: 'bulletList',
        label: '•',
        title: 'Bullet List',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive('bulletList'),
      },
      {
        name: 'orderedList',
        label: '1.',
        title: 'Numbered List',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive('orderedList'),
      },
    ],
    [
      {
        name: 'undo',
        label: '↶',
        title: 'Undo',
        action: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
      },
      {
        name: 'redo',
        label: '↷',
        title: 'Redo',
        action: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
      },
    ],
  ];

  return (
    <div className="bg-[var(--paper)] border-b-[1.5px] border-[var(--ink)] px-4 py-2 flex flex-wrap gap-1 overflow-x-auto">
      {toolGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="flex gap-1 items-center">
          {groupIdx > 0 && <div className="h-6 w-[1.5px] bg-[var(--ink)] mx-1" />}
          {group.map((tool) => {
            const isActive = 'isActive' in tool && tool.isActive;
            const isDisabled = disabled || ('disabled' in tool && tool.disabled);

            return (
              <button
                key={tool.name}
                onClick={tool.action}
                disabled={isDisabled}
                title={tool.title}
                aria-label={tool.title}
                className={`
                  w-8 h-8 flex items-center justify-center
                  border-[1.5px] border-[var(--ink)] rounded
                  font-semibold text-sm
                  transition-all
                  ${
                    isActive
                      ? 'bg-[var(--highlighter)] text-[var(--ink)]'
                      : 'bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--desk)]'
                  }
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer button-lift'}
                `}
              >
                {tool.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
