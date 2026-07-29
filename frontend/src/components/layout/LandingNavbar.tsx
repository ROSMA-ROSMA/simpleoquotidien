'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IconMenu2, IconX } from '@tabler/icons-react';

export default function LandingNavbar() {
    const { currentUser, isAuthenticated } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getDashboardLink = () => {
        if (!currentUser) return '/login';
        if (currentUser.role === 'admin') return '/dashboard/admin';
        if (currentUser.role === 'provider') return '/dashboard/provider';
        return '/dashboard/client';
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'nav-scrolled py-3' : 'glass-nav py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform transform group-hover:scale-105 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <span className="text-lg md:text-xl font-extrabold text-brand-teal tracking-tight">
                        Simple<span className="text-brand-coral">Ô</span>Quotidien
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                    <Link href="/" className="text-sm font-medium text-slate-700 hover:text-brand-teal transition-colors">
                        Accueil
                    </Link>
                    <Link href="/services" className="text-sm font-medium text-slate-700 hover:text-brand-teal transition-colors">
                        Services
                    </Link>
                    {isAuthenticated ? (
                        <Link
                            href={getDashboardLink()}
                            className="group px-5 py-2.5 bg-brand-teal text-white rounded-full text-sm font-semibold hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20 hover:shadow-brand-teal/30 hover:-translate-y-0.5"
                        >
                            Mon Espace
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-brand-teal transition-colors">
                                Connexion
                            </Link>
                            <Link
                                href="/register"
                                className="group px-5 py-2.5 bg-brand-teal text-white rounded-full text-sm font-semibold hover:bg-brand-tealDark transition-all shadow-lg shadow-brand-teal/20 hover:shadow-brand-teal/30 hover:-translate-y-0.5"
                            >
                                Inscription
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Menu"
                >
                    {mobileMenuOpen ? <IconX className="w-6 h-6" /> : <IconMenu2 className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 top-full z-40 animate-in">
                    <div className="p-4 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Accueil
                        </Link>
                        <Link
                            href="/services"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Services
                        </Link>
                        {isAuthenticated ? (
                            <Link
                                href={getDashboardLink()}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 text-sm font-bold text-white bg-brand-teal rounded-xl transition-colors text-center"
                            >
                                Mon Espace
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Connexion
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-3 text-sm font-bold text-white bg-brand-teal rounded-xl transition-colors text-center"
                                >
                                    Inscription
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
