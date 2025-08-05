
import { db } from './config';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { getProject } from './projects';

type AddNotificationArgs = {
  userId: string;
  message: string;
  ticketId?: string;
  proposalId?: string;
  invoiceId?: string;
  projectId: string;
  projectName?: string;
};

export async function addNotification({ userId, message, ticketId, proposalId, invoiceId, projectId, projectName }: AddNotificationArgs): Promise<string> {
  const notificationsCol = collection(db, 'notifications');
  
  // Set an expiration date 7 days from now for TTL policy
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  let finalProjectName = projectName;
  if (!finalProjectName) {
      try {
          const project = await getProject(projectId);
          if (project) {
              finalProjectName = project.name;
          }
      } catch (e) {
          console.error("Could not fetch project name for notification", e);
      }
  }

  const newNotification: Omit<Notification, 'id'> = {
    userId,
    message,
    read: false,
    createdAt: serverTimestamp() as Timestamp,
    expiresAt: Timestamp.fromDate(expiresAt),
    projectId,
    projectName: finalProjectName || 'Unknown Project',
    ...(ticketId && { ticketId }),
    ...(proposalId && { proposalId }),
    ...(invoiceId && { invoiceId }),
  };
  const docRef = await addDoc(notificationsCol, newNotification);
  return docRef.id;
}

export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const notificationsCol = collection(db, 'notifications');
  const q = query(
    notificationsCol,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20) // Limit to the last 20 notifications
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
    callback(notifications);
  });

  return unsubscribe;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
}
