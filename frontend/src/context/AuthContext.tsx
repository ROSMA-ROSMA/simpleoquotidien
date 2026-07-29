'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginResult } from '@/services/auth.service';
import { RegisterFormData, User } from '@/types';

interface AuthContextValue {
    currentUser: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
    refreshUser: () => Promise<void>;
    /** @deprecated Comptes démo locaux — retiré avec l’auth API */
    switchUser: (userId: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const user = await authService.getMe();
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const user = await authService.getMe();
                if (!cancelled) setCurrentUser(user);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const result = await authService.login(email, password);
        if (result.success && result.user) {
            setCurrentUser(result.user);
        }
        return result;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setCurrentUser(null);
        router.push('/login');
        router.refresh();
    }, [router]);

    const register = useCallback(async (data: RegisterFormData) => {
        return authService.register(data);
    }, []);

    const switchUser = useCallback(() => {
        // No-op : auth réelle uniquement
    }, []);

    const value = useMemo(
        () => ({
            currentUser,
            isAuthenticated: currentUser !== null,
            loading,
            login,
            logout,
            register,
            refreshUser,
            switchUser,
        }),
        [currentUser, loading, login, logout, register, refreshUser, switchUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
