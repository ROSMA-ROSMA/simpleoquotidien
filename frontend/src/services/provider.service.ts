import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapProviderFromBackend } from '@/lib/mappers/backend';
import { BackendPrestataire } from '@/types/backend';
import { User } from '@/types';
import { ApiResponse as LegacyApiResponse } from './apiClient';

function toUser(p: ReturnType<typeof mapProviderFromBackend>): User {
    return {
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        role: p.role!,
        is_active: true,
        is_verified: p.verification_status === 'VALIDE',
        pays: p.pays,
        intervention_city: p.zones_couvertes,
    };
}

export const providerService = {
    async getAll(filters?: { city?: string; categoryId?: number }): Promise<LegacyApiResponse<User[]>> {
        const raw = await apiFetch<BackendPrestataire[] | { results: BackendPrestataire[] }>(
            'Info_utilisateurs/prestataires/',
        );
        let items = unwrapList(raw).map(mapProviderFromBackend);
        if (filters?.city) {
            const q = filters.city.toLowerCase();
            items = items.filter(p => p.zones_couvertes.toLowerCase().includes(q));
        }
        if (filters?.categoryId) {
            // Pas de lien catégorie côté backend : filtre texte sur le champ services
            items = items.filter(() => true);
        }
        return { data: items.map(toUser), meta: { total: items.length } };
    },

    async getProviders(): Promise<LegacyApiResponse<ReturnType<typeof mapProviderFromBackend>[]>> {
        const raw = await apiFetch<BackendPrestataire[] | { results: BackendPrestataire[] }>(
            'Info_utilisateurs/prestataires/',
        );
        const list = unwrapList(raw).map(mapProviderFromBackend);
        return { data: list, meta: { total: list.length } };
    },

    async getById(id: number): Promise<LegacyApiResponse<User>> {
        const raw = await apiFetch<BackendPrestataire>(`Info_utilisateurs/prestataires/${id}/`);
        return { data: toUser(mapProviderFromBackend(raw)) };
    },

    /** Profil complet (entreprise, tarif, documents…) — pour la fiche prestataire agent. */
    async getProfileById(id: number): Promise<LegacyApiResponse<ReturnType<typeof mapProviderFromBackend>>> {
        const raw = await apiFetch<BackendPrestataire>(`Info_utilisateurs/prestataires/${id}/`);
        return { data: mapProviderFromBackend(raw) };
    },

    async search(query: string): Promise<LegacyApiResponse<User[]>> {
        const all = await providerService.getAll();
        const q = query.toLowerCase();
        return {
            data: all.data.filter(u =>
                `${u.first_name} ${u.last_name} ${u.intervention_city ?? ''}`.toLowerCase().includes(q),
            ),
        };
    },

    async getPending(): Promise<LegacyApiResponse<ReturnType<typeof mapProviderFromBackend>[]>> {
        const raw = await apiFetch<BackendPrestataire[] | { results: BackendPrestataire[] }>(
            'Info_utilisateurs/prestataires/',
        );
        const list = unwrapList(raw)
            .map(mapProviderFromBackend)
            .filter(p => p.verification_status === 'EN_ATTENTE');
        return { data: list, meta: { total: list.length } };
    },

    async updatePhoto(id: number, photo: File): Promise<LegacyApiResponse<ReturnType<typeof mapProviderFromBackend>>> {
        const form = new FormData();
        form.set('photo', photo);
        const raw = await apiFetch<BackendPrestataire>(`Info_utilisateurs/prestataires/${id}/`, {
            method: 'PATCH',
            body: form,
        });
        return { data: mapProviderFromBackend(raw) };
    },

    async validatePrestataire(id: number): Promise<void> {
        await apiFetch(`Info_utilisateurs/prestataires/${id}/validate/`, {
            method: 'POST',
        });
    },

    async rejectPrestataire(id: number): Promise<void> {
        await apiFetch(`Info_utilisateurs/prestataires/${id}/reject/`, {
            method: 'POST',
        });
    },
};

export type { ApiResponse };
