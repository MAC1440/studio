
import { db } from './config';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import type { Proposal } from '@/lib/types';

type CreateProposalArgs = {
  title: string;
  content: string;
  clientId: string;
  clientName: string;
};

export async function createProposal(args: CreateProposalArgs): Promise<Proposal> {
    const docRef = await addDoc(collection(db, "proposals"), {});

    const newProposalData: Omit<Proposal, 'id'> = {
        ...args,
        status: 'draft',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, "proposals", docRef.id), newProposalData);

    return { ...newProposalData, id: docRef.id } as Proposal;
}

export async function getProposals(): Promise<Proposal[]> {
    const proposalsCol = collection(db, 'proposals');
    const q = query(proposalsCol);
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

export async function updateProposal(proposalId: string, updates: Partial<Omit<Proposal, 'id'>>): Promise<void> {
    const proposalRef = doc(db, 'proposals', proposalId);
    await updateDoc(proposalRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteProposal(proposalId: string): Promise<void> {
    const proposalRef = doc(db, 'proposals', proposalId);
    await deleteDoc(proposalRef);
}
