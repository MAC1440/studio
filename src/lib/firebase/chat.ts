
import { db } from './config';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    serverTimestamp, 
    Timestamp,
    onSnapshot,
    orderBy,
    limit,
    updateDoc
} from 'firebase/firestore';
import type { Chat, ChatMessage, User } from '@/lib/types';
import { addNotification } from './notifications';
import { getProject } from './projects';
import { getUsers } from './users';

export async function getOrCreateChatForProject(projectId: string, organizationId: string): Promise<string> {
    const chatsCol = collection(db, 'chats');
    const q = query(
        chatsCol, 
        where('projectId', '==', projectId),
        where('organizationId', '==', organizationId),
        limit(1)
    );

    const chatSnapshot = await getDocs(q);

    if (!chatSnapshot.empty) {
        return chatSnapshot.docs[0].id;
    } else {
        const project = await getProject(projectId);
        if (!project) throw new Error("Project not found to create chat");
        
        const allUsers = await getUsers(organizationId);
        const adminIds = allUsers.filter(u => u.role === 'admin').map(u => u.id);
        const userIds = [...(project.clientIds || []), ...adminIds];

        const newChat: Omit<Chat, 'id'> = {
            projectId,
            organizationId,
            userIds,
            createdAt: serverTimestamp() as Timestamp,
        };
        const docRef = await addDoc(chatsCol, newChat);
        return docRef.id;
    }
}

export async function sendMessage(chatId: string, sender: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>, text: string): Promise<void> {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const newMessage: Omit<ChatMessage, 'id'> = {
        sender,
        text,
        timestamp: serverTimestamp() as Timestamp
    };
    await addDoc(messagesCol, newMessage);
    
    // Also update the last message on the chat document for previews/sorting
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        lastMessage: {
            text,
            timestamp: serverTimestamp()
        }
    });

    // Send notifications
    const chatSnap = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
    if (chatSnap.empty) return;

    const chatData = chatSnap.docs[0].data() as Chat;
    const project = await getProject(chatData.projectId);

    const recipients = chatData.userIds.filter(id => id !== sender.id);

    const notificationPromises = recipients.map(userId => {
        return addNotification({
            userId,
            message: `New message from ${sender.name} in "${project?.name}"`,
            chatId,
            projectId: chatData.projectId
        });
    });
    
    await Promise.all(notificationPromises);
}

export function subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));
        callback(messages);
    });

    return unsubscribe;
}
