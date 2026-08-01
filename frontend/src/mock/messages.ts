import { Message, Conversation, MessageStatus } from '@/types';
import { mockUsers } from './users';

export const mockMessages: Message[] = [
    {
        id: 1,
        sender_id: 2,
        sender: mockUsers.find(u => u.id === 2),
        receiver_id: 3,
        receiver: mockUsers.find(u => u.id === 3),
        content: 'Bonjour Thomas, êtes-vous disponible samedi matin pour une réparation de fuite ?',
        status: MessageStatus.READ,
        created_at: '2026-07-14T09:00:00',
    },
    {
        id: 2,
        sender_id: 3,
        sender: mockUsers.find(u => u.id === 3),
        receiver_id: 2,
        receiver: mockUsers.find(u => u.id === 2),
        content: 'Bonjour Sophie ! Oui, je suis disponible samedi entre 8h et 12h. Je peux passer vers 10h ?',
        status: MessageStatus.READ,
        created_at: '2026-07-14T09:30:00',
    },
    {
        id: 3,
        sender_id: 2,
        sender: mockUsers.find(u => u.id === 2),
        receiver_id: 3,
        receiver: mockUsers.find(u => u.id === 3),
        content: 'Parfait, 10h ça me va ! Je vous envoie l\'adresse par la plateforme.',
        status: MessageStatus.DELIVERED,
        created_at: '2026-07-14T10:00:00',
    },
    {
        id: 4,
        sender_id: 5,
        sender: mockUsers.find(u => u.id === 5),
        receiver_id: 4,
        receiver: mockUsers.find(u => u.id === 4),
        content: 'Bonjour Amina, combien de temps dure une séance de tresses ?',
        status: MessageStatus.SENT,
        created_at: '2026-07-15T14:30:00',
    },
];

export const mockConversations: Conversation[] = [
    {
        id: 1,
        participant: mockUsers.find(u => u.id === 3)!,
        lastMessage: mockMessages[2],
        unreadCount: 0,
    },
    {
        id: 2,
        participant: mockUsers.find(u => u.id === 4)!,
        lastMessage: mockMessages[3],
        unreadCount: 1,
    },
];

export function getConversationMessages(userId1: number, userId2: number): Message[] {
    return mockMessages.filter(
        m => (m.sender_id === userId1 && m.receiver_id === userId2) ||
            (m.sender_id === userId2 && m.receiver_id === userId1)
    );
}
