
import { db } from './config';
import { collection, addDoc, getDocs, getDoc, query, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, where, writeBatch, orderBy, Timestamp } from 'firebase/firestore';
import type { Project, ProjectStatus } from '@/lib/types';

type CreateProjectArgs = {
  name: string;
  description?: string;
  clientIds?: string[];
  deadline?: Date;
  status?: ProjectStatus;
  organizationId: string;
};

export async function createProject(args: CreateProjectArgs): Promise<Project> {
    const docRef = await addDoc(collection(db, "projects"), {});

    const newProjectData: Omit<Project, 'id'> = {
        name: args.name,
        description: args.description || '',
        clientIds: args.clientIds || [],
        organizationId: args.organizationId,
        createdAt: serverTimestamp() as any,
        status: args.status || 'on-track',
        ...(args.deadline && { deadline: Timestamp.fromDate(args.deadline) })
    };

    await setDoc(doc(db, "projects", docRef.id), newProjectData);

    return { ...newProjectData, id: docRef.id } as Project;
}

export async function getProjects(organizationId: string): Promise<Project[]> {
    const projectsCol = collection(db, 'projects');
    const q = query(
        projectsCol, 
        where('organizationId', '==', organizationId)
    );
    const projectSnapshot = await getDocs(q);
    const projectList = projectSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Project;
    });
    return projectList;
}

export async function getProject(projectId: string): Promise<Project | null> {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if(projectSnap.exists()){
        return { ...projectSnap.data(), id: projectSnap.id } as Project;
    }
    return null;
}


export async function updateProject(projectId: string, updates: Partial<Omit<Project, 'id'>>): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    const finalUpdates: { [key: string]: any } = { ...updates };
    if (updates.deadline) {
        finalUpdates.deadline = Timestamp.fromDate(updates.deadline as any);
    }
    
    await updateDoc(projectRef, finalUpdates);
}


export async function deleteProject(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  const projectRef = doc(db, 'projects', projectId);
  batch.delete(projectRef);

  const ticketsCol = collection(db, 'tickets');
  const q = query(ticketsCol, where('projectId', '==', projectId));
  const ticketsSnapshot = await getDocs(q);
  
  ticketsSnapshot.forEach((ticketDoc) => {
    batch.delete(ticketDoc.ref);
  });
  
  await batch.commit();
}
