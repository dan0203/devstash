// Mock data for the dashboard UI. Single source of truth until a real database is wired up.

export interface User {
    id: string;
    name: string;
    email: string;
    isPro: boolean;
}

export const currentUser: User = {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'demo@devstash.io',
    isPro: false,
};
