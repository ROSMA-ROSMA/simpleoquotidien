import Link from 'next/link';
import { ProviderService } from '@/types';
import { formatPrice } from '@/lib/utils';
import { IconMapPin, IconUser } from '@tabler/icons-react';

interface RealServiceCardProps {
    service: ProviderService;
}

/** Carte pour un service réel (backend), à ne pas confondre avec ServiceCard (données mock). */
export default function RealServiceCard({ service }: RealServiceCardProps) {
    return (
        <Link href={`/services/category/${service.category_id}`} className="group block">
            <article className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                    {service.image ? (
                        <img
                            src={service.image}
                            alt={service.category_name ?? 'Service'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-tealLight to-brand-mint/20 flex items-center justify-center">
                            <span className="text-4xl">🔧</span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                        <span className="text-sm font-extrabold text-brand-teal">{formatPrice(service.price)} FCFA</span>
                    </div>
                </div>

                <div className="p-5">
                    <h3 className="font-bold text-brand-dark text-lg mb-1 group-hover:text-brand-teal transition-colors line-clamp-1">
                        {service.category_name ?? 'Service'}
                    </h3>
                    {service.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{service.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                        {service.prestataire_name && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <IconUser className="w-3.5 h-3.5" />
                                <span>{service.prestataire_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <IconMapPin className="w-3.5 h-3.5" />
                            <span>{service.city}</span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
