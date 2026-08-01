import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brandTeal' | 'brandCoral';
    children: ReactNode;
    className?: string;
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
    const variants = {
        default: 'bg-brand-tealLight text-brand-teal',
        success: 'bg-green-50 text-green-600 border border-green-100',
        warning: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
        danger: 'bg-red-50 text-red-600 border border-red-100',
        info: 'bg-blue-50 text-blue-600 border border-blue-100',
        neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
        brandTeal: 'bg-brand-tealLight text-brand-teal border border-brand-teal/10',
        brandCoral: 'bg-orange-50 text-brand-coral border border-orange-100',
    };

    return (
        <span
            className={cn(
                'px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide inline-flex items-center gap-1',
                variants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
