'use client';

import { useCallback, useEffect, useState } from 'react';
import { reviewService } from '@/services/review.service';
import { BackendNote } from '@/types/backend';

/** Avis laissés par le client connecté — source de vérité serveur pour savoir quelles
 * commandes restent à noter (aucun état stocké côté client/localStorage). */
export function useMyReviews(authorId?: number) {
    const [notes, setNotes] = useState<BackendNote[]>([]);
    const [loading, setLoading] = useState(Boolean(authorId));
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!authorId) {
            setNotes([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            setNotes(await reviewService.getMine(authorId));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Impossible de charger vos avis');
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }, [authorId]);

    useEffect(() => {
        reload();
    }, [reload]);

    const ratedOrderUuids = new Set(notes.map(n => n.order).filter((u): u is string => Boolean(u)));

    return { notes, ratedOrderUuids, loading, error, reload };
}
