import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    color?: 'teal' | 'emerald' | 'amber' | 'coral' | 'blue';
    className?: string;
}

export default function StatCard({ label, value, icon, color = 'teal', className }: StatCardProps) {
    const colorMap = {
        teal: {
            bg: 'bg-brand-tealLight',
            border: 'border-brand-teal/10',
            text: 'text-brand-teal',
            iconBg: 'bg-brand-tealLight',
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-600',
            iconBg: 'bg-emerald-50',
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-600',
            iconBg: 'bg-amber-50',
        },
        coral: {
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            text: 'text-brand-coral',
            iconBg: 'bg-orange-50',
        },
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-600',
            iconBg: 'bg-blue-50',
        },
    };

    const c = colorMap[color];

    return (
        <div className={cn(`stat-card ${c.bg} rounded-xl p-6 border ${c.border}`, className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-base font-bold ${c.text} mb-1.5`}>{label}</p>
                    <p className="text-4xl font-extrabold text-brand-dark">{value}</p>
                </div>
                {icon && (
                    <div className={`w-14 h-14 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                        <span className={c.text}>{icon}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
