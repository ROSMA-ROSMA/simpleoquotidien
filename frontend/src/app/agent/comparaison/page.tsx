'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentLayout from '@/components/layout/AgentLayout';
import { providerService } from '@/services/provider.service';
import { getInitials } from '@/lib/utils';
import { User } from '@/types';
import { IconStar } from '@tabler/icons-react';

export default function AgentComparaisonPage() {
    const [providers, setProviders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await providerService.getAll();
            setProviders(res.data);
        } catch { setProviders([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
    };

    const compared = providers.filter(p => selected.includes(p.id));

    return (
        <AgentLayout title="Comparer les prestataires" subtitle="Sélectionnez jusqu'à 3 prestataires à comparer">
            {loading ? (
                <p className="text-slate-400 text-sm text-center py-10">Chargement…</p>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {providers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => toggle(p.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${selected.includes(p.id) ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/40'
                                    }`}
                            >
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">{getInitials(p.first_name, p.last_name)}</span>
                                {p.first_name} {p.last_name}
                            </button>
                        ))}
                    </div>

                    {compared.length > 0 ? (
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(0, 1fr))` }}>
                            {compared.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                                    <div className="text-center mb-5">
                                        <div className="w-16 h-16 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-xl mx-auto mb-3">
                                            {getInitials(p.first_name, p.last_name)}
                                        </div>
                                        <p className="font-bold text-brand-dark">{p.first_name} {p.last_name}</p>
                                        <p className="text-sm text-slate-400">{p.intervention_city ?? 'Ville non renseignée'}</p>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-400">Email</span>
                                            <span className="font-bold text-brand-dark text-sm truncate max-w-[160px]">{p.email}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-400">Vérifié</span>
                                            <span className="font-bold text-brand-dark">{p.is_verified ? 'Oui' : 'Non'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Statut</span>
                                            <span className="font-bold text-brand-dark">{p.is_active ? 'Actif' : 'Inactif'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-10">Sélectionnez au moins un prestataire ci-dessus pour voir la comparaison.</p>
                    )}
                </>
            )}
        </AgentLayout>
    );
}
