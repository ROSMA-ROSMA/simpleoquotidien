import { authFetch } from '@/lib/api/client';
import { RegisterFormData, User } from '@/types';

export interface LoginResult {
    success: boolean;
    user?: User;
    redirectPath?: string;
    error?: string;
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResult> {
        try {
            const data = await authFetch<{ success: boolean; user: User; redirectPath: string }>('login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            return { success: true, user: data.user, redirectPath: data.redirectPath };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur de connexion';
            return { success: false, error: message };
        }
    },

    async logout(): Promise<void> {
        await authFetch('logout', { method: 'POST' });
    },

    async register(data: RegisterFormData): Promise<{ success: boolean; error?: string }> {
        try {
            await authFetch('register', {
                method: 'POST',
                body: JSON.stringify({
                    ...data,
                    pays: data.pays ?? 'Burkina Faso',
                }),
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Inscription impossible' };
        }
    },

    async getMe(): Promise<User | null> {
        try {
            const data = await authFetch<{ user: User }>('me');
            return data.user;
        } catch {
            return null;
        }
    },

    async updateProfile(patch: Partial<User & { first_name: string; last_name: string }>): Promise<User> {
        const data = await authFetch<{ user: User }>('me', {
            method: 'PATCH',
            body: JSON.stringify(patch),
        });
        return data.user;
    },
};
