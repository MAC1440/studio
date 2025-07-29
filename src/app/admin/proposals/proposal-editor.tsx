
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
import { createProposal, updateProposal } from '@/lib/firebase/proposals';
import { useToast } from '@/hooks/use-toast';


type ProposalEditorProps = {
  clients: User[];
  onSave: (data: { title: string; content: string; clientId: string, status: Proposal['status'] }) => Promise<void>;
  onClose: () => void;
  proposal: Proposal | null; 
  onCreate: () => Promise<void>;
};

export default function ProposalEditor({ clients, onSave, onClose, proposal, onCreate }: ProposalEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
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


  const handleSubmit = async (status: Proposal['status']) => {
    setIsSubmitting(true);
     const client = clients.find(c => c.id === clientId);
    if (!client) {
        toast({ title: 'Client not found', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
    
    const proposalData = { title, content, clientId, status, clientName: client.name };

    try {
        if (proposal) {
            await updateProposal(proposal.id, proposalData);
            toast({ title: status === 'sent' ? 'Proposal sent!' : 'Proposal updated!' });
        } else {
            await createProposal(proposalData);
            toast({ title: status === 'sent' ? 'Proposal created and sent!' : 'Proposal saved as draft.' });
            await onCreate(); // Refresh the list in the parent
        }
        onClose();
    } catch (e) {
        console.error("Failed to save proposal", e);
        toast({ title: 'Error saving proposal', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };
  
  const isFormValid = title && clientId && content;
  const isViewOnly = proposal && proposal.status !== 'draft';


  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <DialogTitle>{proposal ? (isViewOnly ? 'View Proposal' : 'Edit Proposal') : 'Create New Proposal'}</DialogTitle>
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
              disabled={isSubmitting || isViewOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select onValueChange={setClientId} value={clientId} disabled={isSubmitting || isViewOnly}>
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
            disabled={isSubmitting || isViewOnly}
          />
        </div>
      </div>

      <DialogFooter className="mt-auto pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          {isViewOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isViewOnly && (
            <div className="flex gap-2">
                 <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleSubmit('draft')}
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                    type="button"
                    onClick={() => handleSubmit('sent')}
                    disabled={!isFormValid || isSubmitting}
                >
                    {isSubmitting ? 'Sending...' : (proposal ? 'Update & Send' : 'Save & Send')}
                </Button>
            </div>
        )}
      </DialogFooter>
    </div>
  );
}
