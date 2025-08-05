
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import type { Invoice, AppUser } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { addNotification } from './notifications';
import { getProject } from './projects';
import { getUsers } from './users';

type CreateInvoiceArgs = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'feedback'>;

export async function createInvoice(args: Partial<CreateInvoiceArgs>): Promise<Invoice> {
    const docRef = await addDoc(collection(db, "invoices"), {});
    
    const totalAmount = args.type === 'lump-sum' ? args.lumpSumAmount || 0 : (args.items || []).reduce((sum, item) => sum + item.amount, 0);

    const newInvoiceData: Omit<Invoice, 'id'> = {
        title: args.title!,
        clientId: args.clientId!,
        clientName: args.clientName!,
        projectId: args.projectId!,
        projectName: args.projectName!,
        type: args.type!,
        status: args.status!,
        validUntil: args.validUntil!,
        description: args.description || '',
        lumpSumAmount: args.lumpSumAmount || 0,
        items: args.items || [],
        feedback: [],
        totalAmount,
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
    const invoiceSnap = await getDoc(invoiceRef);
    if (!invoiceSnap.exists()) {
        throw new Error("Invoice not found to update.");
    }
    const currentData = invoiceSnap.data() as Invoice;
    
    const finalUpdates: { [key: string]: any } = { ...updates };
    
    if (updates.validUntil && !(updates.validUntil instanceof Timestamp)) {
        finalUpdates.validUntil = Timestamp.fromDate(updates.validUntil as any);
    }
    
    finalUpdates.updatedAt = serverTimestamp();
    
    // --- Handle Notifications ---
    const isStatusChanging = updates.status && updates.status !== currentData.status;

    if (isStatusChanging && updates.status) {
        const project = await getProject(currentData.projectId);
        const projectName = project?.name || 'a project';
        const allUsers = await getUsers();
        const admins = allUsers.filter(u => u.role === 'admin');

        // 1. Notify client when invoice is SENT
        if (updates.status === 'sent') {
             await addNotification({
                userId: currentData.clientId,
                message: `An invoice has been updated for your review: "${currentData.title}"`,
                invoiceId: invoiceId,
                projectId: currentData.projectId,
                projectName: projectName,
            });
        }

        // 2. Notify admins when invoice is PAID
        if (updates.status === 'paid' && updates.actingUser) {
            const notificationPromises = admins.map(admin => {
                return addNotification({
                    userId: admin.id,
                    message: `${updates.actingUser?.name} has marked invoice "${currentData.title}" as paid.`,
                    invoiceId: invoiceId,
                    projectId: currentData.projectId,
                    projectName: projectName,
                });
            });
            await Promise.all(notificationPromises);
        }
    }
    
     // Remove the temporary 'actingUser' field before updating the document
    if ('actingUser' in finalUpdates) {
        delete (finalUpdates as any).actingUser;
    }


    await updateDoc(invoiceRef, finalUpdates);
}

type AddFeedbackArgs = {
    userId: string;
    message: string;
}

export async function addFeedbackToInvoice(invoiceId: string, {userId, message}: AddFeedbackArgs): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()){
        throw new Error("User not found");
    }
    const userData = userSnap.data() as AppUser;

    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);
    if (!invoiceSnap.exists()) {
        throw new Error("Invoice not found");
    }
    const invoiceData = invoiceSnap.data() as Invoice;

    const feedbackComment = {
        user: {
            id: userData.id,
            name: userData.name,
            avatarUrl: userData.avatarUrl
        },
        message: message,
        timestamp: Timestamp.fromDate(new Date())
    };

    await updateDoc(invoiceRef, {
        feedback: arrayUnion(feedbackComment),
        status: 'changes-requested',
        updatedAt: serverTimestamp(),
    });

    // --- Send notification to admins ---
    const allUsers = await getUsers();
    const admins = allUsers.filter(u => u.role === 'admin');
    const project = await getProject(invoiceData.projectId);

    const notificationPromises = admins.map(admin => {
        return addNotification({
            userId: admin.id,
            message: `Feedback received from ${userData.name} for invoice: "${invoiceData.title}"`,
            invoiceId: invoiceId,
            projectId: invoiceData.projectId,
            projectName: project?.name || 'Unknown Project',
        });
    });

    await Promise.all(notificationPromises);
}


export async function deleteInvoice(invoiceId: string): Promise<void> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
}
