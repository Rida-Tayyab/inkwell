'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';
import { useEffect } from 'react';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  readOnly?: boolean;
}

export default function RichEditor({ content, onChange, readOnly = false }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: readOnly ? '' : 'Untitled (give it a name)',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose-ink focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  return (
    <div className="flex flex-col h-full bg-[var(--desk)]">
      {!readOnly && editor && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-auto flex justify-center py-8 px-4">
        <div className="w-full max-w-[760px] bg-[var(--paper)] border-[1.5px] border-[var(--ink)] shadow-hard">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

