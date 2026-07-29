/**
 * Simule un client HTTP vers un futur backend FastAPI.
 * Toutes les fonctions retournent des Promises avec une latence artificielle
 * et une enveloppe { data, meta } ou lèvent une ApiError — même contrat qu'un
 * vrai appel REST, pour permettre un branchement ultérieur sans réécriture.
 */

export class ApiError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

export interface ApiResponse<T> {
    data: T;
    meta?: { total?: number; page?: number; page_size?: number };
}

const MIN_LATENCY = 250;
const MAX_LATENCY = 550;

export function delay<T>(value: T): Promise<T> {
    const ms = MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

export function paginate<T>(items: T[], page = 1, pageSize = 10): ApiResponse<T[]> {
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return { data: pageItems, meta: { total: items.length, page, page_size: pageSize } };
}
