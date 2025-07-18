
'use server';

import { db } from './config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Project } from '@/lib/types';

type CreateProjectArgs = {
  name: string;
  description: string;
  ownerId: string;
};

export async function createProject(args: CreateProjectArgs): Promise<string> {
  const newProject = {
    ...args,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'projects'), newProject);
  return docRef.id;
}

export async function getProjects(): Promise<Project[]> {
  const projectsCol = collection(db, 'projects');
  const q = query(projectsCol);
  const projectSnapshot = await getDocs(q);
  return projectSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Project[];
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, 'name' | 'description'>>
): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, updates);
}

export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  await deleteDoc(projectRef);
  // Note: This does not delete the associated tickets, sprints, etc.
  // A more robust solution would use a Firebase Function to handle cascading deletes.
}

