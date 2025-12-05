import { useMemo } from 'react';

interface FuzzySearchOptions {
  keys: string[];
  threshold?: number;
  limit?: number;
}

// Simple fuzzy matching algorithm
function fuzzyMatch(text: string, pattern: string): number {
  if (!pattern) return 1;
  if (!text) return 0;
  
  text = text.toLowerCase();
  pattern = pattern.toLowerCase();
  
  // Exact match
  if (text === pattern) return 1;
  
  // Contains exact pattern
  if (text.includes(pattern)) return 0.9;
  
  // Calculate similarity score
  let score = 0;
  let patternIdx = 0;
  let consecutiveMatches = 0;
  let lastMatchIdx = -1;
  
  for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
    if (text[i] === pattern[patternIdx]) {
      // Bonus for consecutive matches
      if (lastMatchIdx === i - 1) {
        consecutiveMatches++;
        score += 1 + (consecutiveMatches * 0.5);
      } else {
        consecutiveMatches = 0;
        score += 1;
      }
      
      // Bonus for match at start
      if (i === 0) score += 0.5;
      
      // Bonus for match after separator
      if (i > 0 && (text[i - 1] === ' ' || text[i - 1] === '-' || text[i - 1] === '_')) {
        score += 0.3;
      }
      
      lastMatchIdx = i;
      patternIdx++;
    }
  }
  
  // All pattern characters must be found
  if (patternIdx !== pattern.length) return 0;
  
  // Normalize score
  return Math.min(score / (pattern.length * 2), 1);
}

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return '';
    value = value[key];
  }
  
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  
  return String(value || '');
}

export function useFuzzySearch<T>(
  items: T[],
  searchTerm: string,
  options: FuzzySearchOptions
): T[] {
  const { keys, threshold = 0.3, limit } = options;
  
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
    
    const scored = items.map(item => {
      let totalScore = 0;
      let matchCount = 0;
      
      for (const term of searchTerms) {
        let bestScoreForTerm = 0;
        
        for (const key of keys) {
          const value = getNestedValue(item, key);
          const score = fuzzyMatch(value, term);
          bestScoreForTerm = Math.max(bestScoreForTerm, score);
        }
        
        if (bestScoreForTerm >= threshold) {
          totalScore += bestScoreForTerm;
          matchCount++;
        }
      }
      
      // All search terms should match at least one key
      const allTermsMatch = matchCount === searchTerms.length;
      const averageScore = allTermsMatch ? totalScore / searchTerms.length : 0;
      
      return { item, score: averageScore };
    });
    
    const filtered = scored
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
    
    return limit ? filtered.slice(0, limit) : filtered;
  }, [items, searchTerm, keys, threshold, limit]);
}

// Hook for highlighting matched text
export function useHighlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  
  const terms = searchTerm.toLowerCase().trim().split(/\s+/);
  let result = text;
  
  for (const term of terms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
  }
  
  return result;
}

// Autocomplete suggestions
export function useAutocompleteSuggestions<T>(
  items: T[],
  searchTerm: string,
  key: string,
  maxSuggestions: number = 5
): string[] {
  return useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    const suggestions = new Set<string>();
    
    for (const item of items) {
      const value = getNestedValue(item, key).toLowerCase();
      
      // Word-based suggestions
      const words = value.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(term) && word !== term) {
          suggestions.add(word);
        }
      }
      
      // Full value if starts with term
      if (value.startsWith(term)) {
        const fullValue = getNestedValue(item, key);
        suggestions.add(fullValue);
      }
      
      if (suggestions.size >= maxSuggestions) break;
    }
    
    return Array.from(suggestions).slice(0, maxSuggestions);
  }, [items, searchTerm, key, maxSuggestions]);
}

export default useFuzzySearch;

