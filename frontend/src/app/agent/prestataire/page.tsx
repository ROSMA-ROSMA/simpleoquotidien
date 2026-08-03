'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import { providerService } from '@/services/provider.service';
import { getInitials } from '@/lib/utils';
import { User } from '@/types';
import { IconSearch, IconMapPin, IconCircleCheck } from '@tabler/icons-react';

export default function AgentPrestatairePage() {
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await providerService.getAll();
            // Only show validated prestataires to the agent
            setProviders(res.data.filter(p => p.is_verified));
        } catch { setProviders([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = providers.filter(p =>
        `${p.first_name} ${p.last_name} ${p.intervention_city ?? ''}`.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <AgentLayout title="Prestataires" subtitle={loading ? 'Chargement…' : `${providers.length} prestataire${providers.length !== 1 ? 's' : ''} enregistré${providers.length !== 1 ? 's' : ''}`}>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 mb-5 max-w-md">
                <IconSearch className="w-4 h-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un prestataire ou une ville…" className="flex-1 outline-none text-sm bg-transparent" />
            </div>

            {loading ? (
                <p className="text-slate-400 text-sm text-center py-10">Chargement des prestataires…</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <Link key={p.id} href={`/agent/prestataire/${p.id}`} className="block bg-white rounded-2xl p-5 shadow-card border border-slate-100 hover:border-brand-teal/40 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-lg">
                                    {getInitials(p.first_name, p.last_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-brand-dark truncate">{p.first_name} {p.last_name}</p>
                                    <p className="text-sm text-slate-400 flex items-center gap-1"><IconMapPin className="w-3 h-3" /> {p.intervention_city ?? 'Ville non renseignée'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                {p.is_verified ? (
                                    <Badge variant="success">Vérifié</Badge>
                                ) : (
                                    <Badge variant="warning">Non vérifié</Badge>
                                )}
                                <span className="text-sm text-slate-400">{p.email}</span>
                            </div>
                        </Link>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-slate-400 text-sm col-span-full text-center py-10">Aucun prestataire ne correspond à cette recherche.</p>
                    )}
                </div>
            )}
        </AgentLayout>
    );
}
