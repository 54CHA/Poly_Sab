import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanTextForSearch(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const costs = new Array();
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[shorter.length] = lastValue;
    }
  }

  const distance = costs[shorter.length];
  return (longer.length - distance) / longer.length;
}

export function textMatchesQuery(text: string, query: string, minSimilarity: number = 0.7): boolean {
  if (!query.trim()) return true;

  const cleanedText = cleanTextForSearch(text);
  const cleanedQuery = cleanTextForSearch(query);

  if (cleanedText.includes(cleanedQuery)) {
    return true;
  }

  const words = cleanedText.split(/\s+/);
  const queryWords = cleanedQuery.split(/\s+/);

  for (const queryWord of queryWords) {
    let foundMatch = false;
    for (const word of words) {

      const similarity = calculateSimilarity(word, queryWord);
      if (similarity >= minSimilarity) {
        foundMatch = true;
        break;
      }
    }
    if (!foundMatch) {
      return false;
    }
  }

  return true;
}
