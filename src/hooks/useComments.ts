import { useState, useCallback, useEffect } from 'react';
import type { Comment, SatisfactionLevel } from '@/types';

const STORAGE_KEY = 'feedbackflow_comments';

const generateMockComments = (businessId: string): Comment[] => {
  const comments: Comment[] = [
    {
      id: '1',
      text: 'Excelente servicio, la comida estuvo deliciosa y el ambiente muy agradable.',
      satisfaction: 'happy',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      businessId
    },
    {
      id: '2',
      text: 'Buena atención, aunque el tiempo de espera fue un poco largo.',
      satisfaction: 'neutral',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      businessId
    },
    {
      id: '3',
      text: 'La comida no estuvo a la altura de mis expectativas.',
      satisfaction: 'sad',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      businessId
    }
  ];
  return comments;
};

export function useComments(businessId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const allComments: Comment[] = JSON.parse(stored);
        const businessComments = allComments.filter(c => c.businessId === businessId);
        
        if (businessComments.length === 0) {
          const mockComments = generateMockComments(businessId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...allComments, ...mockComments]));
          setComments(mockComments);
        } else {
          setComments(businessComments);
        }
      } catch (e) {
        setComments([]);
      }
    } else {
      const mockComments = generateMockComments(businessId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockComments));
      setComments(mockComments);
    }
    setIsLoading(false);
  }, [businessId]);

  const addComment = useCallback((text: string, satisfaction: SatisfactionLevel) => {
    if (!businessId) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      satisfaction,
      createdAt: new Date().toISOString(),
      businessId
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const allComments: Comment[] = stored ? JSON.parse(stored) : [];
    const updatedComments = [newComment, ...allComments];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComments));
    setComments(prev => [newComment, ...prev]);
  }, [businessId]);

  const deleteComment = useCallback((commentId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const allComments: Comment[] = JSON.parse(stored);
    const updatedComments = allComments.filter(c => c.id !== commentId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComments));
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  const getStats = useCallback(() => {
    const total = comments.length;
    const happy = comments.filter(c => c.satisfaction === 'happy').length;
    const neutral = comments.filter(c => c.satisfaction === 'neutral').length;
    const sad = comments.filter(c => c.satisfaction === 'sad').length;
    
    return {
      total,
      happy,
      neutral,
      sad,
      happyPercentage: total > 0 ? Math.round((happy / total) * 100) : 0,
      satisfactionScore: total > 0 ? Number((((happy * 2 + neutral * 1) / (total * 2)) * 5).toFixed(1)) : 0
    };
  }, [comments]);

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
    getStats
  };
}
