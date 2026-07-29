'use client';

import { useCallback, useEffect, useState } from 'react';
import { categoryService } from '@/services/category.service';
import { Category } from '@/types';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await categoryService.getAll();
            setCategories(res.data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Impossible de charger les catégories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return { categories, loading, error, reload };
}

export function useCategory(id: number | null) {
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(Boolean(id));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setCategory(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await categoryService.getById(id);
                if (!cancelled) setCategory(res.data);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Catégorie introuvable');
                    setCategory(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    return { category, loading, error };
}
