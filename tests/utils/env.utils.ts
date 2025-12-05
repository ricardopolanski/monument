export const BASE_URL =
  process.env.BASE_URL ?? 'https://monument.stg.monument.io';

export const CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'rpolanski@live.com',
    password: process.env.ADMIN_PASSWORD ?? 'Ricochete123$',
  },
};
