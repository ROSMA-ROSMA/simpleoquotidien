import { Booking, BookingStatus } from '@/types';
import { mockServices } from './services';
import { mockUsers } from './users';

const clients = mockUsers.filter(u => u.role === 'client');

export const mockBookings: Booking[] = [
    {
        id: 1,
        client_id: 2,
        client: clients.find(c => c.id === 2),
        service_id: 1,
        category_id: mockServices.find(s => s.id === 1)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 1),
        scheduled_datetime: '2026-07-20T10:00:00',
        address: '123 Rue de la Paix, Ouagadougou',
        message: 'Fuite sous évier à réparer rapidement',
        total_amount: 15000,
        status: BookingStatus.CONFIRMED,
        created_at: '2026-07-14T08:30:00',
    },
    {
        id: 2,
        client_id: 2,
        client: clients.find(c => c.id === 2),
        service_id: 2,
        category_id: mockServices.find(s => s.id === 2)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 2),
        scheduled_datetime: '2026-07-22T08:00:00',
        address: '45 Avenue Kwame Nkrumah, Ouagadougou',
        message: 'Ménage complet maison 4 pièces',
        total_amount: 8000,
        status: BookingStatus.PENDING,
        created_at: '2026-07-15T14:00:00',
    },
    {
        id: 3,
        client_id: 5,
        client: clients.find(c => c.id === 5),
        service_id: 4,
        category_id: mockServices.find(s => s.id === 4)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 4),
        scheduled_datetime: '2026-07-18T14:00:00',
        address: '78 Rue Joseph Badoua, Ouagadougou',
        total_amount: 5000,
        status: BookingStatus.COMPLETED,
        created_at: '2026-07-10T09:15:00',
    },
    {
        id: 4,
        client_id: 5,
        client: clients.find(c => c.id === 5),
        service_id: 3,
        category_id: mockServices.find(s => s.id === 3)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 3),
        scheduled_datetime: '2026-07-25T09:00:00',
        address: '12 Boulevard de la Révolution, Ouagadougou',
        message: 'Portail métallique à réparer',
        total_amount: 25000,
        status: BookingStatus.PENDING,
        created_at: '2026-07-16T07:45:00',
    },
    {
        id: 5,
        client_id: 2,
        client: clients.find(c => c.id === 2),
        service_id: 7,
        category_id: mockServices.find(s => s.id === 7)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 7),
        scheduled_datetime: '2026-06-15T18:00:00',
        address: '123 Rue de la Paix, Ouagadougou',
        total_amount: 6000,
        status: BookingStatus.COMPLETED,
        created_at: '2026-06-10T11:00:00',
    },
    {
        id: 6,
        client_id: 5,
        client: clients.find(c => c.id === 5),
        service_id: 8,
        category_id: mockServices.find(s => s.id === 8)?.category_id ?? 1,
        service: mockServices.find(s => s.id === 8),
        scheduled_datetime: '2026-06-01T10:00:00',
        address: 'Salle des fêtes, Ouagadougou',
        message: 'Couverture photo anniversaire',
        total_amount: 50000,
        status: BookingStatus.CANCELLED,
        created_at: '2026-05-25T16:30:00',
    },
];

export function getBookingById(id: number): Booking | undefined {
    return mockBookings.find(b => b.id === id);
}

export function getBookingsByClient(clientId: number): Booking[] {
    return mockBookings.filter(b => b.client_id === clientId);
}

export function getBookingsByProvider(providerId: number): Booking[] {
    return mockBookings.filter(b => b.service?.provider_id === providerId);
}

export function getUpcomingBookings(clientId: number): Booking[] {
    return mockBookings.filter(
        b => b.client_id === clientId &&
            (b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED) &&
            new Date(b.scheduled_datetime) > new Date()
    );
}

export function getPendingBookingsForProvider(providerId: number): Booking[] {
    return mockBookings.filter(
        b => b.service?.provider_id === providerId && b.status === BookingStatus.PENDING
    );
}
