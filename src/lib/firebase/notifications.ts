
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

type AddNotificationArgs = {
  userId: string;
  message: string;
  ticketId: string;
  projectId: string;
  projectName: string;
};

export async function addNotification({ userId, message, ticketId, projectId, projectName }: AddNotificationArgs): Promise<string> {
  const notificationsCol = collection(db, 'notifications');
  
  // Set an expiration date 7 days from now for TTL policy
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const newNotification = {
    userId,
    message,
    ticketId,
    projectId,
    projectName,
    read: false,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
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
