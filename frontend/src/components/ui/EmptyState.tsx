import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-1">{title}</h3>
            {description && (
                <p className="text-slate-500 text-sm mb-6">{description}</p>
            )}
            {action}
        </div>
    );
}
