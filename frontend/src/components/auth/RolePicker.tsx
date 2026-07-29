'use client';

import { cn } from '@/lib/utils';
import { IconUser, IconBriefcase } from '@tabler/icons-react';

interface RolePickerProps {
    selectedRole: 'client' | 'provider';
    onChange: (role: 'client' | 'provider') => void;
}

export default function RolePicker({ selectedRole, onChange }: RolePickerProps) {
    const roles = [
        {
            value: 'client' as const,
            label: 'Client',
            description: 'Je cherche un prestataire',
            icon: <IconUser className="w-6 h-6" />,
        },
        {
            value: 'provider' as const,
            label: 'Prestataire',
            description: 'Je propose mes services',
            icon: <IconBriefcase className="w-6 h-6" />,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {roles.map(role => (
                <button
                    key={role.value}
                    type="button"
                    onClick={() => onChange(role.value)}
                    className={cn(
                        'relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group',
                        selectedRole === role.value
                            ? 'border-brand-teal bg-brand-tealLight shadow-md shadow-brand-teal/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    )}
                >
                    <div
                        className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300',
                            selectedRole === role.value
                                ? 'bg-brand-teal text-white scale-110'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        )}
                    >
                        {role.icon}
                    </div>
                    <h3 className={cn(
                        'font-bold text-lg mb-1',
                        selectedRole === role.value ? 'text-brand-teal' : 'text-brand-dark'
                    )}>
                        {role.label}
                    </h3>
                    <p className="text-xs text-slate-500">{role.description}</p>

                    {/* Checkmark */}
                    <div className={cn(
                        'absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedRole === role.value
                            ? 'border-brand-teal bg-brand-teal text-white scale-100'
                            : 'border-slate-300 scale-75 opacity-0'
                    )}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </button>
            ))}
        </div>
    );
}
