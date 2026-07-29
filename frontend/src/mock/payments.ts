import { Payment, PaymentMethod, PaymentStatus } from '@/types';

export const mockPayments: Payment[] = [
    {
        id: 1,
        booking_id: 1,
        amount: 15000,
        payment_method: PaymentMethod.MOBILE_MONEY,
        status: PaymentStatus.SUCCESS,
        transaction_ref: 'TXN-2026-001',
        created_at: '2026-07-15T10:30:00',
    },
    {
        id: 2,
        booking_id: 3,
        amount: 5000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.SUCCESS,
        transaction_ref: 'TXN-2026-002',
        created_at: '2026-07-18T16:00:00',
    },
    {
        id: 3,
        booking_id: 5,
        amount: 6000,
        payment_method: PaymentMethod.MOBILE_MONEY,
        status: PaymentStatus.SUCCESS,
        transaction_ref: 'TXN-2026-003',
        created_at: '2026-06-15T20:00:00',
    },
    {
        id: 4,
        booking_id: 2,
        amount: 8000,
        payment_method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        created_at: '2026-07-16T08:00:00',
    },
];

export function getPaymentByBookingId(bookingId: number): Payment | undefined {
    return mockPayments.find(p => p.booking_id === bookingId);
}
