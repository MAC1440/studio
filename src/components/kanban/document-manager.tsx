
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText as DocumentIcon, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import type { Document } from '@/lib/types';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/documents';
import DocumentEditor from './document-editor';

type DocumentManagerProps = {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function DocumentManager({ projectId, projectName, isOpen, onClose }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const { userData } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = userData?.role === 'admin';

  const fetchData = async () => {
    if (!userData?.organizationId) return;
    setIsLoading(true);
    try {
      const fetchedDocs = await getDocuments({
        projectId,
        organizationId: userData.organizationId,
      });
      setDocuments(fetchedDocs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch project documents.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userData?.organizationId) {
      fetchData();
    }
  }, [isOpen, userData?.organizationId, projectId]);

  const handleCreateClick = () => {
    setEditingDocument(null);
    setIsEditorOpen(true);
  };

  const handleEditClick = (doc: Document) => {
    setEditingDocument(doc);
    setIsEditorOpen(true);
  };
  
  const handleSaveDocument = async (data: { title: string; content: string }) => {
    if (!userData?.organizationId) return;
    setIsSubmitting(true);
    try {
        if(editingDocument) {
            await updateDocument(editingDocument.id, data);
            toast({ title: 'Document Updated' });
        } else {
            await createDocument({
                ...data,
                projectId,
                organizationId: userData.organizationId,
            });
            toast({ title: 'Document Created' });
        }
        setIsEditorOpen(false);
        setEditingDocument(null);
        await fetchData();
    } catch (error: any) {
        console.error('Failed to save document:', error);
        toast({ title: 'Error Saving Document', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsSubmitting(true);
    try {
        await deleteDocument(docToDelete.id);
        toast({ title: 'Document Deleted' });
        setDocToDelete(null);
        await fetchData();
    } catch (error: any) {
        console.error('Failed to delete document:', error);
        toast({ title: 'Error Deleting Document', description: error.message, variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <AlertDialog>
            <DialogHeader>
                <DialogTitle>Project Documents</DialogTitle>
                <DialogDescription>
                Manage internal documents for the project "{projectName}".
                </DialogDescription>
            </DialogHeader>

            {isAdmin && (
                <div className="flex justify-end">
                    <Button size="sm" onClick={handleCreateClick}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Create Document
                    </Button>
                </div>
            )}
            
            <div className="flex-1 border rounded-lg overflow-auto">
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : documents.length > 0 ? (
                        documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>{format(doc.updatedAt.toDate(), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(doc)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {isAdmin ? 'View / Edit' : 'View'}
                                </Button>
                                {isAdmin && (
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => setDocToDelete(doc)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                )}
                            </div>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="h-48 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <DocumentIcon className="h-12 w-12" />
                            <h2 className="text-lg font-semibold">No Documents Yet</h2>
                            {isAdmin && <p>Click "Create Document" to get started.</p>}
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
            {docToDelete && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document
                        "{docToDelete.title}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDocToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDocument} disabled={isSubmitting}>
                        {isSubmitting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            )}
           </AlertDialog>
            <Dialog open={isEditorOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsEditorOpen(false); setEditingDocument(null); }}}>
                <DocumentEditor
                    document={editingDocument}
                    onSave={handleSaveDocument}
                    onClose={() => { setIsEditorOpen(false); setEditingDocument(null); }}
                    isSubmitting={isSubmitting}
                />
            </Dialog>
        </DialogContent>
    </Dialog>
  );
}
