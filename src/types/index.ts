export type SatisfactionLevel = 'happy' | 'neutral' | 'sad';
export type PlanType = 'free' | 'basic' | 'pro';

export interface Comment {
  id: string;
  text: string;
  satisfaction: SatisfactionLevel;
  createdAt: string;
  businessId: string;
}

// Interfaz Business que coincide con la tabla de Supabase
export interface Business {
  id: string;
  name: string;
  owner_id: string;  // UUID del usuario en auth.users
  plan: PlanType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  requiresPlanSelection?: boolean;
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

export interface AISummary {
  summary: string;
  topIssues: string[];
  topStrengths: string[];
  generatedAt: string;
  fromCache: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
