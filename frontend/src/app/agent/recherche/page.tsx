'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import { providerService } from '@/services/provider.service';
import { useCategories } from '@/hooks/useCategories';
import { getInitials } from '@/lib/utils';
import { User } from '@/types';
import { IconMapPin, IconMessage } from '@tabler/icons-react';

export default function AgentRecherchePage() {
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { categories } = useCategories();
    const [city, setCity] = useState('');
    const [categoryId, setCategoryId] = useState('all');

    const load = useCallback(async () => {
        try {
            const res = await providerService.getAll();
            setProviders(res.data);
        } catch { setProviders([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const results = providers.filter(p => {
        const cityMatch = !city.trim() || (p.intervention_city ?? '').toLowerCase().includes(city.toLowerCase());
        return cityMatch;
    });

    return (
        <AgentLayout title="Recherche de prestataires" subtitle="Filtrez par ville d'intervention et catégorie de service">
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 min-w-[220px]">
                    <IconMapPin className="w-4 h-4 text-slate-400" />
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville d'intervention (ex : Ouagadougou)" className="flex-1 outline-none text-[11px] bg-transparent" />
                </div>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 outline-none focus:border-brand-teal">
                    <option value="all">Toutes catégories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <p className="text-slate-400 text-[11px] text-center py-10">Chargement…</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl p-5 shadow-card border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold">
                                    {getInitials(p.first_name, p.last_name)}
                                </div>
                                <div>
                                    <p className="font-bold text-brand-dark text-[11px]">{p.first_name} {p.last_name}</p>
                                    <p className="text-[11px] text-slate-400">{p.intervention_city ?? 'Ville non renseignée'}</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-3">{p.email}</p>
                            <Link href="/agent/comparaison" className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-brand-teal hover:text-brand-teal transition-colors">
                                <IconMessage className="w-3.5 h-3.5" /> Comparer les prestataires
                            </Link>
                        </div>
                    ))}
                    {results.length === 0 && (
                        <p className="text-slate-400 text-[11px] col-span-full text-center py-10">Aucun prestataire ne correspond à ces critères.</p>
                    )}
                </div>
            )}
        </AgentLayout>
    );
}
