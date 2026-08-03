'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    User, UserRole, Category, Service, Booking, BookingStatus, BookingHistoryEntry,
    Payment, PaymentMethod, PaymentStatus, Review, Message, MessageStatus, Conversation,
    AppNotification, NotificationType,
} from '@/types';
import { mockServices } from '@/mock/services';
import { mockBookings } from '@/mock/bookings';
import { mockPayments } from '@/mock/payments';
import { mockReviews } from '@/mock/reviews';
import { mockMessages, mockConversations } from '@/mock/messages';

/**
 * Store Zustand — Données SANS endpoint backend
 *
 * Ce store ne gère plus que les fonctionnalités qui n'ont PAS d'endpoint backend :
 *   - Services (le backend n'a que des catégories, pas de catalogue de services)
 *   - Paiements (simulation — pas de passerelle de paiement backend)
 *   - Messages / Conversations (pas de backend messaging)
 *   - Notifications (pas de backend notifications)
 *   - Avis (reviews — backend a /api/utilisateurs/notes/ mais pas utilisé pour les reviews de services)
 *
 * Les données suivantes viennent désormais du vrai backend via les services API :
 *   - Utilisateurs → userService, customerService, providerService
 *   - Catégories → categoryService, useCategories hook
 *   - Commandes → orderService, useBookings/useBooking hooks
 *   - Authentification → authService (JWT httpOnly cookies via BFF)
 */

interface AppState {
    // ─── Data (sans backend) ─────────────────────────────────
    services: Service[];
    bookings: Booking[];  // Store bookings for service-based booking flow (no backend for Service model)
    payments: Payment[];
    reviews: Review[];
    messages: Message[];
    conversations: Conversation[];
    notifications: AppNotification[];
    _hydrated: boolean;

    // ─── Bookings / workflow (store-only, pour le flux Service→Book) ─
    createBooking: (booking: Omit<Booking, 'id' | 'status' | 'created_at' | 'history'>) => Booking;
    transitionBooking: (bookingId: number, status: BookingStatus, note?: string, actorRole?: UserRole) => void;
    providerRespond: (bookingId: number, response: 'accept' | 'reject' | 'postpone', reason?: string) => void;
    contactProvider: (bookingId: number) => void;
    startExecution: (bookingId: number) => void;
    completeBooking: (bookingId: number) => void;
    cancelBooking: (bookingId: number, reason?: string) => void;
    updateBookingDetails: (bookingId: number, patch: Pick<Booking, 'scheduled_datetime' | 'address' | 'message'>) => void;

    // ─── Payments / reviews ──────────────────────────────────
    simulatePayment: (bookingId: number, method: PaymentMethod) => Payment;
    addReview: (bookingId: number, rating: number, comment?: string) => Review;

    // ─── Services (admin CRUD, pas de backend) ───────────────
    createService: (service: Omit<Service, 'id' | 'rating' | 'review_count' | 'created_at'>) => Service;
    updateService: (id: number, patch: Partial<Service>) => void;
    deleteService: (id: number) => void;

    // ─── Messages ────────────────────────────────────────────
    sendMessage: (senderId: number, receiverId: number, content: string) => Message;

    // ─── Notifications ────────────────────────────────────────
    notify: (userId: number, type: NotificationType, title: string, message: string, link?: string) => void;
    markNotificationRead: (id: number) => void;
    markAllNotificationsRead: (userId: number) => void;
}

let nextId = { service: 1000, booking: 1000, payment: 1000, review: 1000, message: 1000, notification: 1, history: 1 };

function pushHistory(booking: Booking, status: BookingStatus, note?: string, actorRole?: UserRole): Booking {
    const entry: BookingHistoryEntry = {
        id: nextId.history++,
        booking_id: booking.id,
        status,
        note,
        actor_role: actorRole,
        created_at: new Date().toISOString(),
    };
    return { ...booking, status, history: [...(booking.history ?? []), entry] };
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            services: mockServices,
            bookings: mockBookings.map(b => pushHistory({ ...b, history: [] }, b.status, 'Commande initiale')),
            payments: mockPayments,
            reviews: mockReviews,
            messages: mockMessages,
            conversations: mockConversations,
            notifications: [],
            _hydrated: false,

            // ─── Bookings / workflow (store-only) ────────────
            createBooking: (booking) => {
                const id = nextId.booking++;
                let newBooking: Booking = {
                    ...booking,
                    id,
                    status: BookingStatus.PENDING,
                    created_at: new Date().toISOString(),
                    history: [],
                };
                newBooking = pushHistory(newBooking, BookingStatus.PENDING, 'Commande créée par le client', UserRole.CLIENT);
                set(s => ({ bookings: [...s.bookings, newBooking] }));
                get().notify(booking.client_id, 'order_created', 'Commande créée', `Votre commande #${id} a bien été créée.`, `/booking/${id}`);
                return newBooking;
            },

            transitionBooking: (bookingId, status, note, actorRole) => {
                set(s => ({
                    bookings: s.bookings.map(b => (b.id === bookingId ? pushHistory(b, status, note, actorRole) : b)),
                }));
            },

            providerRespond: (bookingId, response, reason) => {
                const booking = get().bookings.find(b => b.id === bookingId);
                if (!booking) return;
                if (response === 'accept') {
                    get().transitionBooking(bookingId, BookingStatus.CONFIRMED, 'Prestataire a accepté', UserRole.PROVIDER);
                } else if (response === 'reject') {
                    set(s => ({
                        bookings: s.bookings.map(b => b.id === bookingId
                            ? pushHistory({ ...b, assigned_provider_id: undefined, assigned_provider: undefined }, BookingStatus.REJECTED, reason, UserRole.PROVIDER)
                            : b),
                    }));
                } else {
                    set(s => ({
                        bookings: s.bookings.map(b => b.id === bookingId
                            ? pushHistory({ ...b, assigned_provider_id: undefined, assigned_provider: undefined }, BookingStatus.POSTPONED, reason, UserRole.PROVIDER)
                            : b),
                    }));
                }
            },

            contactProvider: (bookingId) => {
                set(s => ({ bookings: s.bookings.map(b => (b.id === bookingId ? { ...b } : b)) }));
            },

            startExecution: (bookingId) => get().transitionBooking(bookingId, BookingStatus.IN_PROGRESS, 'Intervention démarrée', UserRole.PROVIDER),

            completeBooking: (bookingId) => {
                get().transitionBooking(bookingId, BookingStatus.COMPLETED, 'Intervention terminée', UserRole.PROVIDER);
            },

            cancelBooking: (bookingId, reason) => get().transitionBooking(bookingId, BookingStatus.CANCELLED, reason, UserRole.CLIENT),

            updateBookingDetails: (bookingId, patch) => {
                set(s => ({ bookings: s.bookings.map(b => (b.id === bookingId ? { ...b, ...patch } : b)) }));
            },

            // ─── Payments / reviews ──────────────────────────
            simulatePayment: (bookingId, method) => {
                const booking = get().bookings.find(b => b.id === bookingId);
                const payment: Payment = {
                    id: nextId.payment++,
                    booking_id: bookingId,
                    amount: booking?.total_amount ?? 0,
                    payment_method: method,
                    status: PaymentStatus.SUCCESS,
                    transaction_ref: `TXN-${new Date().getFullYear()}-${String(nextId.payment).padStart(4, '0')}`,
                    created_at: new Date().toISOString(),
                };
                set(s => ({ payments: [...s.payments, payment] }));
                return payment;
            },

            addReview: (bookingId, rating, comment) => {
                const review: Review = { id: nextId.review++, booking_id: bookingId, rating, comment, created_at: new Date().toISOString() };
                set(s => ({
                    reviews: [...s.reviews, review],
                    bookings: s.bookings.map(b => (b.id === bookingId ? { ...b, review } : b)),
                }));
                return review;
            },

            // ─── Services (admin CRUD, pas de backend) ───────
            createService: (service) => {
                const newService: Service = { ...service, id: nextId.service++, rating: 0, review_count: 0, created_at: new Date().toISOString() };
                set(s => ({ services: [...s.services, newService] }));
                return newService;
            },
            updateService: (id, patch) => set(s => ({ services: s.services.map(sv => (sv.id === id ? { ...sv, ...patch } : sv)) })),
            deleteService: (id) => set(s => ({ services: s.services.filter(sv => sv.id !== id) })),

            // ─── Messages ────────────────────────────────────
            sendMessage: (senderId, receiverId, content) => {
                const message: Message = {
                    id: nextId.message++,
                    sender_id: senderId,
                    receiver_id: receiverId,
                    content,
                    status: MessageStatus.SENT,
                    created_at: new Date().toISOString(),
                };
                set(s => {
                    const messages = [...s.messages, message];
                    const conversations = [...s.conversations];
                    return { messages, conversations };
                });
                return message;
            },

            // ─── Notifications ────────────────────────────────
            notify: (userId, type, title, message, link) => {
                const notification: AppNotification = {
                    id: nextId.notification++,
                    user_id: userId,
                    type,
                    title,
                    message,
                    link,
                    is_read: false,
                    created_at: new Date().toISOString(),
                };
                set(s => ({ notifications: [notification, ...s.notifications] }));
            },
            markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => (n.id === id ? { ...n, is_read: true } : n)) })),
            markAllNotificationsRead: (userId) => set(s => ({ notifications: s.notifications.map(n => (n.user_id === userId ? { ...n, is_read: true } : n)) })),
        }),
        {
            name: 'soq-app-store',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) state._hydrated = true;
            },
            partialize: (s) => ({
                services: s.services, bookings: s.bookings,
                payments: s.payments, reviews: s.reviews, messages: s.messages, conversations: s.conversations,
                notifications: s.notifications,
            }),
        },
    ),
);
