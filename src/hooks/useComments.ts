import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Comment, SatisfactionLevel } from '@/types'

export function useComments(businessId?: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 📥 Cargar comentarios
  useEffect(() => {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    const load = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setComments(
          data.map(c => ({
            id: c.id,
            text: c.text,
            satisfaction: c.satisfaction,
            createdAt: c.created_at,
            businessId: c.business_id
          }))
        )
      }

      setIsLoading(false)
    }

    load()
  }, [businessId])

  // ➕ Añadir comentario
  const addComment = useCallback(
    async (text: string, satisfaction: SatisfactionLevel) => {
      if (!businessId) return

      const { data, error } = await supabase
        .from('comments')
        .insert({
          business_id: businessId,
          text,
          satisfaction
        })
        .select()
        .single()

      if (error || !data) return

      setComments(prev => [
        {
          id: data.id,
          text: data.text,
          satisfaction: data.satisfaction,
          createdAt: data.created_at,
          businessId: data.business_id
        },
        ...prev
      ])
    },
    [businessId]
  )

  // 🗑️ Borrado lógico
  const deleteComment = useCallback(async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)

    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }, [])

  // 📊 Stats (NO CAMBIA)
  const getStats = useCallback(() => {
    const total = comments.length
    const happy = comments.filter(c => c.satisfaction === 'happy').length
    const neutral = comments.filter(c => c.satisfaction === 'neutral').length
    const sad = comments.filter(c => c.satisfaction === 'sad').length

    return {
      total,
      happy,
      neutral,
      sad,
      happyPercentage: total > 0 ? Math.round((happy / total) * 100) : 0,
      satisfactionScore:
        total > 0
          ? Number((((happy * 2 + neutral) / (total * 2)) * 5).toFixed(1))
          : 0
    }
  }, [comments])

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
    getStats
  }
}
