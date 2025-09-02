
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import type { Document } from '@/lib/types';
import { getDoc } from 'firebase/firestore';

type CreateDocumentArgs = Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;

export async function createDocument(args: CreateDocumentArgs): Promise<Document> {
    const docRef = await addDoc(collection(db, "documents"), {});

    const newDocumentData: Omit<Document, 'id'> = {
        ...args,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, "documents", docRef.id), newDocumentData);

    return { ...newDocumentData, id: docRef.id } as Document;
}

export async function getDocuments(filters: { projectId: string, organizationId: string }): Promise<Document[]> {
    const documentsCol = collection(db, 'documents');
    
    const conditions = [
        where('organizationId', '==', filters.organizationId),
        where('projectId', '==', filters.projectId)
    ];

    const q = query(documentsCol, ...conditions);
    const documentSnapshot = await getDocs(q);
    const documentList = documentSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Document;
    });
    return documentList.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
}

export async function getDocument(documentId: string): Promise<Document | null> {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Document;
    }
    return null;
}


export async function updateDocument(documentId: string, updates: Partial<Omit<Document, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'documents', documentId);
    
    const finalUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, finalUpdates);
}


export async function deleteDocument(documentId: string): Promise<void> {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
}
