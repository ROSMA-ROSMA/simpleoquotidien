'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProviderProfile } from '@/hooks/useProviderProfile';
import { IconMenu2, IconX, IconSearch, IconCalendar, IconGrid3x3, IconLogout, IconBellRinging } from '@tabler/icons-react';

interface NavbarProps {
    activeTab?: string;
}

export default function Navbar({ activeTab }: NavbarProps) {
    const { currentUser, logout } = useAuth();
    const { profile } = useProviderProfile();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!currentUser) return null;

    const isClient = currentUser.role === 'client';
    const isProvider = currentUser.role === 'provider';
    const avatarPhoto = isProvider ? profile?.photo : undefined;

    const clientLinks = [
        { href: '/dashboard/client', label: 'Tableau de bord', icon: IconGrid3x3, id: 'dashboard' },
        { href: '/services', label: 'Réserver un service', icon: IconSearch, id: 'services' },
        { href: '/dashboard/client#bookings', label: 'Mes Réservations', icon: IconCalendar, id: 'bookings' },
    ];

    const providerLinks = [
        { href: '/dashboard/provider', label: 'Dashboard', icon: IconGrid3x3, id: 'dashboard' },
        { href: '/dashboard/provider/bookings', label: 'Réservations', icon: IconCalendar, id: 'bookings' },
        { href: '/dashboard/provider/services', label: 'Services', icon: IconSearch, id: 'services' },
        { href: '/dashboard/provider/notifications', label: 'Notifications', icon: IconBellRinging, id: 'notifications' },
    ];

    const links = isClient ? clientLinks : isProvider ? providerLinks : [];

    return (
        <header className="header-glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform transform group-hover:scale-105 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <span className="text-lg md:text-xl font-extrabold text-brand-teal tracking-tight">
                                Simple<span className="text-brand-coral">Ô</span>Quotidien
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        {isProvider ? (
                            <nav className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-full">
                                {links.map(link => (
                                    <Link
                                        key={link.id}
                                        href={link.href}
                                        className={`px-5 py-2 text-base font-medium rounded-full transition-all ${activeTab === link.id
                                                ? 'font-bold text-brand-teal bg-white shadow-sm'
                                                : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-brand-teal'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        ) : (
                            <nav className="hidden md:flex gap-6">
                                {links.map(link => (
                                    <Link
                                        key={link.id}
                                        href={link.href}
                                        className={`text-base font-medium transition-colors relative ${activeTab === link.id
                                                ? 'font-bold text-brand-teal after:absolute after:-bottom-8 after:left-0 after:right-0 after:h-0.5 after:bg-brand-teal'
                                                : 'text-slate-600 hover:text-brand-teal'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        )}
                    </div>

                    {/* Right: user info + logout */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                            <span className="text-base font-semibold text-slate-700">{currentUser.first_name}</span>
                            {avatarPhoto ? (
                                <img src={avatarPhoto} alt={currentUser.first_name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-sm ring-2 ring-white">
                                    {currentUser.first_name[0]}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={logout}
                            className="text-slate-500 hover:text-brand-coral transition-colors"
                            title="Se déconnecter"
                        >
                            <IconLogout className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? <IconX className="w-6 h-6" /> : <IconMenu2 className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 top-20 z-40 animate-in">
                    <div className="p-4 space-y-2">
                        {links.map(link => (
                            <Link
                                key={link.id}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-xl font-medium ${activeTab === link.id
                                        ? 'bg-brand-tealLight text-brand-teal font-bold'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-slate-100 my-2" />
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                {avatarPhoto ? (
                                    <img src={avatarPhoto} alt={currentUser.first_name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center font-bold text-sm ring-2 ring-white">
                                        {currentUser.first_name[0]}
                                    </div>
                                )}
                                <span className="text-base font-semibold text-slate-700">{currentUser.first_name}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="text-brand-coral font-medium text-base flex items-center gap-2 hover:text-brand-coralHover"
                            >
                                Déconnexion <IconLogout className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
