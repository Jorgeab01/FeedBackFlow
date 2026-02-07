export type SatisfactionLevel = 'happy' | 'neutral' | 'sad';
export type PlanType = 'free' | 'basic' | 'pro';

export interface Comment {
  id: string;
  text: string;
  satisfaction: SatisfactionLevel;
  createdAt: string;
  businessId: string;
}

export interface Business {
  id: string;
  name: string;
  ownerEmail: string;
  ownerPassword: string;
  description?: string;
  createdAt: string;
  plan: PlanType;
  planExpiresAt?: string;
  isActive: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface User {
  id: string;
  email: string;
  businessId: string;
  businessName: string;
  plan: PlanType;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (businessName: string, email: string, password: string, plan: PlanType) => Promise<boolean>;
}

export interface RegistrationData {
  businessName: string;
  email: string;
  password: string;
  selectedPlan: PlanType;
}
