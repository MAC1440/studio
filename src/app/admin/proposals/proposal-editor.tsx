
'use client';

import { useState, useEffect } from 'react';
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
import { type User, type Proposal } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';


type ProposalEditorProps = {
  clients: User[];
  onSave: (data: { title: string; content: string; clientId: string }) => Promise<void>;
  onClose: () => void;
  proposal: Proposal | null; 
};

export default function ProposalEditor({ clients, onSave, onClose, proposal }: ProposalEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (proposal) {
        setTitle(proposal.title || '');
        setContent(proposal.content || '');
        setClientId(proposal.clientId || '');
    } else {
        setTitle('');
        setContent('');
        setClientId('');
    }
  }, [proposal]);


  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSave({ title, content, clientId });
    setIsSubmitting(false);
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
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full"
            placeholder="Write your proposal content here..."
          />
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
          {isSubmitting ? 'Saving...' : 'Save Proposal'}
        </Button>
      </DialogFooter>
    </div>
  );
}
