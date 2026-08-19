'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useBookings } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useCategories';
import { userService } from '@/services/user.service';
import { providerService } from '@/services/provider.service';
import { categoryService } from '@/services/category.service';
import { serviceService } from '@/services/service.service';
import { reviewService } from '@/services/review.service';
import { formatPrice, formatDateTime, getRoleBadge, getBookingTitle } from '@/lib/utils';
import { BookingStatus, UserRole, BOOKING_STATUS_LABELS, PaymentStatus, User, Category, ProviderService } from '@/types';
import { BackendNote } from '@/types/backend';
import { IconUsers, IconBriefcase, IconCalendar, IconCurrencyDollar, IconPlus, IconEdit, IconCircleCheck, IconStar, IconEye, IconTrash, IconCheck, IconX, IconFileText, IconPhoto, IconAlertTriangle } from '@tabler/icons-react';

/* ──── Validation Sub-Component ──── */
function ValidationSection() {
    type ProviderRow = Awaited<ReturnType<typeof providerService.getProviders>>['data'][number];
    const [providers, setProviders] = useState<ProviderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [rejectTarget, setRejectTarget] = useState<ProviderRow | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<ProviderRow | null>(null);
    const [motif, setMotif] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await providerService.getProviders();
            setProviders(res.data);
        } catch { setProviders([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleValidate = async (id: number) => {
        setActionLoading(id);
        try {
            await providerService.validatePrestataire(id);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'VALIDE' } : p));
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setActionLoading(null); }
    };

    const confirmReject = async () => {
        if (!rejectTarget) return;
        const id = rejectTarget.id;
        setActionLoading(id);
        try {
            await providerService.rejectPrestataire(id, motif);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'REJETE' } : p));
            setRejectTarget(null);
            setMotif('');
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setActionLoading(null); }
    };

    const confirmSuspend = async () => {
        if (!suspendTarget) return;
        const id = suspendTarget.id;
        setActionLoading(id);
        try {
            await providerService.suspendPrestataire(id, motif);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'SUSPENDU' } : p));
            setSuspendTarget(null);
            setMotif('');
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setActionLoading(null); }
    };

    const statusBadge = (status: string) => {
        if (status === 'VALIDE') return <Badge variant="success">Validé</Badge>;
        if (status === 'REJETE') return <Badge variant="danger">Rejeté</Badge>;
        if (status === 'SUSPENDU') return <Badge variant="neutral">Suspendu</Badge>;
        return <Badge variant="warning">En attente</Badge>;
    };

    return (
        <div className="animate-in">
            <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Validations des prestataires</h1>
            {loading ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                    <p className="text-slate-400 text-lg">Chargement…</p>
                </div>
            ) : providers.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                    <p className="text-slate-400 text-lg">Aucun prestataire pour le moment</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {providers.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-xl font-bold text-brand-dark">{p.first_name} {p.last_name}</h3>
                                    {statusBadge(p.verification_status)}
                                </div>
                                <p className="text-base text-slate-500 mt-1">{p.email}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-base">
                                    <div>
                                        <span className="text-slate-400 text-sm font-bold uppercase">Entreprise</span>
                                        <p className="text-slate-700 font-medium">{p.company_name || '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-sm font-bold uppercase">Services</span>
                                        <p className="text-slate-700 font-medium">{p.services || '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-sm font-bold uppercase">Zone</span>
                                        <p className="text-slate-700 font-medium">{p.zones_couvertes || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-4 text-sm">
                                    {p.cni_passeport && (
                                        <a href={p.cni_passeport} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-teal font-semibold hover:underline">
                                            <IconFileText className="w-4 h-4" /> CNI / Passeport
                                        </a>
                                    )}
                                    {p.photo && (
                                        <a href={p.photo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-teal font-semibold hover:underline">
                                            <IconPhoto className="w-4 h-4" /> Photo
                                        </a>
                                    )}
                                </div>
                            </div>
                            {/* Zone d'action dédiée, bien visible et séparée du contenu */}
                            {p.verification_status !== 'REJETE' && p.verification_status !== 'SUSPENDU' && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 sm:px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                                    {p.verification_status === 'EN_ATTENTE' && (
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            fullWidth
                                            className="sm:w-auto !border-red-200 !text-red-500 hover:!bg-red-50 hover:!border-red-300"
                                            icon={<IconX className="w-5 h-5" />}
                                            onClick={() => { setMotif(''); setRejectTarget(p); }}
                                            disabled={actionLoading === p.id}
                                        >
                                            Rejeter
                                        </Button>
                                    )}
                                    {p.verification_status === 'VALIDE' && (
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            fullWidth
                                            className="sm:w-auto !border-amber-200 !text-amber-600 hover:!bg-amber-50 hover:!border-amber-300"
                                            icon={<IconAlertTriangle className="w-5 h-5" />}
                                            onClick={() => { setMotif(''); setSuspendTarget(p); }}
                                            disabled={actionLoading === p.id}
                                        >
                                            Suspendre
                                        </Button>
                                    )}
                                    {p.verification_status === 'EN_ATTENTE' && (
                                        <Button
                                            size="lg"
                                            fullWidth
                                            className="sm:w-auto"
                                            icon={<IconCheck className="w-5 h-5" />}
                                            onClick={() => handleValidate(p.id)}
                                            disabled={actionLoading === p.id}
                                        >
                                            Valider
                                        </Button>
                                    )}
                                </div>
                            )}
                            {/* Prestataire rejeté ou suspendu : seule la réactivation reste possible ici */}
                            {(p.verification_status === 'REJETE' || p.verification_status === 'SUSPENDU') && (
                                <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                                    <Button
                                        size="lg"
                                        icon={<IconCheck className="w-5 h-5" />}
                                        onClick={() => handleValidate(p.id)}
                                        disabled={actionLoading === p.id}
                                    >
                                        Réactiver (valider)
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal open={rejectTarget !== null} onClose={() => setRejectTarget(null)} title="Rejeter cette candidature ?">
                {rejectTarget && (
                    <div>
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                            <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                                Voulez-vous vraiment rejeter la candidature de{' '}
                                <span className="font-bold">{rejectTarget.first_name} {rejectTarget.last_name}</span> ?
                                Cette action est visible par le prestataire.
                            </p>
                        </div>
                        <label className="block mt-4 text-sm font-semibold text-slate-600">
                            Motif du rejet (visible par le prestataire)
                            <textarea
                                value={motif}
                                onChange={e => setMotif(e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-teal"
                                placeholder="Ex : documents illisibles, informations incomplètes…"
                            />
                        </label>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={actionLoading === rejectTarget.id}>
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={confirmReject} disabled={actionLoading === rejectTarget.id}>
                                {actionLoading === rejectTarget.id ? 'Rejet en cours…' : 'Confirmer le rejet'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={suspendTarget !== null} onClose={() => setSuspendTarget(null)} title="Suspendre ce prestataire ?">
                {suspendTarget && (
                    <div>
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                            <IconAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                                Voulez-vous vraiment suspendre{' '}
                                <span className="font-bold">{suspendTarget.first_name} {suspendTarget.last_name}</span> ?
                                Il ne pourra plus recevoir d&apos;assignation ni modifier son catalogue tant qu&apos;il n&apos;est pas réactivé.
                            </p>
                        </div>
                        <label className="block mt-4 text-sm font-semibold text-slate-600">
                            Motif de la suspension
                            <textarea
                                value={motif}
                                onChange={e => setMotif(e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-teal"
                                placeholder="Ex : plaintes clients répétées, comportement inapproprié…"
                            />
                        </label>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setSuspendTarget(null)} disabled={actionLoading === suspendTarget.id}>
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={confirmSuspend} disabled={actionLoading === suspendTarget.id}>
                                {actionLoading === suspendTarget.id ? 'Suspension en cours…' : 'Confirmer la suspension'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ──── Avis clients / Modération ──── */
function ReviewsModerationSection() {
    const [reviews, setReviews] = useState<BackendNote[]>([]);
    const [providerNames, setProviderNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BackendNote | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [reviewsList, providersRes] = await Promise.all([
                reviewService.getAll(),
                providerService.getProviders(),
            ]);
            const names: Record<number, string> = {};
            for (const p of providersRes.data) names[p.id] = p.company_name || `${p.first_name} ${p.last_name}`;
            setReviews(reviewsList);
            setProviderNames(names);
        } catch { setReviews([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        setActionLoading(id);
        try {
            await reviewService.remove(id);
            setReviews(prev => prev.filter(r => r.id !== id));
            setDeleteTarget(null);
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setActionLoading(null); }
    };

    const averageRating = reviews.length ? reviews.reduce((sum, r) => sum + r.etoile, 0) / reviews.length : 0;

    return (
        <div className="animate-in">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className="text-3xl font-extrabold text-brand-dark">Avis clients</h1>
                {!loading && reviews.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                        <IconStar className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {averageRating.toFixed(1)} de moyenne sur {reviews.length} avis
                    </span>
                )}
            </div>
            {loading ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                    <p className="text-slate-400 text-lg">Chargement…</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                    <p className="text-slate-400 text-lg">Aucun avis pour le moment</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base">
                            <thead className="bg-slate-50/60">
                                <tr>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Prestataire</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Client</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Note</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Commentaire</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Date</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...reviews]
                                    .sort((a, b) => (b.date_creation ?? '').localeCompare(a.date_creation ?? ''))
                                    .map(r => (
                                        <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50 align-top">
                                            <td className="py-3 px-4 font-medium text-slate-700">{providerNames[r.prestataire] ?? `#${r.prestataire}`}</td>
                                            <td className="py-3 px-4 text-slate-500">{r.author_email ?? '—'}</td>
                                            <td className="py-3 px-4"><span className="flex items-center gap-1 whitespace-nowrap"><IconStar className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {r.etoile}/5</span></td>
                                            <td className="py-3 px-4 text-slate-500 max-w-sm">{r.commentaire || <span className="italic text-slate-300">Sans commentaire</span>}</td>
                                            <td className="py-3 px-4 text-slate-400 text-sm whitespace-nowrap">{r.date_creation ? formatDateTime(r.date_creation) : '—'}</td>
                                            <td className="py-3 px-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={actionLoading === r.id}
                                                    onClick={() => setDeleteTarget(r)}
                                                    title="Supprimer cet avis (modération)"
                                                >
                                                    <IconTrash className="w-4 h-4 text-red-400" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Supprimer cet avis ?">
                {deleteTarget && (
                    <div>
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                            <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                                Voulez-vous vraiment supprimer cet avis
                                {deleteTarget.author_email ? <> de <span className="font-bold">{deleteTarget.author_email}</span></> : ''}
                                {' '}({deleteTarget.etoile}/5{deleteTarget.commentaire ? ` — "${deleteTarget.commentaire}"` : ''}) ?
                                Cette action est définitive.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={actionLoading === deleteTarget.id}>
                                Annuler
                            </Button>
                            <Button variant="danger" onClick={confirmDelete} disabled={actionLoading === deleteTarget.id}>
                                {actionLoading === deleteTarget.id ? 'Suppression…' : 'Confirmer la suppression'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}


export default function AdminDashboardPage() {
    const { currentUser } = useAuth();
    const [activeSection, setActiveSection] = useState('dashboard');

    // --- API data ---
    const { bookings, loading: bookingsLoading } = useBookings();
    const { categories, loading: categoriesLoading, reload: reloadCategories } = useCategories();
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [providerStatusByUserId, setProviderStatusByUserId] = useState<Record<number, string>>({});
    const [providerIdByUserId, setProviderIdByUserId] = useState<Record<number, number>>({});
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [userActionLoading, setUserActionLoading] = useState<number | null>(null);

    // --- Store data (no backend) ---
    const payments = useAppStore(s => s.payments);
    const [services, setServices] = useState<ProviderService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);

    const loadServices = useCallback(async () => {
        setServicesLoading(true);
        try {
            const res = await serviceService.getAll();
            setServices(res.data);
        } catch { setServices([]); }
        finally { setServicesLoading(false); }
    }, []);

    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res = await userService.getAll();
            setUsers(res.data);
        } catch { setUsers([]); }
        finally { setUsersLoading(false); }
    }, []);

    const loadProviderStatuses = useCallback(async () => {
        try {
            const res = await providerService.getProviders();
            const statusMap: Record<number, string> = {};
            const idMap: Record<number, number> = {};
            for (const p of res.data) { statusMap[p.user_id] = p.verification_status; idMap[p.user_id] = p.id; }
            setProviderStatusByUserId(statusMap);
            setProviderIdByUserId(idMap);
        } catch { setProviderStatusByUserId({}); setProviderIdByUserId({}); }
    }, []);

    useEffect(() => { loadUsers(); loadProviderStatuses(); loadServices(); }, [loadUsers, loadProviderStatuses, loadServices]);

    const pendingProviders = users.filter(u => u.role === UserRole.PROVIDER && providerStatusByUserId[u.id] === 'EN_ATTENTE');

    const filteredUsers = users.filter(u => {
        if (userRoleFilter && u.role !== userRoleFilter) return false;
        if (userStatusFilter) {
            const status = u.role === UserRole.PROVIDER ? (providerStatusByUserId[u.id] ?? 'VALIDE') : (u.is_active ? 'ACTIF' : 'INACTIF');
            if (status !== userStatusFilter) return false;
        }
        if (userSearch.trim()) {
            const q = userSearch.trim().toLowerCase();
            const haystack = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    const handleUserProviderAction = async (userId: number, action: 'validate' | 'suspend') => {
        const prestataireId = providerIdByUserId[userId];
        if (!prestataireId) return;
        setUserActionLoading(userId);
        try {
            if (action === 'validate') await providerService.validatePrestataire(prestataireId);
            else await providerService.suspendPrestataire(prestataireId);
            await loadProviderStatuses();
        } catch (e) { alert(e instanceof Error ? e.message : 'Erreur'); }
        finally { setUserActionLoading(null); }
    };

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-brand-dark mb-2">Accès réservé aux administrateurs</h1>
                    <Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link>
                </div>
            </div>
        );
    }

    const revenue = payments.filter(p => p.status === PaymentStatus.SUCCESS).reduce((sum, p) => sum + p.amount, 0);

    const handleDeleteCategory = async (id: number) => {
        try {
            await categoryService.delete(id);
            reloadCategories();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Erreur lors de la suppression');
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-surface">
            <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} pendingCount={pendingProviders.length} />

            <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 pt-20 md:pt-8 min-w-0">
                {/* Dashboard Overview */}
                {activeSection === 'dashboard' && (
                    <div className="animate-in">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Tableau de bord</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard label="Utilisateurs" value={usersLoading ? '…' : users.length} icon={<IconUsers className="w-6 h-6" />} color="teal" />
                            <StatCard label="Services Actifs" value={servicesLoading ? '…' : services.length} icon={<IconBriefcase className="w-6 h-6" />} color="teal" />
                            <StatCard label="Réservations" value={bookingsLoading ? '…' : bookings.length} icon={<IconCalendar className="w-6 h-6" />} color="coral" />
                            <StatCard label="Revenus" value={`${formatPrice(revenue)} F`} icon={<IconCurrencyDollar className="w-6 h-6" />} color="coral" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <StatCard label="En attente" value={bookings.filter(b => [BookingStatus.PENDING, BookingStatus.PROCESSING].includes(b.status)).length} icon={<IconCalendar className="w-6 h-6" />} color="coral" />
                            <StatCard label="Assignées" value={bookings.filter(b => [BookingStatus.ASSIGNED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(b.status)).length} icon={<IconCalendar className="w-6 h-6" />} color="teal" />
                            <StatCard label="Terminées" value={bookings.filter(b => [BookingStatus.COMPLETED, BookingStatus.CLOSED].includes(b.status)).length} icon={<IconCircleCheck className="w-6 h-6" />} color="teal" />
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                            <h2 className="text-lg font-bold text-brand-dark mb-4">Activité récente</h2>
                            <div className="space-y-3">
                                {bookingsLoading ? (
                                    <p className="text-base text-slate-400">Chargement…</p>
                                ) : (
                                    [...bookings].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 5).map(b => (
                                        <div key={b.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                            <div>
                                                <span className="font-semibold text-base text-slate-700">{getBookingTitle(b)}</span>
                                            </div>
                                            <Badge variant={b.status === BookingStatus.COMPLETED ? 'success' : b.status === BookingStatus.PENDING ? 'brandCoral' : 'brandTeal'}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Validations */}
                {activeSection === 'validations' && (
                    <ValidationSection />
                )}

                {/* Users */}
                {activeSection === 'users' && (
                    <div className="animate-in">
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                            <h1 className="text-3xl font-extrabold text-brand-dark">Utilisateurs</h1>
                            <Link href="/admin/users/create"><Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Ajouter</Button></Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <input
                                type="text"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Rechercher par nom ou email…"
                                className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal"
                            />
                            <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal">
                                <option value="">Tous les rôles</option>
                                <option value={UserRole.CLIENT}>Client</option>
                                <option value={UserRole.PROVIDER}>Prestataire</option>
                                <option value={UserRole.AGENT}>Agent</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                            <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal">
                                <option value="">Tous les statuts</option>
                                <option value="EN_ATTENTE">En attente</option>
                                <option value="VALIDE">Validé / Actif</option>
                                <option value="REJETE">Rejeté</option>
                                <option value="SUSPENDU">Suspendu</option>
                                <option value="INACTIF">Inactif</option>
                            </select>
                        </div>
                        {usersLoading ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Chargement des utilisateurs…</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Nom</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Email</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Rôle</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Statut</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Actions</th></tr></thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 px-4 text-center text-slate-400">Aucun utilisateur ne correspond à cette recherche.</td></tr>
                                        ) : filteredUsers.map(u => {
                                            const rb = getRoleBadge(u.role);
                                            const providerStatus = u.role === UserRole.PROVIDER ? providerStatusByUserId[u.id] : undefined;
                                            return (
                                                <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                                    <td className="py-3 px-4 font-medium text-slate-700">{u.first_name} {u.last_name}</td>
                                                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                                                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rb.bg} ${rb.text}`}>{u.role}</span></td>
                                                    <td className="py-3 px-4">
                                                        {providerStatus === 'EN_ATTENTE' ? (
                                                            <Badge variant="warning">En attente de validation</Badge>
                                                        ) : providerStatus === 'REJETE' ? (
                                                            <Badge variant="danger">Rejeté</Badge>
                                                        ) : providerStatus === 'SUSPENDU' ? (
                                                            <Badge variant="neutral">Suspendu</Badge>
                                                        ) : u.is_active ? (
                                                            <Badge variant="success">Actif</Badge>
                                                        ) : (
                                                            <Badge variant="danger">Inactif</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 flex gap-2">
                                                        <Link href={`/admin/users/edit/${u.id}`}><Button variant="ghost" size="sm"><IconEdit className="w-4 h-4" /></Button></Link>
                                                        {providerStatus === 'VALIDE' && (
                                                            <Button variant="ghost" size="sm" title="Suspendre" disabled={userActionLoading === u.id} onClick={() => handleUserProviderAction(u.id, 'suspend')}>
                                                                <IconAlertTriangle className="w-4 h-4 text-amber-500" />
                                                            </Button>
                                                        )}
                                                        {(providerStatus === 'SUSPENDU' || providerStatus === 'REJETE') && (
                                                            <Button variant="ghost" size="sm" title="Réactiver" disabled={userActionLoading === u.id} onClick={() => handleUserProviderAction(u.id, 'validate')}>
                                                                <IconCheck className="w-4 h-4 text-emerald-500" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Categories */}
                {activeSection === 'categories' && (
                    <div className="animate-in">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-extrabold text-brand-dark">Catégories</h1>
                            <Link href="/admin/categories/create"><Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Ajouter</Button></Link>
                        </div>
                        {categoriesLoading ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Chargement…</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Nom</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Description</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Actions</th></tr></thead>
                                    <tbody>
                                        {categories.map(c => (
                                            <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-medium text-slate-700">{c.name}</td>
                                                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{c.description}</td>
                                                <td className="py-3 px-4 flex gap-2">
                                                    <Link href={`/admin/categories/edit/${c.id}`}><Button variant="ghost" size="sm"><IconEdit className="w-4 h-4" /></Button></Link>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)}><IconTrash className="w-4 h-4 text-red-400" /></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Services — publiés par les prestataires via leur espace, en lecture depuis le backend */}
                {activeSection === 'services' && (
                    <div className="animate-in">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-extrabold text-brand-dark">Services Actifs</h1>
                        </div>
                        {servicesLoading ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Chargement des services…</p>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Aucun service publié pour le moment</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Catégorie</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Prestataire</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Ville</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Prix</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Actions</th></tr></thead>
                                    <tbody>
                                        {services.map(s => (
                                            <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-medium text-slate-700">{s.category_name ?? '—'}</td>
                                                <td className="py-3 px-4 text-slate-500">{s.prestataire_name ?? '—'}</td>
                                                <td className="py-3 px-4 text-slate-500">{s.city}</td>
                                                <td className="py-3 px-4 font-bold text-brand-teal">{formatPrice(s.price)} F</td>
                                                <td className="py-3 px-4 flex gap-2">
                                                    <Link href={`/service/${s.id}`}><Button variant="ghost" size="sm"><IconEye className="w-4 h-4" /></Button></Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bookings */}
                {activeSection === 'bookings' && (
                    <div className="animate-in">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-extrabold text-brand-dark">Réservations</h1>
                            <Link href="/admin/bookings/create"><Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Ajouter</Button></Link>
                        </div>
                        {bookingsLoading ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Chargement…</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">#</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Service</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Date</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Statut</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Montant</th></tr></thead>
                                    <tbody>
                                        {bookings.map(b => (
                                            <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-medium text-slate-700">
                                                    <Link href={`/booking/${b.id}`} className="hover:text-brand-teal">#{b.id}</Link>
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">{getBookingTitle(b)}</td>
                                                <td className="py-3 px-4 text-slate-500">{formatDateTime(b.scheduled_datetime)}</td>
                                                <td className="py-3 px-4"><Badge variant={b.status === BookingStatus.COMPLETED ? 'success' : b.status === BookingStatus.PENDING ? 'brandCoral' : b.status === BookingStatus.CANCELLED ? 'danger' : 'brandTeal'}>{BOOKING_STATUS_LABELS[b.status]}</Badge></td>
                                                <td className="py-3 px-4 font-bold text-brand-teal">{formatPrice(b.total_amount)} F</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Payments — pas de backend, reste sur le store */}
                {activeSection === 'payments' && (
                    <div className="animate-in">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Paiements</h1>
                        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                            <table className="w-full text-base">
                                <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Ref</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Réservation</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Méthode</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Montant</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Statut</th></tr></thead>
                                <tbody>
                                    {payments.map(p => (
                                        <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-4 font-mono text-slate-700">{p.transaction_ref || '-'}</td>
                                            <td className="py-3 px-4 text-slate-500">#{p.booking_id}</td>
                                            <td className="py-3 px-4 text-slate-500 capitalize">{p.payment_method.replace('_', ' ')}</td>
                                            <td className="py-3 px-4 font-bold text-brand-teal">{formatPrice(p.amount)} F</td>
                                            <td className="py-3 px-4"><Badge variant={p.status === 'success' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>{p.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Avis clients — modération admin, données réelles (Notes API) */}
                {activeSection === 'reviews' && (
                    <ReviewsModerationSection />
                )}
            </main>
        </div>
    );
}
