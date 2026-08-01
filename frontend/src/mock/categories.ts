import { Category } from '@/types';

export const mockCategories: Category[] = [
    {
        id: 1,
        name: 'Maison & Famille',
        description: 'Baby-sitting, Cuisine à domicile, Décoration intérieure, Aide aux seniors...',
        icon: 'home-heart',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    },
    {
        id: 2,
        name: 'Sécurité & Transport',
        description: 'Déménagement, Transport, Gardiennage, Courses & Livraison...',
        icon: 'truck-delivery',
        image: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800&q=80',
    },
    {
        id: 3,
        name: 'Location',
        description: 'Location de maison, Voiture, Sonorisation, Robes & costumes, Matériel événementiel...',
        icon: 'key',
        image: 'https://images.unsplash.com/photo-1581578731117-104f2a41272c?w=800&q=80',
    },
    {
        id: 4,
        name: 'Sécurité',
        description: 'Gardiennage, Garde rapprochée, Body Guard...',
        icon: 'shield',
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80',
    },
    {
        id: 5,
        name: 'Création & Média',
        description: 'Photographie, Vidéographie, Graphisme/Design, Dessin, Contenu digital...',
        icon: 'pen-tool',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    },
    {
        id: 6,
        name: 'Beauté & Bien-être',
        description: 'Manicure/Pédicure, Coiffure, Make Up, Spa, Massage, Soins du corps...',
        icon: 'heart',
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    },
    {
        id: 7,
        name: 'Réparations & Dépannages',
        description: 'Plomberie, Électricité, Mécanique, Soudure, Serrurerie...',
        icon: 'tool',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
    },
    {
        id: 8,
        name: 'Nettoyage & Entretien',
        description: 'Ménage, Nettoyage auto, Jardinage, Dératisation, Désinfection...',
        icon: 'wash',
        image: 'https://images.unsplash.com/photo-1581578731117-104f2a41272c?w=800&q=80',
    },
];

export function getCategoryById(id: number): Category | undefined {
    return mockCategories.find(c => c.id === id);
}
