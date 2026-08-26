import Link from 'next/link';
import { ProviderService } from '@/types';
import { IconMapPin } from '@tabler/icons-react';

interface RealServiceCardProps {
    service: ProviderService;
}

/** Carte pour un service réel (backend), à ne pas confondre avec ServiceCard (données mock).
 * Il n'existe pas de nom de service dédié en base : le nom de la catégorie en tient lieu.
 * Ni le prix ni le nom de l'entreprise du prestataire ne sont affichés ici (vitrine
 * générale des services populaires, pas une fiche prestataire). */
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
                </div>

                <div className="p-5">
                    <h3 className="font-bold text-brand-dark text-lg mb-1 group-hover:text-brand-teal transition-colors line-clamp-1">
                        {service.category_name ?? 'Service'}
                    </h3>
                    {service.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{service.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <IconMapPin className="w-3.5 h-3.5" />
                        <span>{service.city}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}
