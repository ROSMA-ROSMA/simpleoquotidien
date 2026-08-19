'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AgentLayout from '@/components/layout/AgentLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProviderRating from '@/components/reviews/ProviderRating';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { reviewService, RatingSummary } from '@/services/review.service';
import { getInitials, getBookingTitle } from '@/lib/utils';
import { Booking, Provider } from '@/types';
import { IconArrowLeft, IconSearch, IconMapPin, IconUserCheck, IconScale, IconX } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

type SortMode = 'rating_desc' | 'price_asc' | 'price_desc';
const MAX_COMPARE = 4;
const emptyRating: RatingSummary = { average: 0, count: 0 };

function priceOf(p: Provider): number {
    const n = parseFloat(String(p.tarif).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

export default function AssignationPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { currentUser } = useAuth();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [ratings, setRatings] = useState<Map<number, RatingSummary>>(new Map());
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssigningId] = useState<number | null>(null);

    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [sort, setSort] = useState<SortMode>('rating_desc');
    const [compareIds, setCompareIds] = useState<number[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [bookingRes, providersRes, ratingsMap] = await Promise.all([
                    orderService.getById(id),
                    providerService.getProviders(),
                    reviewService.getSummaryByProvider().catch(() => new Map<number, RatingSummary>()),
                ]);
                setBooking(bookingRes.data);
                setCity(bookingRes.data.intervention_city ?? '');
                setProviders(providersRes.data);
                setRatings(ratingsMap);
            } catch {
                setBooking(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const ratingOf = useCallback((providerId: number) => ratings.get(providerId) ?? emptyRating, [ratings]);

    const cities = useMemo(() => {
        const set = new Set<string>();
        providers.forEach(p => p.zones_couvertes?.split(/[,;]/).forEach(z => { const t = z.trim(); if (t) set.add(t); }));
        return Array.from(set).sort();
    }, [providers]);

    const filtered = useMemo(() => {
        let list = providers.filter(p => p.verification_status === 'VALIDE');
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                `${p.first_name} ${p.last_name} ${p.company_name} ${p.services}`.toLowerCase().includes(q),
            );
        }
        if (city.trim()) {
            const q = city.toLowerCase();
            list = list.filter(p => p.zones_couvertes?.toLowerCase().includes(q));
        }
        list = [...list].sort((a, b) => {
            if (sort === 'price_asc') return priceOf(a) - priceOf(b);
            if (sort === 'price_desc') return priceOf(b) - priceOf(a);
            return ratingOf(b.id).average - ratingOf(a.id).average;
        });
        return list;
    }, [providers, search, city, sort, ratingOf]);

    const compared = useMemo(() => providers.filter(p => compareIds.includes(p.id)), [providers, compareIds]);

    const toggleCompare = useCallback((providerId: number) => {
        setCompareIds(prev => {
            if (prev.includes(providerId)) return prev.filter(x => x !== providerId);
            if (prev.length >= MAX_COMPARE) return prev;
            return [...prev, providerId];
        });
    }, []);

    const handleAssign = useCallback(async (providerId: number) => {
        if (!currentUser || !booking) return;
        setAssigningId(providerId);
        try {
            await orderService.assignProvider({ id: booking.id, uuid: id }, providerId, currentUser.id);
            router.push(`/agent/commandes/${id}`);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Erreur lors de l’assignation');
            setAssigningId(null);
        }
    }, [id, booking, currentUser, router]);

    if (loading) {
        return (
            <AgentLayout title="Chargement…">
                <p className="text-slate-400">Chargement…</p>
            </AgentLayout>
        );
    }

    if (!booking) {
        return (
            <AgentLayout title="Commande introuvable">
                <Link href="/agent/commandes" className="text-brand-teal font-bold">← Retour aux commandes</Link>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout title="Assignation d'un prestataire" subtitle="Trouvez le prestataire idéal">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Link href={`/agent/commandes/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium text-sm transition-colors">
                    <IconArrowLeft className="w-4 h-4" /> Retour à la commande
                </Link>
                <Badge variant="default">Commande #SQ-{booking.id}</Badge>
                <span className="text-sm text-slate-400">{booking.client ? `${booking.client.first_name} ${booking.client.last_name} · ` : ''}{getBookingTitle(booking)}{booking.intervention_city ? ` · ${booking.intervention_city}` : ''}</span>
            </div>

            {showCompare && compared.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-brand-teal/30 overflow-hidden mb-6">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-brand-dark flex items-center gap-2"><IconScale className="w-4 h-4 text-brand-teal" /> Comparaison ({compared.length})</span>
                        <button onClick={() => setShowCompare(false)} className="text-slate-400 hover:text-brand-coral"><IconX className="w-4 h-4" /></button>
                    </div>
                    <div className="p-5 overflow-x-auto">
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(220px, 1fr))` }}>
                            {compared.map(p => (
                                <div key={p.id} className="rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold shrink-0">
                                            {getInitials(p.first_name, p.last_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-brand-dark text-sm truncate">{p.first_name} {p.last_name}</p>
                                            <p className="text-sm text-slate-400 truncate">{p.company_name}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center border-t border-slate-50 pt-2"><span className="text-slate-400">Note</span><ProviderRating average={ratingOf(p.id).average} count={ratingOf(p.id).count} /></div>
                                        <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Tarif</span><span className="font-bold text-brand-teal">{p.tarif || '—'}</span></div>
                                        <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Zones</span><span className="font-semibold text-slate-700 text-right">{p.zones_couvertes || '—'}</span></div>
                                        <div className="flex justify-between border-t border-slate-50 pt-2"><span className="text-slate-400">Langue</span><span className="font-semibold text-slate-700">{p.langue || '—'}</span></div>
                                        <div className="border-t border-slate-50 pt-2"><span className="text-slate-400 block mb-1">Services</span><span className="font-semibold text-slate-700">{p.services || '—'}</span></div>
                                    </div>
                                    <Button
                                        size="sm"
                                        fullWidth
                                        icon={<IconUserCheck className="w-4 h-4" />}
                                        disabled={assigningId === p.id}
                                        onClick={() => handleAssign(p.id)}
                                    >
                                        {assigningId === p.id ? 'Assignation…' : 'Assigner celui-ci'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <span className="font-bold text-brand-dark">Recherche de prestataires</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">{filtered.length} prestataire{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</span>
                        {compareIds.length > 0 && (
                            <Button size="sm" variant="secondary" icon={<IconScale className="w-4 h-4" />} onClick={() => setShowCompare(true)}>
                                Comparer ({compareIds.length})
                            </Button>
                        )}
                    </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr] gap-3 border-b border-slate-100">
                    <div className="relative">
                        <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nom, entreprise, spécialité…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal"
                        />
                    </div>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal">
                        <option value="">Toutes les villes</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal">
                        <option value="rating_desc">Trier par note</option>
                        <option value="price_asc">Trier par prix croissant</option>
                        <option value="price_desc">Trier par prix décroissant</option>
                    </select>
                </div>

                <div className="p-5">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">Aucun prestataire disponible pour ces critères.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(p => {
                                const isCompared = compareIds.includes(p.id);
                                return (
                                    <div key={p.id} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${isCompared ? 'border-brand-teal' : 'border-slate-100 hover:border-brand-teal/40'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold shrink-0">
                                                {getInitials(p.first_name, p.last_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-brand-dark text-sm truncate">{p.first_name} {p.last_name}</p>
                                                <p className="text-sm text-slate-400 truncate">{p.company_name || p.services}</p>
                                            </div>
                                            <label className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer shrink-0" title="Sélectionner pour comparer">
                                                <input
                                                    type="checkbox"
                                                    checked={isCompared}
                                                    disabled={!isCompared && compareIds.length >= MAX_COMPARE}
                                                    onChange={() => toggleCompare(p.id)}
                                                    className="w-4 h-4 accent-brand-teal"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                                            <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><IconMapPin className="w-3.5 h-3.5" />{p.zones_couvertes || 'Ville non renseignée'}</span>
                                            <Badge variant="default">Vérifié</Badge>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div>
                                                <p className="text-sm text-slate-400 uppercase font-bold">À partir de</p>
                                                <p className="text-brand-teal font-extrabold">{p.tarif || '—'}</p>
                                            </div>
                                            <ProviderRating average={ratingOf(p.id).average} count={ratingOf(p.id).count} />
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Link href={`/agent/prestataire/${p.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" fullWidth>Profil</Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                fullWidth
                                                icon={<IconUserCheck className="w-4 h-4" />}
                                                disabled={assigningId === p.id}
                                                onClick={() => handleAssign(p.id)}
                                            >
                                                {assigningId === p.id ? 'Assignation…' : 'Assigner'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AgentLayout>
    );
}
