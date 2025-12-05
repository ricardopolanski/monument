// tests/types/auth.types.ts
export interface Credentials {
    email: string;
    password: string;
  }
  
  export interface LoginOptions {
    expectNavigation?: boolean;
    acceptTermsAndConditions?: boolean;
  }

  export type Role = 'admin' | 'viewer' | 'gestor';
  