/** URL du backend Django — utilisée uniquement côté serveur (Route Handlers). */
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const ACCESS_COOKIE = 'soq_access';
export const REFRESH_COOKIE = 'soq_refresh';

/** Durées cookies (secondes) — alignées sur SimpleJWT côté backend. */
export const ACCESS_MAX_AGE = 60 * 30; // 30 min
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours
