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
import { formatPrice, formatDateTime, getRoleBadge, getBookingTitle } from '@/lib/utils';
import { BookingStatus, UserRole, BOOKING_STATUS_LABELS, PaymentStatus, User, Category, ProviderService } from '@/types';
import { IconUsers, IconBriefcase, IconCalendar, IconCurrencyDollar, IconPlus, IconEdit, IconCircleCheck, IconStar, IconEye, IconTrash, IconCheck, IconX, IconFileText, IconPhoto, IconAlertTriangle } from '@tabler/icons-react';

/* ──── Validation Sub-Component ──── */
function ValidationSection() {
    type ProviderRow = Awaited<ReturnType<typeof providerService.getProviders>>['data'][number];
    const [providers, setProviders] = useState<ProviderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [rejectTarget, setRejectTarget] = useState<ProviderRow | null>(null);

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
            await providerService.rejectPrestataire(id);
            setProviders(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'REJETE' } : p));
            setRejectTarget(null);
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
                            {/* Zone d'action dédiée, bien visible et séparée du contenu — uniquement pour les candidatures en attente */}
                            {p.verification_status === 'EN_ATTENTE' && (
                                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="!border-red-200 !text-red-500 hover:!bg-red-50 hover:!border-red-300"
                                        icon={<IconX className="w-5 h-5" />}
                                        onClick={() => setRejectTarget(p)}
                                        disabled={actionLoading === p.id}
                                    >
                                        Rejeter
                                    </Button>
                                    <Button
                                        size="lg"
                                        icon={<IconCheck className="w-5 h-5" />}
                                        onClick={() => handleValidate(p.id)}
                                        disabled={actionLoading === p.id}
                                    >
                                        Valider
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

    // --- Store data (no backend) ---
    const payments = useAppStore(s => s.payments);
    const reviews = useAppStore(s => s.reviews);
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
            const map: Record<number, string> = {};
            for (const p of res.data) map[p.user_id] = p.verification_status;
            setProviderStatusByUserId(map);
        } catch { setProviderStatusByUserId({}); }
    }, []);

    useEffect(() => { loadUsers(); loadProviderStatuses(); loadServices(); }, [loadUsers, loadProviderStatuses, loadServices]);

    const pendingProviders = users.filter(u => u.role === UserRole.PROVIDER && providerStatusByUserId[u.id] === 'EN_ATTENTE');

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

            <main className="flex-1 ml-64 p-8">
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
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-extrabold text-brand-dark">Utilisateurs</h1>
                            <Link href="/admin/users/create"><Button size="sm" icon={<IconPlus className="w-4 h-4" />}>Ajouter</Button></Link>
                        </div>
                        {usersLoading ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-card border border-slate-100">
                                <p className="text-slate-400 text-lg">Chargement des utilisateurs…</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                                <table className="w-full text-base">
                                    <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Nom</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Email</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Rôle</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Statut</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Actions</th></tr></thead>
                                    <tbody>
                                        {users.map(u => {
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
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
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
                        )}
                    </div>
                )}

                {/* Payments — pas de backend, reste sur le store */}
                {activeSection === 'payments' && (
                    <div className="animate-in">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Paiements</h1>
                        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
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
                )}

                {/* Reviews — pas de backend list, reste sur le store */}
                {activeSection === 'reviews' && (
                    <div className="animate-in">
                        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Avis</h1>
                        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                            <table className="w-full text-base">
                                <thead className="bg-slate-50/60"><tr><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Service</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Note</th><th className="text-left py-3 px-4 font-bold text-slate-400 uppercase text-xs">Commentaire</th></tr></thead>
                                <tbody>
                                    {reviews.map(r => (
                                        <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-4 font-medium text-slate-700">{r.author_username ?? `Avis #${r.id}`}</td>
                                            <td className="py-3 px-4"><span className="flex items-center gap-1"><IconStar className="w-4 h-4 text-brand-coral" /> {r.rating}</span></td>
                                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
