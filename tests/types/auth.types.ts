// tests/types/auth.types.ts
export interface Credentials {
    email: string;
    password: string;
  }
  
  export type Role = 'admin' | 'viewer' | 'gestor';
  