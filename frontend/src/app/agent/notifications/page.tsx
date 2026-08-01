'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AgentLayout from '@/components/layout/AgentLayout';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { notificationService } from '@/services/notification.service';
import { AppNotification } from '@/types';
import { timeAgo } from '@/lib/utils';
import { IconBellRinging, IconCircleCheck } from '@tabler/icons-react';

export default function AgentNotificationsPage() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await notificationService.getAll();
            setNotifications(res.data);
        } catch { setNotifications([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const unread = notifications.filter(n => !n.is_read).length;

    const handleMarkRead = async (id: number) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
        try { await notificationService.markRead(id); } catch { load(); }
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try { await notificationService.markAllRead(); } catch { load(); }
    };

    if (loading) {
        return (
            <AgentLayout title="Notifications">
                <p className="text-slate-400">Chargement…</p>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout title="Notifications" subtitle={`${unread} non lue${unread !== 1 ? 's' : ''}`}>
            {unread > 0 && (
                <div className="flex justify-end mb-4">
                    <Button variant="ghost" size="sm" icon={<IconCircleCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
                        Tout marquer comme lu
                    </Button>
                </div>
            )}
            {notifications.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-50 overflow-hidden">
                    {notifications.map(n => (
                        <div key={n.id} className={`flex items-start gap-4 p-5 ${!n.is_read ? 'bg-brand-tealLight/10' : ''}`}>
                            <div className="w-10 h-10 rounded-xl bg-brand-tealLight text-brand-teal flex items-center justify-center shrink-0">
                                <IconBellRinging className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-brand-dark">{n.title}</p>
                                <p className="text-[11px] text-slate-500">{n.message}</p>
                                {n.link && <Link href={n.link} className="text-[11px] font-bold text-brand-teal hover:text-brand-tealDark">Voir →</Link>}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                                {!n.is_read && (
                                    <button onClick={() => handleMarkRead(n.id)} className="text-[11px] font-bold text-brand-teal hover:text-brand-tealDark">Marquer comme lu</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<IconBellRinging className="w-8 h-8" />} title="Aucune notification" description="Vos notifications apparaîtront ici." />
            )}
        </AgentLayout>
    );
}
