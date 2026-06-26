
'use client';

import { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/types';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

type DocumentEditorProps = {
  document: Document | null;
  onSave: (data: { title: string; content: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
};

export default function DocumentEditor({
  document,
  onSave,
  onClose,
  isSubmitting,
}: DocumentEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const { userData } = useAuth();
  
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [document]);

  const handleSubmit = () => {
    if (!isAdmin) return;
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title and some content for the document.',
        variant: 'destructive',
      });
      return;
    }
    onSave({ title, content });
  };

  const dialogTitle = document 
    ? (isAdmin ? "Edit Document" : "View Document")
    : "Create New Document";

  const dialogDescription = document
    ? `Viewing "${document.title}"`
    : 'Create a new document for your project.';

  return (
    <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>

      {isAdmin ? (
        // EDIT/CREATE VIEW FOR ADMINS
        <>
          <div className="flex-1 flex flex-col gap-4 py-4 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sprint Plan Q3"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <Label>Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                editable={true}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </>
      ) : (
        // READ-ONLY VIEW FOR USERS
        <>
           <ScrollArea className="flex-1 my-4 -mx-6">
                <div className="px-6 space-y-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                   />
              </div>
            </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}
