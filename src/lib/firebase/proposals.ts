
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Proposal, AppUser } from '@/lib/types';
import { getDoc } from 'firebase/firestore';

type CreateProposalArgs = {
  title: string;
  content: string;
  clientId: string;
  clientName: string;
  status: Proposal['status'];
};

export async function createProposal(args: CreateProposalArgs): Promise<Proposal> {
    const docRef = await addDoc(collection(db, "proposals"), {});

    const newProposalData: Omit<Proposal, 'id'> = {
        ...args,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        feedback: [], // Initialize with an empty feedback array
    };

    await setDoc(doc(db, "proposals", docRef.id), newProposalData);

    return { ...newProposalData, id: docRef.id } as Proposal;
}

export async function getProposals(filters: { clientId?: string } = {}): Promise<Proposal[]> {
    const proposalsCol = collection(db, 'proposals');
    const conditions = [];
    if(filters.clientId) {
        conditions.push(where('clientId', '==', filters.clientId));
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
    await updateDoc(proposalRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

type AddFeedbackArgs = {
    userId: string;
    message: string;
}

export async function addFeedbackToProposal(proposalId: string, {userId, message}: AddFeedbackArgs): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){
        throw new Error("User not found");
    }
    const userData = userSnap.data() as AppUser;

    const feedbackComment = {
        user: {
            id: userData.id,
            name: userData.name,
            avatarUrl: userData.avatarUrl
        },
        message: message,
        timestamp: Timestamp.fromDate(new Date())
    };
    
    const proposalRef = doc(db, 'proposals', proposalId);
    await updateDoc(proposalRef, {
        feedback: arrayUnion(feedbackComment),
        status: 'changes-requested',
        updatedAt: serverTimestamp(),
    });
}


export async function deleteProposal(proposalId: string): Promise<void> {
    const proposalRef = doc(db, 'proposals', proposalId);
    await deleteDoc(proposalRef);
}
