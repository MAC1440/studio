
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { type User } from '@/lib/types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // import styles

type ProposalEditorProps = {
  clients: User[];
  onSave: (data: { title: string; content: string; clientId: string }) => Promise<void>;
  onClose: () => void;
  proposal?: any; // Add proposal prop for editing in the future
};

export default function ProposalEditor({ clients, onSave, onClose, proposal }: ProposalEditorProps) {
  const [title, setTitle] = useState(proposal?.title || '');
  const [content, setContent] = useState(proposal?.content || '');
  const [clientId, setClientId] = useState(proposal?.clientId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use dynamic import for react-quill to avoid SSR issues
  const ReactQuill = useMemo(() => dynamic(() => import('react-quill'), { ssr: false }), []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSave({ title, content, clientId });
    setIsSubmitting(false);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <DialogTitle>{proposal ? 'Edit Proposal' : 'Create New Proposal'}</DialogTitle>
      </DialogHeader>
      
      <div className="py-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Website Design & Development"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select onValueChange={setClientId} value={clientId} disabled={isSubmitting}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
          <Label>Content</Label>
          <div className="h-full w-full bg-background rounded-md border border-input">
            <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                className="h-[calc(100%-42px)]"
              />
          </div>
        </div>
      </div>

      <DialogFooter className="mt-auto pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!title || !clientId || !content || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </Button>
      </DialogFooter>
    </div>
  );
}
