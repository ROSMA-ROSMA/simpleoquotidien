'use client';

import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@/services/order.service';
import { Booking, BookingStatus } from '@/types';

export function useBookings(
    filters?: {
        client_id?: number;
        provider_id?: number;
        status?: BookingStatus;
    },
    options?: { enabled?: boolean },
) {
    const enabled = options?.enabled ?? true;
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await orderService.getAll(filters);
            setBookings(res.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Impossible de charger les commandes');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [filters?.client_id, filters?.provider_id, filters?.status]);

    useEffect(() => {
        if (!enabled) {
            setBookings([]);
            setLoading(false);
            return;
        }
        reload();
    }, [enabled, reload]);

    return { bookings, loading, error, reload };
}

export function useBooking(uuid: string | null) {
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(Boolean(uuid));
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!uuid) {
            setBooking(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await orderService.getById(uuid);
            setBooking(res.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Commande introuvable');
            setBooking(null);
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { booking, loading, error, reload };
}
