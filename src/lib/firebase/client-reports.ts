
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import type { ClientReport } from '@/lib/types';
import { getUsers } from './users';
import { addNotification } from './notifications';

type CreateClientReportArgs = Omit<ClientReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>;

export async function createClientReport(args: CreateClientReportArgs): Promise<ClientReport> {
    const docRef = await addDoc(collection(db, "clientReports"), {});

    const newReportData: Omit<ClientReport, 'id'> = {
        ...args,
        status: 'new',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, "clientReports", docRef.id), newReportData);

    const allUsers = await getUsers(args.organizationId);
    const admins = allUsers.filter(u => u.role === 'admin');
    
    const notificationPromises = admins.map(admin => {
        return addNotification({
            userId: admin.id,
            message: `New report submitted by ${args.clientName} for "${args.projectName}"`,
            reportId: docRef.id,
            projectId: args.projectId,
            projectName: args.projectName,
        });
    });
    
    await Promise.all(notificationPromises);

    return { ...newReportData, id: docRef.id } as ClientReport;
}

export async function getClientReports(filters: { organizationId: string, projectId?: string, clientId?: string }): Promise<ClientReport[]> {
    const reportsCol = collection(db, 'clientReports');
    const conditions = [
        where('organizationId', '==', filters.organizationId)
    ];

    if (filters.projectId) {
        conditions.push(where('projectId', '==', filters.projectId));
    }
    if (filters.clientId) {
        conditions.push(where('clientId', '==', filters.clientId));
    }
    
    const q = query(reportsCol, ...conditions);
    const reportSnapshot = await getDocs(q);
    
    const reportList = reportSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as ClientReport;
    });

    return reportList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function updateClientReport(reportId: string, updates: Partial<Omit<ClientReport, 'id' | 'createdAt'>>): Promise<void> {
    const reportRef = doc(db, 'clientReports', reportId);
    await updateDoc(reportRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteClientReport(reportId: string): Promise<void> {
    const reportRef = doc(db, 'clientReports', reportId);
    await deleteDoc(reportRef);
}
