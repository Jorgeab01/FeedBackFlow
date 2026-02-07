import { useState, useCallback, useEffect } from 'react';
import type { User, Business, PlanType } from '@/types';

export const USERS_KEY = 'feedbackflow_users';
const CURRENT_USER_KEY = 'feedbackflow_current_user';

// Negocio demo inicial
const DEMO_BUSINESS: Business = {
  id: 'biz_123',
  name: 'Restaurante El Sabor',
  ownerEmail: 'demo@restaurante.com',
  ownerPassword: '123456',
  createdAt: new Date().toISOString(),
  plan: 'pro',
  isActive: true
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar datos demo si no existen
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (!storedUsers) {
      localStorage.setItem(USERS_KEY, JSON.stringify([DEMO_BUSINESS]));
    }

    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    const businesses: Business[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    const business = businesses.find(b => 
      b.ownerEmail === email && b.ownerPassword === password && b.isActive
    );
    
    if (business) {
      const userData: User = {
        id: business.id,
        email: business.ownerEmail,
        businessId: business.id,
        businessName: business.name,
        plan: business.plan
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const register = useCallback(async (
    businessName: string, 
    email: string, 
    password: string,
    plan: PlanType
  ): Promise<boolean> => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    const businesses: Business[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Verificar si el email ya existe
    if (businesses.some(b => b.ownerEmail === email)) {
      return false;
    }

    const newBusiness: Business = {
      id: `biz_${Date.now()}`,
      name: businessName,
      ownerEmail: email,
      ownerPassword: password,
      createdAt: new Date().toISOString(),
      plan,
      isActive: true
    };

    businesses.push(newBusiness);
    localStorage.setItem(USERS_KEY, JSON.stringify(businesses));

    // Auto-login después del registro
    const userData: User = {
      id: newBusiness.id,
      email: newBusiness.ownerEmail,
      businessId: newBusiness.id,
      businessName: newBusiness.name,
      plan: newBusiness.plan
    };
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

    return true;
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
  };
}
