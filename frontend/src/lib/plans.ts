/**
 * Plans d'abonnement prestataire — définis dans le Business Model Canvas
 * (section 5.1 « Abonnements prestataires »). `id` correspond à la valeur
 * numérique stockée dans Subscription.plan côté backend.
 */

export type PlanId = 0 | 1 | 2 | 3;

export interface Plan {
    id: PlanId;
    slug: string;
    name: string;
    tagline: string;
    /** Prix mensuel en FCFA. `null` = sur devis (Enterprise). */
    price: number | null;
    priceNote?: string;
    target: string;
    highlight?: boolean;
    features: string[];
    limits?: string;
    supportDelay: string;
}

export const PLANS: Plan[] = [
    {
        id: 0,
        slug: 'decouverte',
        name: 'Gratuit — Découverte',
        tagline: 'Tester la plateforme sans risque',
        price: 0,
        target: 'Prestataire qui teste',
        features: [
            '3 leads par mois',
            'Profil basique (sans badge)',
            'Devis simple envoyable au client',
            'Notifications WhatsApp',
            'Support communautaire',
        ],
        limits: 'Leads plafonnés à 3/mois, aucune statistique de profil.',
        supportDelay: 'Communauté',
    },
    {
        id: 1,
        slug: 'eclaireur',
        name: 'Starter — Éclaireur',
        tagline: 'Un flux régulier de missions',
        price: 10000,
        target: 'Indépendant actif',
        highlight: true,
        features: [
            'Leads illimités (catégorie + zone)',
            'Badge « Vérifié + »',
            'Position prioritaire dans les recherches',
            'Statistiques de base (vues, missions, note)',
            'Support email — réponse sous 48h',
        ],
        limits: 'Un seul profil, pas de rapports avancés ni d\u2019export.',
        supportDelay: 'Email (48h)',
    },
    {
        id: 2,
        slug: 'selecteur',
        name: 'Business — Sélecteur',
        tagline: 'Gérer une petite équipe de techniciens',
        price: 30000,
        target: 'Petite entreprise (2-5 techniciens)',
        features: [
            'Profils illimités, rôles et permissions',
            'Accès prioritaire aux leads',
            'Rapports de performance (CA, taux d\u2019acceptation…)',
            'Export CSV/PDF',
            'Support prioritaire — réponse sous 24h',
        ],
        limits: 'Pas de vue multi-agences, pas d\u2019API ni de journal d\u2019audit.',
        supportDelay: 'Prioritaire (24h)',
    },
    {
        id: 3,
        slug: 'strategiste',
        name: 'Enterprise — Stratège',
        tagline: 'Réseaux, franchises, grandes structures',
        price: null,
        priceNote: 'Sur devis, dès 100 000 FCFA/mois',
        target: 'Grande structure, réseau, franchise',
        features: [
            'Vue multi-entités (dashboard consolidé)',
            'Accès exclusif à certains appels d\u2019offres',
            'API REST dédiée (CRM, ERP, facturation)',
            'Facturation centralisée',
            'Journal d\u2019audit complet',
            'Support dédié — réponse sous 4h + formation incluse',
        ],
        supportDelay: 'Dédié (4h)',
    },
];

export function getPlan(id: number): Plan | undefined {
    return PLANS.find(p => p.id === id);
}

export function getPlanBySlug(slug: string): Plan | undefined {
    return PLANS.find(p => p.slug === slug);
}

export interface PlanAddon {
    id: string;
    label: string;
    price: number;
    description: string;
}

/** Options payantes complémentaires (BMC §5.1) — cumulables avec un plan payant. */
export const PLAN_ADDONS: PlanAddon[] = [
    { id: 'visibilite', label: 'Visibilité renforcée', price: 5000, description: 'Placement en tête de liste dans sa catégorie, au-dessus des autres abonnés.' },
    { id: 'multi_villes', label: 'Multi-villes', price: 3000, description: 'Couverture de plusieurs villes (ex. Ouagadougou + Bobo-Dioulasso) sans changer de plan.' },
    { id: 'sms', label: 'SMS illimités', price: 2000, description: 'Notifications par SMS en plus de WhatsApp (utile en cas de coupure internet).' },
];

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
    ACTIF: 'Actif',
    EN_ATTENTE: 'En attente',
    EXPIRE: 'Expiré',
    ANNULE: 'Annulé',
};
