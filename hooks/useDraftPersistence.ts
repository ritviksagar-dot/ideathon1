import { useState, useCallback, useEffect, useRef } from 'react';
import type { CriterionScore } from '../types';

interface DraftData {
  scores: CriterionScore[];
  comment: string;
  lastModified: number;
}

const STORAGE_KEY_PREFIX = 'review_draft_';
const DRAFT_EXPIRY_HOURS = 24; // Drafts expire after 24 hours

export const useDraftPersistence = (reviewId: number, userId: string) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${reviewId}`;
  
  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const draft: DraftData = JSON.parse(stored);
      const now = Date.now();
      const ageHours = (now - draft.lastModified) / (1000 * 60 * 60);
      
      // Expire old drafts
      if (ageHours > DRAFT_EXPIRY_HOURS) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  }, [storageKey]);

  // Save draft to localStorage
  const saveDraft = useCallback((scores: CriterionScore[], comment: string) => {
    try {
      const draftData: DraftData = {
        scores,
        comment,
        lastModified: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (error) {
      console.warn('Failed to save draft:', error);
    }
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [storageKey]);

  // Auto-save with debouncing - only save if there's actual content
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback((scores: CriterionScore[], comment: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Only save if there's meaningful content
    const hasScores = scores.some(s => s.score !== null);
    const hasComment = comment.trim().length > 0;
    
    if (!hasScores && !hasComment) {
      // Clear draft if no content
      clearDraft();
      return;
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(scores, comment);
    }, 1000); // Save 1 second after user stops typing
  }, [saveDraft, clearDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadDraft,
    saveDraft: debouncedSave,
    clearDraft
  };
};
