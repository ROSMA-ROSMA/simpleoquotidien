import Link from 'next/link';
import { Category } from '@/types';
import { IconArrowRight } from '@tabler/icons-react';

interface CategoryCardProps {
    category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
    return (
        <Link href={`/services/category/${category.id}`} className="group block">
            <article className="relative bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-full">
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                    {category.image ? (
                        <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-brand-tealLight to-brand-surface flex items-center justify-center">
                            <span className="text-4xl">📁</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Icon overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/20">
                            <span className="text-lg">
                                {category.icon === 'home-heart' && '🏠'}
                                {category.icon === 'truck-delivery' && '🚚'}
                                {category.icon === 'key' && '🔑'}
                                {category.icon === 'shield' && '🛡️'}
                                {category.icon === 'pen-tool' && '🎨'}
                                {category.icon === 'heart' && '💅'}
                                {category.icon === 'tool' && '🔧'}
                                {category.icon === 'wash' && '🧹'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight">{category.name}</h3>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="p-5">
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{category.description}</p>
                    <div className="flex items-center gap-1 text-brand-teal font-bold text-sm group-hover:gap-2 transition-all">
                        Découvrir <IconArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </article>
        </Link>
    );
}
