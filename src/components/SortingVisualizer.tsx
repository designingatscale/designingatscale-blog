import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type HighlightType = 'comparing' | 'swapping' | 'sorted' | 'active';

interface Frame {
  array: number[];
  highlights: Record<number, HighlightType>;
  description: string;
}

type AlgorithmId =
  | 'bubble-sort'
  | 'selection-sort'
  | 'insertion-sort'
  | 'cocktail-shaker-sort'
  | 'gnome-sort'
  | 'comb-sort'
  | 'odd-even-sort'
  | 'cycle-sort'
  | 'pancake-sort'
  | 'merge-sort'
  | 'quick-sort';

interface SortingVisualizerProps {
  config: string;
}

// ─── Frame Generators ────────────────────────────────────────────────────────

function generateBubbleSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      frames.push({ array: [...a], highlights: { [j]: 'comparing', [j + 1]: 'comparing' }, description: `Compare A[${j}]=${a[j]} and A[${j + 1}]=${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        frames.push({ array: [...a], highlights: { [j]: 'swapping', [j + 1]: 'swapping' }, description: `Swap → A[${j}]=${a[j]}, A[${j + 1}]=${a[j + 1]}` });
      }
    }
    const sorted: Record<number, HighlightType> = {};
    for (let k = n - 1 - i; k < n; k++) sorted[k] = 'sorted';
    frames.push({ array: [...a], highlights: sorted, description: `Pass ${i + 1} complete — element ${a[n - 1 - i]} in final position` });
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateSelectionSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    frames.push({ array: [...a], highlights: { [i]: 'active' }, description: `Pass ${i + 1}: Find minimum in A[${i}..${n - 1}]` });

    for (let j = i + 1; j < n; j++) {
      frames.push({ array: [...a], highlights: { [minIdx]: 'active', [j]: 'comparing' }, description: `Compare A[${j}]=${a[j]} with current min A[${minIdx}]=${a[minIdx]}` });
      if (a[j] < a[minIdx]) {
        minIdx = j;
        frames.push({ array: [...a], highlights: { [minIdx]: 'active' }, description: `New minimum found: A[${minIdx}]=${a[minIdx]}` });
      }
    }

    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      frames.push({ array: [...a], highlights: { [i]: 'swapping', [minIdx]: 'swapping' }, description: `Swap A[${i}] ↔ A[${minIdx}] → place ${a[i]} at position ${i}` });
    }

    const sorted: Record<number, HighlightType> = {};
    for (let k = 0; k <= i; k++) sorted[k] = 'sorted';
    frames.push({ array: [...a], highlights: sorted, description: `Position ${i} is now final: ${a[i]}` });
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateInsertionSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: { 0: 'sorted' }, description: 'Initial array — A[0] is trivially sorted' }];

  for (let i = 1; i < n; i++) {
    const key = a[i];
    frames.push({ array: [...a], highlights: { [i]: 'active' }, description: `Insert key=${key} into sorted prefix A[0..${i - 1}]` });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      frames.push({ array: [...a], highlights: { [j]: 'comparing', [j + 1]: 'active' }, description: `A[${j}]=${a[j]} > ${key}? Yes → shift right` });
      a[j + 1] = a[j];
      frames.push({ array: [...a], highlights: { [j + 1]: 'swapping' }, description: `Shift A[${j}]=${a[j]} → A[${j + 1}]` });
      j--;
    }
    a[j + 1] = key;
    const sorted: Record<number, HighlightType> = { [j + 1]: 'swapping' };
    for (let k = 0; k <= i; k++) if (k !== j + 1) sorted[k] = 'sorted';
    frames.push({ array: [...a], highlights: sorted, description: `Insert ${key} at position ${j + 1}` });

    const sortedFinal: Record<number, HighlightType> = {};
    for (let k = 0; k <= i; k++) sortedFinal[k] = 'sorted';
    frames.push({ array: [...a], highlights: sortedFinal, description: `Sorted prefix is now A[0..${i}]` });
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateCocktailShakerSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];
  let start = 0, end = n - 1;
  let swapped = true;
  let round = 0;

  while (swapped) {
    swapped = false;
    round++;

    // Forward pass
    frames.push({ array: [...a], highlights: {}, description: `Round ${round} — Forward pass →` });
    for (let i = start; i < end; i++) {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i + 1]: 'comparing' }, description: `Compare A[${i}]=${a[i]} and A[${i + 1}]=${a[i + 1]}` });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
        frames.push({ array: [...a], highlights: { [i]: 'swapping', [i + 1]: 'swapping' }, description: `Swap → A[${i}]=${a[i]}, A[${i + 1}]=${a[i + 1]}` });
      }
    }
    end--;

    if (!swapped) break;
    swapped = false;

    // Backward pass
    frames.push({ array: [...a], highlights: {}, description: `Round ${round} — Backward pass ←` });
    for (let i = end; i > start; i--) {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i - 1]: 'comparing' }, description: `Compare A[${i - 1}]=${a[i - 1]} and A[${i}]=${a[i]}` });
      if (a[i] < a[i - 1]) {
        [a[i], a[i - 1]] = [a[i - 1], a[i]];
        swapped = true;
        frames.push({ array: [...a], highlights: { [i]: 'swapping', [i - 1]: 'swapping' }, description: `Swap → A[${i - 1}]=${a[i - 1]}, A[${i}]=${a[i]}` });
      }
    }
    start++;
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateGnomeSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array — gnome starts at position 0' }];
  let i = 0;
  let steps = 0;
  const maxSteps = n * n * 2; // safety limit

  while (i < n && steps < maxSteps) {
    steps++;
    if (i === 0 || a[i] >= a[i - 1]) {
      if (i > 0) {
        frames.push({ array: [...a], highlights: { [i]: 'comparing', [i - 1]: 'comparing' }, description: `A[${i - 1}]=${a[i - 1]} ≤ A[${i}]=${a[i]} ✓ → step forward` });
      }
      i++;
    } else {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i - 1]: 'comparing' }, description: `A[${i - 1}]=${a[i - 1]} > A[${i}]=${a[i]} → swap & step back` });
      [a[i], a[i - 1]] = [a[i - 1], a[i]];
      frames.push({ array: [...a], highlights: { [i]: 'swapping', [i - 1]: 'swapping' }, description: `Swap → A[${i - 1}]=${a[i - 1]}, A[${i}]=${a[i]}` });
      i--;
    }
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateCombSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];
  let gap = n;
  const shrink = 1.3;
  let sorted = false;

  while (!sorted) {
    gap = Math.floor(gap / shrink);
    if (gap <= 1) { gap = 1; sorted = true; }

    frames.push({ array: [...a], highlights: {}, description: `Gap = ${gap}` });

    for (let i = 0; i + gap < n; i++) {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i + gap]: 'comparing' }, description: `Compare A[${i}]=${a[i]} and A[${i + gap}]=${a[i + gap]} (gap=${gap})` });
      if (a[i] > a[i + gap]) {
        [a[i], a[i + gap]] = [a[i + gap], a[i]];
        sorted = false;
        frames.push({ array: [...a], highlights: { [i]: 'swapping', [i + gap]: 'swapping' }, description: `Swap → A[${i}]=${a[i]}, A[${i + gap}]=${a[i + gap]}` });
      }
    }
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateOddEvenSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];
  let sorted = false;
  let round = 0;

  while (!sorted) {
    sorted = true;
    round++;

    // Odd phase
    frames.push({ array: [...a], highlights: {}, description: `Round ${round} — Odd phase (pairs 1-2, 3-4, ...)` });
    for (let i = 1; i < n - 1; i += 2) {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i + 1]: 'comparing' }, description: `Compare A[${i}]=${a[i]} and A[${i + 1}]=${a[i + 1]}` });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        sorted = false;
        frames.push({ array: [...a], highlights: { [i]: 'swapping', [i + 1]: 'swapping' }, description: `Swap → A[${i}]=${a[i]}, A[${i + 1}]=${a[i + 1]}` });
      }
    }

    // Even phase
    frames.push({ array: [...a], highlights: {}, description: `Round ${round} — Even phase (pairs 0-1, 2-3, ...)` });
    for (let i = 0; i < n - 1; i += 2) {
      frames.push({ array: [...a], highlights: { [i]: 'comparing', [i + 1]: 'comparing' }, description: `Compare A[${i}]=${a[i]} and A[${i + 1}]=${a[i + 1]}` });
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        sorted = false;
        frames.push({ array: [...a], highlights: { [i]: 'swapping', [i + 1]: 'swapping' }, description: `Swap → A[${i}]=${a[i]}, A[${i + 1}]=${a[i + 1]}` });
      }
    }

    if (round > n) break; // safety limit
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateCycleSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];

  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    let item = a[cycleStart];
    let pos = cycleStart;
    frames.push({ array: [...a], highlights: { [cycleStart]: 'active' }, description: `Cycle from index ${cycleStart}, item=${item}` });

    for (let i = cycleStart + 1; i < n; i++) {
      if (a[i] < item) pos++;
    }

    if (pos === cycleStart) {
      frames.push({ array: [...a], highlights: { [cycleStart]: 'sorted' }, description: `Item ${item} already in correct position` });
      continue;
    }

    while (item === a[pos]) pos++;
    if (pos !== cycleStart) {
      const old = a[pos];
      a[pos] = item;
      item = old;
      frames.push({ array: [...a], highlights: { [pos]: 'swapping', [cycleStart]: 'active' }, description: `Write ${a[pos]} to position ${pos}, pick up ${item}` });
    }

    while (pos !== cycleStart) {
      pos = cycleStart;
      for (let i = cycleStart + 1; i < n; i++) {
        if (a[i] < item) pos++;
      }
      while (item === a[pos]) pos++;
      if (item !== a[pos]) {
        const old = a[pos];
        a[pos] = item;
        item = old;
        frames.push({ array: [...a], highlights: { [pos]: 'swapping', [cycleStart]: 'active' }, description: `Write ${a[pos]} to position ${pos}, pick up ${item}` });
      }
    }
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generatePancakeSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];

  const flip = (k: number) => {
    for (let i = 0, j = k; i < j; i++, j--) {
      [a[i], a[j]] = [a[j], a[i]];
    }
  };

  for (let size = n; size > 1; size--) {
    let maxIdx = 0;
    for (let i = 1; i < size; i++) {
      if (a[i] > a[maxIdx]) maxIdx = i;
    }

    frames.push({ array: [...a], highlights: { [maxIdx]: 'active' }, description: `Find max in A[0..${size - 1}]: A[${maxIdx}]=${a[maxIdx]}` });

    if (maxIdx === size - 1) {
      const sorted: Record<number, HighlightType> = {};
      for (let k = size - 1; k < n; k++) sorted[k] = 'sorted';
      frames.push({ array: [...a], highlights: sorted, description: `Max already at position ${size - 1} — skip` });
      continue;
    }

    if (maxIdx > 0) {
      flip(maxIdx);
      const hl: Record<number, HighlightType> = {};
      for (let k = 0; k <= maxIdx; k++) hl[k] = 'swapping';
      frames.push({ array: [...a], highlights: hl, description: `Flip A[0..${maxIdx}] → bring ${a[0]} to top` });
    }

    flip(size - 1);
    const hl2: Record<number, HighlightType> = {};
    for (let k = 0; k < size; k++) hl2[k] = 'swapping';
    for (let k = size; k < n; k++) hl2[k] = 'sorted';
    frames.push({ array: [...a], highlights: hl2, description: `Flip A[0..${size - 1}] → place ${a[size - 1]} at position ${size - 1}` });

    const sorted: Record<number, HighlightType> = {};
    for (let k = size - 1; k < n; k++) sorted[k] = 'sorted';
    frames.push({ array: [...a], highlights: sorted, description: `Position ${size - 1} is now final: ${a[size - 1]}` });
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateMergeSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];

  for (let width = 1; width < n; width *= 2) {
    const passNum = Math.log2(width) + 1;
    frames.push({
      array: [...a],
      highlights: {},
      description: `Pass ${passNum}: merge runs of ${width} into runs of ${width * 2}`
    });

    for (let lo = 0; lo < n - width; lo += 2 * width) {
      const mid = lo + width - 1;
      const hi = Math.min(lo + 2 * width - 1, n - 1);

      // Show the two subarrays about to be merged
      const preHl: Record<number, HighlightType> = {};
      for (let k = lo; k <= mid; k++) preHl[k] = 'active';
      for (let k = mid + 1; k <= hi; k++) preHl[k] = 'comparing';
      frames.push({
        array: [...a],
        highlights: preHl,
        description: `Merging [${a.slice(lo, mid + 1).join(', ')}] ⊕ [${a.slice(mid + 1, hi + 1).join(', ')}]`
      });

      // Perform the merge step-by-step
      const aux = a.slice(lo, hi + 1);
      let i = 0, j = mid - lo + 1;
      const placed: Set<number> = new Set(); // indices in a[] already placed

      for (let k = lo; k <= hi; k++) {
        let desc: string;

        if (i > mid - lo) {
          a[k] = aux[j];
          desc = `Take ${aux[j]} (remaining from right)`;
          j++;
        } else if (j > hi - lo) {
          a[k] = aux[i];
          desc = `Take ${aux[i]} (remaining from left)`;
          i++;
        } else if (aux[i] <= aux[j]) {
          a[k] = aux[i];
          desc = `Compare ${aux[i]} ≤ ${aux[j]} → pick ${aux[i]} from left`;
          i++;
        } else {
          const leftVal = aux[i];
          a[k] = aux[j];
          desc = `Compare ${leftVal} > ${aux[j]} → pick ${aux[j]} from right`;
          j++;
        }

        placed.add(k);

        // Build highlights: placed elements in sorted color, current pick in swapping
        const stepHl: Record<number, HighlightType> = {};
        // Already placed elements in this merge → sorted (green)
        for (const p of placed) {
          if (p !== k) stepHl[p] = 'sorted';
        }
        // Current picked element → swapping (red)
        stepHl[k] = 'swapping';
        // Remaining left elements → active (purple)
        for (let r = lo + i; r <= lo + (mid - lo); r++) {
          if (!placed.has(r)) stepHl[r] = 'active';
        }
        // Remaining right elements → comparing (orange)
        for (let r = lo + j; r <= lo + (hi - lo); r++) {
          if (!placed.has(r)) stepHl[r] = 'comparing';
        }

        frames.push({ array: [...a], highlights: stepHl, description: desc });
      }

      // Show merged result
      const resultHl: Record<number, HighlightType> = {};
      for (let k = lo; k <= hi; k++) resultHl[k] = 'sorted';
      frames.push({
        array: [...a],
        highlights: resultHl,
        description: `Merged → [${a.slice(lo, hi + 1).join(', ')}]`
      });
    }
  }

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

function generateQuickSortFrames(initial: number[]): Frame[] {
  const a = [...initial];
  const n = a.length;
  const frames: Frame[] = [{ array: [...a], highlights: {}, description: 'Initial array' }];
  const sorted = new Set<number>();

  function qsort(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo);
      return;
    }

    // Show subarray being partitioned
    const subHl: Record<number, HighlightType> = {};
    for (const s of sorted) subHl[s] = 'sorted';
    for (let k = lo; k <= hi; k++) subHl[k] = 'comparing';
    subHl[hi] = 'active'; // pivot
    frames.push({ array: [...a], highlights: subHl, description: `Partition A[${lo}..${hi}], pivot = ${a[hi]}` });

    // Lomuto partition
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      const cmpHl: Record<number, HighlightType> = {};
      for (const s of sorted) cmpHl[s] = 'sorted';
      for (let k = lo; k <= hi; k++) cmpHl[k] = 'comparing';
      cmpHl[hi] = 'active';
      cmpHl[j] = 'swapping';
      if (i !== j) cmpHl[i] = 'swapping';

      if (a[j] <= pivot) {
        if (i !== j) {
          frames.push({ array: [...a], highlights: cmpHl, description: `${a[j]} ≤ ${pivot} → swap A[${i}] and A[${j}]` });
          [a[i], a[j]] = [a[j], a[i]];
        } else {
          frames.push({ array: [...a], highlights: cmpHl, description: `${a[j]} ≤ ${pivot} → no swap needed` });
        }
        i++;
      } else {
        frames.push({ array: [...a], highlights: cmpHl, description: `${a[j]} > ${pivot} → skip` });
      }
    }

    // Place pivot
    if (i !== hi) {
      [a[i], a[hi]] = [a[hi], a[i]];
    }
    sorted.add(i);

    const pivotHl: Record<number, HighlightType> = {};
    for (const s of sorted) pivotHl[s] = 'sorted';
    for (let k = lo; k <= hi; k++) if (!sorted.has(k)) pivotHl[k] = 'comparing';
    pivotHl[i] = 'sorted';
    frames.push({ array: [...a], highlights: pivotHl, description: `Pivot ${a[i]} placed at index ${i}` });

    qsort(lo, i - 1);
    qsort(i + 1, hi);
  }

  qsort(0, n - 1);

  const allSorted: Record<number, HighlightType> = {};
  for (let k = 0; k < n; k++) allSorted[k] = 'sorted';
  frames.push({ array: [...a], highlights: allSorted, description: 'Array is sorted!' });
  return frames;
}

// ─── Algorithm Registry ──────────────────────────────────────────────────────

const ALGORITHM_NAMES: Record<AlgorithmId, string> = {
  'bubble-sort': 'Bubble Sort',
  'selection-sort': 'Selection Sort',
  'insertion-sort': 'Insertion Sort',
  'cocktail-shaker-sort': 'Cocktail Shaker Sort',
  'gnome-sort': 'Gnome Sort',
  'comb-sort': 'Comb Sort',
  'odd-even-sort': 'Odd-Even Sort',
  'cycle-sort': 'Cycle Sort',
  'pancake-sort': 'Pancake Sort',
  'merge-sort': 'Merge Sort',
  'quick-sort': 'Quick Sort',
};

const GENERATORS: Record<AlgorithmId, (arr: number[]) => Frame[]> = {
  'bubble-sort': generateBubbleSortFrames,
  'selection-sort': generateSelectionSortFrames,
  'insertion-sort': generateInsertionSortFrames,
  'cocktail-shaker-sort': generateCocktailShakerSortFrames,
  'gnome-sort': generateGnomeSortFrames,
  'comb-sort': generateCombSortFrames,
  'odd-even-sort': generateOddEvenSortFrames,
  'cycle-sort': generateCycleSortFrames,
  'pancake-sort': generatePancakeSortFrames,
  'merge-sort': generateMergeSortFrames,
  'quick-sort': generateQuickSortFrames,
};

// ─── Color Utilities ─────────────────────────────────────────────────────────

const BAR_COLORS: Record<HighlightType | 'default', { bg: string; border: string }> = {
  default: { bg: 'rgba(99,102,241,0.7)', border: 'rgba(99,102,241,1)' },
  comparing: { bg: 'rgba(245,158,11,0.8)', border: 'rgba(245,158,11,1)' },
  swapping: { bg: 'rgba(239,68,68,0.8)', border: 'rgba(239,68,68,1)' },
  sorted: { bg: 'rgba(16,185,129,0.7)', border: 'rgba(16,185,129,1)' },
  active: { bg: 'rgba(168,85,247,0.8)', border: 'rgba(168,85,247,1)' },
};

// ─── Parse Config ────────────────────────────────────────────────────────────

function parseConfig(config: string): { algorithm: AlgorithmId; array: number[] } {
  const lines = config.trim().split('\n');
  let algorithm: AlgorithmId = 'bubble-sort';
  let array: number[] = [5, 3, 8, 1, 2, 7, 4, 6];

  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (key.trim() === 'algorithm') {
      algorithm = value as AlgorithmId;
    } else if (key.trim() === 'array') {
      array = value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }
  }

  return { algorithm, array };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SortingVisualizer({ config }: SortingVisualizerProps) {
  const { algorithm, array: initialArray } = parseConfig(config);
  const generator = GENERATORS[algorithm];
  const name = ALGORITHM_NAMES[algorithm] || algorithm;

  const [frames] = useState<Frame[]>(() => generator ? generator(initialArray) : []);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per frame
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentFrame = frames[frameIdx] || { array: initialArray, highlights: {}, description: '' };
  const maxVal = Math.max(...initialArray, 1);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    if (frameIdx >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setFrameIdx(prev => Math.min(prev + 1, frames.length - 1));
    }, speed);
    return stopTimer;
  }, [playing, frameIdx, speed, frames.length, stopTimer]);

  const handlePlay = () => {
    if (frameIdx >= frames.length - 1) {
      setFrameIdx(0);
      setTimeout(() => setPlaying(true), 50);
    } else {
      setPlaying(true);
    }
  };
  const handlePause = () => { setPlaying(false); stopTimer(); };
  const handleStep = () => { setPlaying(false); stopTimer(); setFrameIdx(prev => Math.min(prev + 1, frames.length - 1)); };
  const handleReset = () => { setPlaying(false); stopTimer(); setFrameIdx(0); };

  if (!generator) {
    return <div style={{ color: '#ef4444', fontFamily: 'monospace', padding: '1rem' }}>Unknown algorithm: {algorithm}</div>;
  }

  // ─── Constants ──

  const BAR_AREA_HEIGHT = 180;
  const barCount = currentFrame.array.length;

  return (
    <div style={{
      margin: '2rem 0',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
          </div>
          <span style={{
            fontSize: '11px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>{name}</span>
        </div>
        <span style={{
          fontSize: '10px',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          color: '#94a3b8',
        }}>Step {frameIdx + 1} / {frames.length}</span>
      </div>

      {/* Bar chart — FIXED height container, no layout shift */}
      <div style={{
        position: 'relative',
        height: `${BAR_AREA_HEIGHT + 56}px`, // bars + value label (20) + index label (16) + padding (20)
        padding: '20px 24px 0',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: barCount > 12 ? '2px' : '6px',
          height: `${BAR_AREA_HEIGHT + 36}px`, // bars + labels
        }}>
          {currentFrame.array.map((val, idx) => {
            const hl = currentFrame.highlights[idx];
            const color = BAR_COLORS[hl || 'default'];
            const barHeight = Math.max((val / maxVal) * BAR_AREA_HEIGHT, 6);

            return (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                maxWidth: barCount > 12 ? '40px' : '56px',
                height: `${BAR_AREA_HEIGHT + 36}px`,
                justifyContent: 'flex-end',
              }}>
                {/* Value label — fixed position above max bar area */}
                <span style={{
                  fontSize: barCount > 12 ? '9px' : '11px',
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: hl ? color.border : '#94a3b8',
                  marginBottom: '4px',
                  height: '16px',
                  lineHeight: '16px',
                  transition: 'color 0.15s ease',
                }}>{val}</span>
                {/* Bar — fixed container with inner fill */}
                <div style={{
                  width: '100%',
                  height: `${BAR_AREA_HEIGHT}px`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%',
                    height: `${barHeight}px`,
                    background: `linear-gradient(180deg, ${color.border} 0%, ${color.bg} 100%)`,
                    borderRadius: barCount > 12 ? '3px 3px 0 0' : '6px 6px 0 0',
                    boxShadow: hl
                      ? `0 0 16px ${color.bg}, inset 0 1px 0 rgba(255,255,255,0.3)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'background 0.15s ease, box-shadow 0.15s ease',
                  }} />
                </div>
                {/* Index label — fixed below bars */}
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: '#cbd5e1',
                  marginTop: '4px',
                  height: '12px',
                  lineHeight: '12px',
                }}>{idx}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div style={{
        textAlign: 'center',
        fontSize: '13px',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        color: '#475569',
        padding: '8px 24px 16px',
        minHeight: '24px',
        lineHeight: '20px',
      }}>{currentFrame.description}</div>

      {/* Progress bar */}
      <div style={{ padding: '0 24px 4px' }}>
        <div style={{
          height: '3px',
          background: '#f1f5f9',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
            borderRadius: '2px',
            transition: 'width 0.15s ease',
            width: `${frames.length > 1 ? (frameIdx / (frames.length - 1)) * 100 : 0}%`,
          }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 24px 12px',
        flexWrap: 'wrap',
      }}>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer',
            border: 'none',
            background: playing
              ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
              : 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            color: playing ? '#dc2626' : '#16a34a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 0.15s',
          }}
          onClick={playing ? handlePause : handlePlay}
        >
          {playing ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg> Pause</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg> Play</>
          )}
        </button>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer',
            border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s',
            opacity: frameIdx >= frames.length - 1 ? 0.4 : 1,
          }}
          onClick={handleStep}
          disabled={frameIdx >= frames.length - 1}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 15 12 5 21 5 3" /><rect x="16" y="4" width="3" height="16" rx="1" /></svg> Step
        </button>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer',
            border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s',
          }}
          onClick={handleReset}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg> Reset
        </button>

        {/* Speed */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px',
          fontSize: '11px', color: '#94a3b8',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}>
          <span>Speed</span>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={1050 - speed}
            onChange={e => setSpeed(1050 - parseInt(e.target.value))}
            style={{ width: '72px', accentColor: '#6366f1' }}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '14px',
        padding: '0 24px 14px',
        flexWrap: 'wrap',
      }}>
        {([
          ['default', 'Default'],
          ['comparing', 'Comparing'],
          ['swapping', 'Swapping'],
          ['sorted', 'Sorted'],
          ['active', 'Active'],
        ] as const).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              width: 10, height: 10, borderRadius: '3px',
              background: `linear-gradient(135deg, ${BAR_COLORS[key].border}, ${BAR_COLORS[key].bg})`,
            }} />
            <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

