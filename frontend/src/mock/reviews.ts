import { Review } from '@/types';
import { mockBookings } from './bookings';

export const mockReviews: Review[] = [
    {
        id: 1,
        booking_id: 3,
        booking: mockBookings.find(b => b.id === 3),
        rating: 5,
        comment: 'Excellente coiffeuse ! Tresses parfaites et très professionnelle. Je recommande vivement.',
        created_at: '2026-07-19T10:00:00',
    },
    {
        id: 2,
        booking_id: 5,
        booking: mockBookings.find(b => b.id === 5),
        rating: 4,
        comment: 'Très bonne baby-sitter, les enfants l\'adorent. Ponctuelle et attentionnée.',
        created_at: '2026-06-16T08:00:00',
    },
    {
        id: 3,
        booking_id: 1,
        booking: mockBookings.find(b => b.id === 1),
        rating: 5,
        comment: 'J\'ai trouvé un plombier en 10 minutes un dimanche. Simple, efficace et rassurant !',
        created_at: '2026-07-21T14:00:00',
    },
];

export function getReviewsByServiceId(serviceId: number): Review[] {
    return mockReviews.filter(r => r.booking?.service_id === serviceId);
}

export function getReviewsByBookingId(bookingId: number): Review | undefined {
    return mockReviews.find(r => r.booking_id === bookingId);
}
