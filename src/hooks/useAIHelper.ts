import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AISummary, ChatMessage } from '@/types'

interface UseAIHelperReturn {
  summary: AISummary | null
  chatHistory: ChatMessage[]
  isLoadingSummary: boolean
  isLoadingChat: boolean
  error: string | null
  fetchSummary: () => Promise<void>
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
  clearError: () => void
}

export function useAIHelper(isPro: boolean): UseAIHelperReturn {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!isPro) return
    setIsLoadingSummary(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')

      const { data, error: fnError } = await supabase.functions.invoke('ai-helper', {
        body: { action: 'summary' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      setSummary(data as AISummary)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setIsLoadingSummary(false)
    }
  }, [isPro])

  const sendMessage = useCallback(async (text: string) => {
    if (!isPro || !text.trim()) return
    setIsLoadingChat(true)
    setError(null)

    // Optimistically add the user message to history
    const userMessage: ChatMessage = { role: 'user', content: text.trim() }
    const nextHistory = [...chatHistory, userMessage]
    setChatHistory(nextHistory)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.')

      const { data, error: fnError } = await supabase.functions.invoke('ai-helper', {
        body: {
          action: 'chat',
          // Send the full conversation history so the stateless Edge Function
          // can reconstruct the context on every call.
          messages: nextHistory,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply as string,
      }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      // Remove the optimistically added user message on failure
      setChatHistory(chatHistory)
    } finally {
      setIsLoadingChat(false)
    }
  }, [isPro, chatHistory])

  const clearChat = useCallback(() => {
    setChatHistory([])
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    summary,
    chatHistory,
    isLoadingSummary,
    isLoadingChat,
    error,
    fetchSummary,
    sendMessage,
    clearChat,
    clearError,
  }
}
