/**
 * Sorting engine – produces an array of animation steps for each algorithm.
 * Each step captures the array snapshot plus which indices are "active" (being compared/swapped)
 * and which are finalized ("sorted").
 */

export type SortStep = {
  array: number[];
  active: number[];   // indices currently being compared / moved
  sorted: number[];   // indices confirmed in final position
  comparisons: number;
  swaps: number;
  label?: string;     // optional description of what's happening
};

function snap(arr: number[], active: number[], sorted: number[], comparisons: number, swaps: number, label?: string): SortStep {
  return { array: [...arr], active, sorted: [...sorted], comparisons, swaps, label };
}

// ── Bubble Sort ──────────────────────────────────────────────
export function bubbleSortSteps(input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  const sorted: number[] = [];
  let comps = 0, swaps = 0;

  steps.push(snap(a, [], sorted, comps, swaps, 'Initial array'));

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comps++;
      steps.push(snap(a, [j, j + 1], sorted, comps, swaps, `Compare ${a[j]} and ${a[j + 1]}`));
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        swapped = true;
        steps.push(snap(a, [j, j + 1], sorted, comps, swaps, `Swap ${a[j + 1]} ↔ ${a[j]}`));
      }
    }
    sorted.push(n - i - 1);
    steps.push(snap(a, [], sorted, comps, swaps, `${a[n - i - 1]} is in place`));
    if (!swapped) break;
  }

  // mark all sorted
  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push(snap(a, [], allSorted, comps, swaps, 'Done!'));
  return steps;
}

// ── Selection Sort ───────────────────────────────────────────
export function selectionSortSteps(input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  const sorted: number[] = [];
  let comps = 0, swaps = 0;

  steps.push(snap(a, [], sorted, comps, swaps, 'Initial array'));

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comps++;
      steps.push(snap(a, [minIdx, j], sorted, comps, swaps, `Compare ${a[minIdx]} and ${a[j]}`));
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      swaps++;
      steps.push(snap(a, [i, minIdx], sorted, comps, swaps, `Swap ${a[minIdx]} ↔ ${a[i]}`));
    }
    sorted.push(i);
    steps.push(snap(a, [], sorted, comps, swaps, `${a[i]} placed at position ${i}`));
  }

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push(snap(a, [], allSorted, comps, swaps, 'Done!'));
  return steps;
}

// ── Insertion Sort ───────────────────────────────────────────
export function insertionSortSteps(input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  let comps = 0, swaps = 0;

  steps.push(snap(a, [], [0], comps, swaps, 'Initial array'));

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push(snap(a, [i], Array.from({ length: i }, (_, k) => k), comps, swaps, `Insert ${key}`));

    while (j >= 0 && a[j] > key) {
      comps++;
      a[j + 1] = a[j];
      swaps++;
      steps.push(snap(a, [j, j + 1], Array.from({ length: i }, (_, k) => k), comps, swaps, `Shift ${a[j]} right`));
      j--;
    }
    if (j >= 0) comps++; // final comparison that ended the loop
    a[j + 1] = key;
    const sortedSoFar = Array.from({ length: i + 1 }, (_, k) => k);
    steps.push(snap(a, [j + 1], sortedSoFar, comps, swaps, `${key} inserted at position ${j + 1}`));
  }

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push(snap(a, [], allSorted, comps, swaps, 'Done!'));
  return steps;
}

// ── Merge Sort ───────────────────────────────────────────────
export function mergeSortSteps(input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  const finalSorted: Set<number> = new Set();
  let comps = 0, swaps = 0;

  steps.push(snap(a, [], [], comps, swaps, 'Initial array'));

  function merge(lo: number, mid: number, hi: number) {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    const activeRange = Array.from({ length: hi - lo + 1 }, (_, x) => lo + x);

    steps.push(snap(a, activeRange, [...finalSorted], comps, swaps, `Merge [${lo}..${mid}] and [${mid + 1}..${hi}]`));

    while (i < left.length && j < right.length) {
      comps++;
      if (left[i] <= right[j]) {
        a[k] = left[i];
        i++;
      } else {
        a[k] = right[j];
        j++;
      }
      swaps++;
      steps.push(snap(a, [k], [...finalSorted], comps, swaps, `Place ${a[k]} at index ${k}`));
      k++;
    }
    while (i < left.length) {
      a[k] = left[i];
      swaps++;
      steps.push(snap(a, [k], [...finalSorted], comps, swaps, `Place remaining ${a[k]}`));
      i++; k++;
    }
    while (j < right.length) {
      a[k] = right[j];
      swaps++;
      steps.push(snap(a, [k], [...finalSorted], comps, swaps, `Place remaining ${a[k]}`));
      j++; k++;
    }
  }

  function msort(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) finalSorted.add(lo);
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    msort(lo, mid);
    msort(mid + 1, hi);
    merge(lo, mid, hi);

    if (lo === 0 && hi === n - 1) {
      for (let x = lo; x <= hi; x++) finalSorted.add(x);
    }
  }

  msort(0, n - 1);

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push(snap(a, [], allSorted, comps, swaps, 'Done!'));
  return steps;
}

// ── Quick Sort ───────────────────────────────────────────────
export function quickSortSteps(input: number[]): SortStep[] {
  const a = [...input];
  const n = a.length;
  const steps: SortStep[] = [];
  const finalSorted: Set<number> = new Set();
  let comps = 0, swaps = 0;

  steps.push(snap(a, [], [], comps, swaps, 'Initial array'));

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    steps.push(snap(a, [hi], [...finalSorted], comps, swaps, `Pivot = ${pivot}`));
    let i = lo - 1;

    for (let j = lo; j < hi; j++) {
      comps++;
      steps.push(snap(a, [j, hi], [...finalSorted], comps, swaps, `Compare ${a[j]} with pivot ${pivot}`));
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          steps.push(snap(a, [i, j], [...finalSorted], comps, swaps, `Swap ${a[j]} ↔ ${a[i]}`));
        }
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    swaps++;
    finalSorted.add(i + 1);
    steps.push(snap(a, [i + 1], [...finalSorted], comps, swaps, `Pivot ${pivot} placed at index ${i + 1}`));
    return i + 1;
  }

  function qsort(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) finalSorted.add(lo);
      return;
    }
    const pi = partition(lo, hi);
    qsort(lo, pi - 1);
    qsort(pi + 1, hi);
  }

  qsort(0, n - 1);

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push(snap(a, [], allSorted, comps, swaps, 'Done!'));
  return steps;
}

export function generateSteps(algo: string, input: number[]): SortStep[] {
  switch (algo) {
    case 'Bubble Sort':    return bubbleSortSteps(input);
    case 'Selection Sort': return selectionSortSteps(input);
    case 'Insertion Sort': return insertionSortSteps(input);
    case 'Merge Sort':     return mergeSortSteps(input);
    case 'Quick Sort':     return quickSortSteps(input);
    default:               return bubbleSortSteps(input);
  }
}
