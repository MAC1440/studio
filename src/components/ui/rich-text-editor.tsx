
'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
} from 'lucide-react';
import { Button } from './button';

type RichTextEditorProps = {
  content: string;
  onChange: (richText: string) => void;
  editable: boolean;
};

export default function RichTextEditor({ content, onChange, editable }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-3 focus:outline-none flex-1 w-full',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      if (editor.isEditable !== editable) {
        editor.setEditable(editable);
      }
      if (content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editable, editor]);

  useEffect(() => {
    if (!editor) return;
    return () => {
      editor.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div className="flex-1" />;
  }

  return (
    <div className="relative flex-1 flex flex-col border border-input rounded-md overflow-y-auto">
      {editable && (
        <FloatingMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ state }) => {
            const { from, to } = state.selection;
            return from !== to;
          }}
          className="flex items-center gap-1 bg-card p-1 rounded-md border shadow-md"
        >
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} className="flex-1 flex flex-col" />
    </div>
  );
}
