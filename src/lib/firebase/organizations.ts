
import { db } from './config';
import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import type { Organization } from '@/lib/types';

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
    };

    await setDoc(doc(db, "organizations", docRef.id), newOrganizationData);

    return newOrganizationData;
}

export async function updateOrganizationPlan(organizationId: string, newPlan: Organization['subscriptionPlan']): Promise<void> {
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
        subscriptionPlan: newPlan
    });
}
