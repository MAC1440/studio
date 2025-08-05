
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { addNotification } from './notifications';
import { getProject } from './projects';

type CreateInvoiceArgs = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>;

export async function createInvoice(args: CreateInvoiceArgs): Promise<Invoice> {
    const docRef = await addDoc(collection(db, "invoices"), {});

    const newInvoiceData: Omit<Invoice, 'id'> = {
        ...args,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, "invoices", docRef.id), newInvoiceData);

    if (newInvoiceData.status === 'sent') {
        await addNotification({
            userId: newInvoiceData.clientId,
            message: `You have received a new invoice for "${newInvoiceData.projectName}"`,
            invoiceId: docRef.id,
            projectId: newInvoiceData.projectId,
            projectName: newInvoiceData.projectName,
        });
    }

    return { ...newInvoiceData, id: docRef.id } as Invoice;
}

export async function getInvoices(filters: { clientId?: string, projectId?: string } = {}): Promise<Invoice[]> {
    const invoicesCol = collection(db, 'invoices');
    const conditions = [];
    if (filters.clientId) {
        conditions.push(where('clientId', '==', filters.clientId));
    }
    if (filters.projectId) {
        conditions.push(where('projectId', '==', filters.projectId));
    }
    const q = query(invoicesCol, ...conditions);
    const invoiceSnapshot = await getDocs(q);
    const invoiceList = invoiceSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Invoice;
    });
    return invoiceList;
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);
    if (invoiceSnap.exists()) {
        return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
    }
    return null;
}

export async function updateInvoice(invoiceId: string, updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>): Promise<void> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    
    const finalUpdates: { [key: string]: any } = { ...updates };
    
    if (updates.validUntil && !(updates.validUntil instanceof Timestamp)) {
        finalUpdates.validUntil = Timestamp.fromDate(updates.validUntil as any);
    }
    
    finalUpdates.updatedAt = serverTimestamp();

    await updateDoc(invoiceRef, finalUpdates);
}


export async function deleteInvoice(invoiceId: string): Promise<void> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
}
