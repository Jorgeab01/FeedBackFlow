import type { AISummary, ChatMessage } from '@/types'

// Re-export the return type of useAIHelper for use in AI components
export interface UseAIHelperReturn {
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
