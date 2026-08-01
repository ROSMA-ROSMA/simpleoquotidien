import { User, UserRole } from '@/types';

export const mockUsers: User[] = [
    {
        id: 1,
        email: 'admin@gmail.com',
        first_name: 'Super',
        last_name: 'Admin',
        phone_number: '0600000001',
        role: UserRole.ADMIN,
        is_active: true,
        is_verified: true,
        created_at: '2025-01-01T00:00:00',
    },
    {
        id: 2,
        email: 'sophie.martin@email.com',
        first_name: 'Sophie',
        last_name: 'Martin',
        phone_number: '0612345678',
        role: UserRole.CLIENT,
        is_active: true,
        is_verified: true,
        created_at: '2025-03-15T10:30:00',
    },
    {
        id: 3,
        email: 'thomas.ouedraogo@email.com',
        first_name: 'Thomas',
        last_name: 'Ouedraogo',
        phone_number: '0698765432',
        role: UserRole.PROVIDER,
        is_active: true,
        is_verified: true,
        insurance_status: true,
        identity_card_expiry_date: '2027-06-15',
        intervention_city: 'Ouagadougou',
        created_at: '2025-02-10T14:00:00',
    },
    {
        id: 4,
        email: 'amina.diallo@email.com',
        first_name: 'Amina',
        last_name: 'Diallo',
        phone_number: '0654321098',
        role: UserRole.PROVIDER,
        is_active: true,
        is_verified: true,
        insurance_status: false,
        identity_card_expiry_date: '2026-12-01',
        intervention_city: 'Ouagadougou',
        created_at: '2025-04-01T08:00:00',
    },
    {
        id: 5,
        email: 'jean.koffi@email.com',
        first_name: 'Jean',
        last_name: 'Koffi',
        phone_number: '0687654321',
        role: UserRole.CLIENT,
        is_active: true,
        is_verified: true,
        created_at: '2025-05-20T16:45:00',
    },
    {
        id: 6,
        email: 'fatou.bamba@email.com',
        first_name: 'Fatou',
        last_name: 'Bamba',
        phone_number: '0676543210',
        role: UserRole.PROVIDER,
        is_active: true,
        is_verified: false,
        insurance_status: true,
        identity_card_expiry_date: '2028-03-20',
        intervention_city: 'Bobo-Dioulasso',
        created_at: '2025-06-10T12:00:00',
    },
    {
        id: 7,
        email: 'aicha.kone@simpleoquotidien.com',
        first_name: 'Aïcha',
        last_name: 'Koné',
        phone_number: '0611223344',
        role: UserRole.AGENT,
        is_active: true,
        is_verified: true,
        intervention_city: 'Ouagadougou',
        created_at: '2025-01-15T09:00:00',
    },
];

export function getUserById(id: number): User | undefined {
    return mockUsers.find(u => u.id === id);
}

export function getUsersByRole(role: UserRole): User[] {
    return mockUsers.filter(u => u.role === role);
}

export function getPendingProviders(): User[] {
    return mockUsers.filter(u => u.role === UserRole.PROVIDER && !u.is_verified);
}
