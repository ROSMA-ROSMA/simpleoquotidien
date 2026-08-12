import Link from 'next/link';
import { Booking, BookingStatus, BOOKING_STATUS_LABELS } from '@/types';
import { formatPrice, formatDateTime, getBookingTitle } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { IconCalendar, IconUser, IconMapPin, IconCreditCard, IconCircleCheck, IconClock, IconMicrophone } from '@tabler/icons-react';

interface BookingCardProps {
    booking: Booking;
    showPayButton?: boolean;
    showActions?: boolean;
    role?: 'client' | 'provider';
}

export default function BookingCard({ booking, showPayButton = false, showActions = true, role = 'client' }: BookingCardProps) {
    const statusVariant = () => {
        switch (booking.status) {
            case BookingStatus.CONFIRMED: return 'info' as const;
            case BookingStatus.PENDING: return 'warning' as const;
            case BookingStatus.COMPLETED: return 'success' as const;
            case BookingStatus.CANCELLED:
            case BookingStatus.REJECTED: return 'danger' as const;
            default: return 'neutral' as const;
        }
    };

    const isPaid = booking.payment?.status === 'success';
    const isPending = booking.payment?.status === 'pending';

    return (
        <article className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-card-hover transition-all duration-300 group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-brand-dark group-hover:text-brand-teal transition-colors">
                            {getBookingTitle(booking)}
                        </h3>
                        {role !== 'client' && <Badge variant={statusVariant()}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md">
                            <IconCalendar className="w-3.5 h-3.5 text-brand-mint" />
                            {formatDateTime(booking.scheduled_datetime)}
                        </div>
                        {role === 'client' && (booking.assigned_provider ?? booking.service?.provider) && (
                            <div className="flex items-center gap-2">
                                <IconUser className="w-3.5 h-3.5 text-slate-400" />
                                {(booking.assigned_provider ?? booking.service?.provider)?.first_name}
                            </div>
                        )}
                        {role === 'provider' && booking.client && (
                            <div className="flex items-center gap-2">
                                <IconUser className="w-3.5 h-3.5 text-slate-400" />
                                {booking.client.first_name}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                            {booking.address}
                        </div>
                        {booking.audio_note && (
                            <div className="flex items-center gap-1.5 bg-brand-tealLight text-brand-teal px-2 py-1 rounded-md font-semibold">
                                <IconMicrophone className="w-3.5 h-3.5" /> Message vocal
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Price + Actions */}
                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <div className="text-right">
                        <span className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Montant</span>
                        <span className="text-xl font-extrabold text-brand-teal">{formatPrice(booking.total_amount)} FCFA</span>
                    </div>

                    {/* Payment status */}
                    {isPaid && (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">
                            <IconCircleCheck className="w-3.5 h-3.5" /> Payé
                        </div>
                    )}
                    {isPending && (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100">
                            <IconClock className="w-3.5 h-3.5" /> Validation
                        </div>
                    )}
                    {showPayButton && !isPaid && !isPending && booking.status === BookingStatus.CONFIRMED && (
                        <Link
                            href={`/payment/initiate/${booking.id}`}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-brand-coral hover:bg-brand-coralHover text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-coral/20 transition-all hover:-translate-y-0.5"
                        >
                            <IconCreditCard className="w-4 h-4" /> Payer
                        </Link>
                    )}

                    {/* Actions */}
                    {showActions && (
                        <div className="flex gap-3 text-xs font-bold">
                            <Link href={`/booking/${booking.uuid ?? booking.id}`} className="text-slate-500 hover:text-brand-teal transition-colors">
                                Détails
                            </Link>
                            {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && (
                                <Link href={`/booking/${booking.uuid ?? booking.id}`} className="text-slate-400 hover:text-brand-coral transition-colors">
                                    Annuler
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
