import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types'

/**
 * Hook para obtener y actualizar UN negocio
 */
export function useBusiness(businessId?: string) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 📥 Cargar negocio desde Supabase
  useEffect(() => {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    const fetchBusiness = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (!error) {
        setBusiness(data)
      } else {
        setBusiness(null)
      }

      setIsLoading(false)
    }

    fetchBusiness()
  }, [businessId])

  // 🔗 Generar URL pública de feedback
  const getBusinessUrl = useCallback(() => {
    if (!business) return ''
    return `${window.location.origin}/feedback/${business.id}`
  }, [business])

  // ✏️ Actualizar negocio en Supabase
  const updateBusiness = useCallback(
    async (updates: Partial<Omit<Business, 'id' | 'created_at'>>) => {
      if (!businessId) return false

      const { data, error } = await supabase
        .from('businesses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)
        .select()
        .maybeSingle()

      if (error) return false

      setBusiness(data)
      return true
    },
    [businessId]
  )

  return {
    business,
    isLoading,
    getBusinessUrl,
    updateBusiness
  }
}
