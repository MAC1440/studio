
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Proposal, AppUser } from '@/lib/types';
import { getDoc } from 'firebase/firestore';
import { addNotification } from './notifications';
import { getProject } from './projects';
import { getUsers } from './users';

type CreateProposalArgs = {
  title: string;
  content: string;
  clientId: string;
  clientName: string;
  projectId: string;
  status: Proposal['status'];
  organizationId: string;
};

export async function createProposal(args: CreateProposalArgs): Promise<Proposal> {
    const docRef = await addDoc(collection(db, "proposals"), {});

    const newProposalData: Omit<Proposal, 'id'> = {
        ...args,
        organizationId: args.organizationId,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        feedback: [], // Initialize with an empty feedback array
    };

    await setDoc(doc(db, "proposals", docRef.id), newProposalData);

    if (newProposalData.status === 'sent') {
        const project = await getProject(newProposalData.projectId);
        await addNotification({
            userId: newProposalData.clientId,
            message: `You have received a new proposal: "${newProposalData.title}"`,
            proposalId: docRef.id,
            projectId: newProposalData.projectId,
            projectName: project?.name
        });
    }

    return { ...newProposalData, id: docRef.id } as Proposal;
}

export async function getProposals(filters: { clientId?: string, projectId?: string, organizationId: string }): Promise<Proposal[]> {
    const proposalsCol = collection(db, 'proposals');
    
    const conditions = [
        where('organizationId', '==', filters.organizationId)
    ];

    if(filters.clientId) {
        conditions.push(where('clientId', '==', filters.clientId));
    }
    if (filters.projectId) {
        conditions.push(where('projectId', '==', filters.projectId));
    }

    const q = query(proposalsCol, ...conditions);
    const proposalSnapshot = await getDocs(q);
    const proposalList = proposalSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Proposal;
    });
    return proposalList;
}

export async function updateProposal(proposalId: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt'>>): Promise<void> {
    const proposalRef = doc(db, 'proposals', proposalId);
    const proposalSnap = await getDoc(proposalRef);
    if (!proposalSnap.exists()) {
        throw new Error("Proposal not found to update.");
    }
    const currentData = proposalSnap.data() as Proposal;

    const isStatusChanging = updates.status && updates.status !== currentData.status;

    if (isStatusChanging) {
        const project = await getProject(currentData.projectId);
        const projectName = project?.name || 'a project';
        
        if (updates.status === 'sent') {
             await addNotification({
                userId: currentData.clientId,
                message: `A proposal has been updated for your review: "${currentData.title}"`,
                proposalId: proposalId,
                projectId: currentData.projectId,
                projectName: projectName,
            });
        }

        if ((updates.status === 'accepted' || updates.status === 'declined') && updates.actingUser) {
            const allUsers = await getUsers(currentData.organizationId);
            const admins = allUsers.filter(u => u.role === 'admin');
            const notificationPromises = admins.map(admin => {
                return addNotification({
                    userId: admin.id,
                    message: `${updates.actingUser?.name} has ${updates.status} the proposal: "${currentData.title}"`,
                    proposalId: proposalId,
                    projectId: currentData.projectId,
                    projectName: projectName,
                });
            });
            await Promise.all(notificationPromises);
        }
    }

    const finalUpdates = {
        ...updates,
        updatedAt: serverTimestamp(),
    };
    if ('actingUser' in finalUpdates) {
        delete (finalUpdates as any).actingUser;
    }

    await updateDoc(proposalRef, finalUpdates);
}

type AddFeedbackArgs = {
    userId: string;
    message: string;
}

export async function addFeedbackToProposal(proposalId: string, {userId, message}: AddFeedbackArgs): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()){
        throw new Error("User not found");
    }
    const userData = userSnap.data() as AppUser;

    const proposalRef = doc(db, 'proposals', proposalId);
    const proposalSnap = await getDoc(proposalRef);
    if (!proposalSnap.exists()) {
        throw new Error("Proposal not found");
    }
    const proposalData = proposalSnap.data() as Proposal;

    const feedbackComment = {
        user: {
            id: userData.id,
            name: userData.name,
            avatarUrl: userData.avatarUrl
        },
        message: message,
        timestamp: Timestamp.fromDate(new Date())
    };

    await updateDoc(proposalRef, {
        feedback: arrayUnion(feedbackComment),
        status: 'changes-requested',
        updatedAt: serverTimestamp(),
    });

    const allUsers = await getUsers(proposalData.organizationId);
    const admins = allUsers.filter(u => u.role === 'admin');
    const project = await getProject(proposalData.projectId);

    const notificationPromises = admins.map(admin => {
        return addNotification({
            userId: admin.id,
            message: `Feedback received from ${userData.name} for proposal: "${proposalData.title}"`,
            proposalId: proposalId,
            projectId: proposalData.projectId,
            projectName: project?.name || 'Unknown Project',
        });
    });

    await Promise.all(notificationPromises);
}


export async function deleteProposal(proposalId: string): Promise<void> {
    const proposalRef = doc(db, 'proposals', proposalId);
    await deleteDoc(proposalRef);
}
