import { useState, useCallback, useEffect } from 'react';
import type { Business } from '@/types';
import { USERS_KEY } from './useAuth';

export function useBusiness(businessId?: string) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      try {
        const businesses: Business[] = JSON.parse(stored);
        const found = businesses.find(b => b.id === businessId);
        setBusiness(found || null);
      } catch (e) {
        setBusiness(null);
      }
    }
    setIsLoading(false);
  }, [businessId]);

  const getBusinessUrl = useCallback(() => {
    if (!business) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/feedback/${business.id}`;
  }, [business]);

  // FUNCIÓN PARA ACTUALIZAR EL NEGOCIO
  const updateBusiness = useCallback((updates: Partial<Omit<Business, 'id' | 'createdAt'>>) => {
    if (!businessId || !business) return false;

    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return false;

    try {
      const businesses: Business[] = JSON.parse(stored);
      const index = businesses.findIndex(b => b.id === businessId);
      
      if (index === -1) return false;

      const updatedBusiness = { ...businesses[index], ...updates };
      businesses[index] = updatedBusiness;
      
      localStorage.setItem(USERS_KEY, JSON.stringify(businesses));
      setBusiness(updatedBusiness);
      
      // Actualizar current_user si cambió el nombre o plan
      const currentUser = localStorage.getItem('feedbackflow_current_user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        if (userData.businessId === businessId) {
          if (updates.name) userData.businessName = updates.name;
          if (updates.plan) userData.plan = updates.plan;
          localStorage.setItem('feedbackflow_current_user', JSON.stringify(userData));
          window.dispatchEvent(new Event('storage'));
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }, [businessId, business]);

  return {
    business,
    isLoading,
    getBusinessUrl,
    updateBusiness // <-- IMPORTANTE: Exportar aquí
  };
}

export function useAllBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      try {
        setBusinesses(JSON.parse(stored));
      } catch (e) {
        setBusinesses([]);
      }
    }
  }, []);

  return { businesses };
}