import { useState, useEffect, useCallback } from 'react';

const normalizeGreek = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .trim();
};

export const useDictionary = () => {
  const [dictionary, setDictionary] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch('/greek_wordlist.txt');
        if (!response.ok) throw new Error('Failed to load dictionary');
        
        const text = await response.text();
        const words = text.split('\n');
        
        const normalizedSet = new Set<string>();
        for (const word of words) {
          if (word.length >= 2) {
            normalizedSet.add(normalizeGreek(word));
          }
        }
        
        setDictionary(normalizedSet);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error loading dictionary');
        setLoading(false);
      }
    };

    loadDictionary();
  }, []);

  const isValidWord = useCallback((word: string) => {
    if (!dictionary) return false;
    return dictionary.has(normalizeGreek(word));
  }, [dictionary]);

  return { isValidWord, loading, error, normalizeGreek };
};
