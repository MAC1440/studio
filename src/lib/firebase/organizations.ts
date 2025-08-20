
import { db } from './config';
import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp, updateDoc, getDocs, getDoc, increment } from 'firebase/firestore';
import type { Organization } from '@/lib/types';
import { startOfDay } from 'date-fns';

type CreateOrganizationArgs = {
  name: string;
  ownerId: string;
};

export async function createOrganization(args: CreateOrganizationArgs): Promise<Organization> {
    const docRef = await addDoc(collection(db, "organizations"), {});

    const newOrganizationData: Organization = {
        id: docRef.id,
        name: args.name,
        ownerId: args.ownerId,
        createdAt: serverTimestamp() as Timestamp,
        subscriptionPlan: 'free',
        aiProposalCount: 0,
        aiProposalCountLastReset: serverTimestamp() as Timestamp,
    };

    await setDoc(doc(db, "organizations", docRef.id), newOrganizationData);

    return newOrganizationData;
}

export async function getAllOrganizations(): Promise<Organization[]> {
    const orgsCol = collection(db, 'organizations');
    const orgSnapshot = await getDocs(orgsCol);
    return orgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organization));
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgSnap = await getDoc(orgRef);
    if (orgSnap.exists()) {
        return { id: orgSnap.id, ...orgSnap.data() } as Organization;
    }
    return null;
}


export async function updateOrganizationPlan(organizationId: string, newPlan: Organization['subscriptionPlan']): Promise<void> {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
        subscriptionPlan: newPlan
    });
}

export async function incrementAiProposalCount(organizationId: string): Promise<void> {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
        aiProposalCount: increment(1)
    });
}

export async function checkAndResetAiProposalCount(organizationId: string): Promise<Organization> {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgSnap = await getDoc(orgRef);

    if (!orgSnap.exists()) {
        throw new Error('Organization not found');
    }

    const orgData = orgSnap.data() as Organization;
    const lastResetDate = orgData.aiProposalCountLastReset?.toDate();
    const today = startOfDay(new Date());

    // If last reset is not set or was before today, reset the count
    if (!lastResetDate || lastResetDate < today) {
        await updateDoc(orgRef, {
            aiProposalCount: 0,
            aiProposalCountLastReset: Timestamp.now()
        });
        const updatedSnap = await getDoc(orgRef);
        return updatedSnap.data() as Organization;
    }

    return orgData;
}
