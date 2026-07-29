import Link from 'next/link';
import { Service } from '@/types';
import { formatPrice } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import { IconMapPin, IconUser } from '@tabler/icons-react';

interface ServiceCardProps {
    service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
    return (
        <Link href={`/service/${service.id}`} className="group block">
            <article className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                    {service.image ? (
                        <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-tealLight to-brand-mint/20 flex items-center justify-center">
                            <span className="text-4xl">🔧</span>
                        </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                        <span className="text-sm font-extrabold text-brand-teal">{formatPrice(service.price)} FCFA</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="font-bold text-brand-dark text-lg mb-1 group-hover:text-brand-teal transition-colors line-clamp-1">
                        {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{service.description}</p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <StarRating rating={service.rating} size="sm" />
                            <span className="text-xs text-slate-400 ml-1">({service.review_count})</span>
                        </div>
                        {service.provider && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <IconUser className="w-3.5 h-3.5" />
                                <span>{service.provider.first_name}</span>
                            </div>
                        )}
                    </div>

                    {service.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                            <IconMapPin className="w-3.5 h-3.5" />
                            <span>{service.location}</span>
                        </div>
                    )}
                </div>
            </article>
        </Link>
    );
}
