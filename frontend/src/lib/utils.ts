import { Booking } from '@/types';

export function getBookingTitle(booking: Booking): string {
    return booking.category_name ?? booking.category?.name ?? booking.service?.name ?? `Commande #${booking.id}`;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getAvatarUrl(firstName: string, lastName: string): string {
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=E0F2F1&color=005B52&bold=true`;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
        pending: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        in_progress: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
        completed: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
        cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
        rejected: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
        postponed: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
        success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    };
    return colors[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
}

export function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days} j`;
    return formatDate(dateStr);
}

export function getRoleBadge(role: string): { bg: string; text: string } {
    const badges: Record<string, { bg: string; text: string }> = {
        admin: { bg: 'bg-red-100', text: 'text-red-800' },
        agent: { bg: 'bg-purple-100', text: 'text-purple-800' },
        provider: { bg: 'bg-blue-100', text: 'text-blue-800' },
        client: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    return badges[role] ?? { bg: 'bg-gray-100', text: 'text-gray-800' };
}
