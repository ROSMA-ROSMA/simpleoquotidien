'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { providerService } from '@/services/provider.service';
import { mapProviderFromBackend } from '@/lib/mappers/backend';
import { UserRole } from '@/types';

type Provider = ReturnType<typeof mapProviderFromBackend>;

/** Profil PrestataireProfile complet (tarif, photo, documents…) de l'utilisateur connecté. */
export function useProviderProfile() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        if (!currentUser || currentUser.role !== UserRole.PROVIDER) {
            setProfile(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await providerService.getProviders();
            setProfile(res.data.find(p => p.user_id === currentUser.id) ?? null);
        } catch {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { reload(); }, [reload]);

    return { profile, loading, reload };
}
