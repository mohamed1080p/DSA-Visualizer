import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  RotateCcw,
  Zap,
  Plus,
  Minus,
  Layers,
  ArrowRight,
  HelpCircle,
  Search,
  Database,
  Network,
  Grid,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { generateSteps, type SortStep } from '@/lib/sorting-engine';

// ── TOPIC METADATA DEFINITIONS ───────────────────────────────────────────────

type TopicMeta = {
  title: string;
  slug: string;
  category: string;
  stable?: boolean;
  description: string;
  bestTime: string;
  avgTime: string;
  worstTime: string;
  spaceComplexity: string;
  pseudo: string;
};

const TOPICS_DATA: TopicMeta[] = [
  // ── LINEAR DATA STRUCTURES ──
  {
    title: 'Array',
    slug: 'array',
    category: 'Linear Data Structures',
    description: 'A contiguous block of memory holding elements of the same type, allowing O(1) random access by index.',
    bestTime: 'O(1)',
    avgTime: 'O(1)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(n)',
    pseudo: '// Accessing or updating an element\narr[index] = value;\n\n// Pushing an element to the end\narr[length] = new_value;\nlength++;\n\n// Popping an element from the end\nlength--;\nreturn arr[length];',
  },
  {
    title: 'Linked List',
    slug: 'linked-list',
    category: 'Linear Data Structures',
    description: 'A linear collection of data elements where each element points to the next, allowing dynamic insertion and deletion.',
    bestTime: 'O(1)',
    avgTime: 'O(n)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(n)',
    pseudo: '// Appending a node\nNode newNode = new Node(value);\nif (head == null) head = newNode;\nelse tail.next = newNode;\ntail = newNode;\n\n// Prepending a node\nnewNode.next = head;\nhead = newNode;',
  },
  {
    title: 'Stack',
    slug: 'stack',
    category: 'Linear Data Structures',
    description: 'A Last-In, First-Out (LIFO) structure where elements are pushed and popped from the top end.',
    bestTime: 'O(1)',
    avgTime: 'O(1)',
    worstTime: 'O(1)',
    spaceComplexity: 'O(n)',
    pseudo: '// Pushing an element\ntop++;\narr[top] = value;\n\n// Popping an element\nif (top < 0) throw Underflow;\nvalue = arr[top];\ntop--;\nreturn value;',
  },
  {
    title: 'Queue',
    slug: 'queue',
    category: 'Linear Data Structures',
    description: 'A First-In, First-Out (FIFO) structure where items enter at the rear and exit from the front.',
    bestTime: 'O(1)',
    avgTime: 'O(1)',
    worstTime: 'O(1)',
    spaceComplexity: 'O(n)',
    pseudo: '// Enqueue\narr[rear] = value;\nrear++;\n\n// Dequeue\nif (front == rear) throw Underflow;\nvalue = arr[front];\nfront++;\nreturn value;',
  },

  // ── ADVANCED STRUCTURES ──
  {
    title: 'Hash Table',
    slug: 'hash-table',
    category: 'Advanced Structures',
    description: 'Maps keys to values using a deterministic hash function, organizing key-value buckets with integrated collision handling.',
    bestTime: 'O(1)',
    avgTime: 'O(1)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(n)',
    pseudo: '// Deterministic hashing index calculation\nint index = abs(hash(key)) % capacity;\n\n// Separate Chaining collision insertion\nbuckets[index].append(new Pair(key, value));\n\n// Retrieval\nfor (Pair p : buckets[index]) {\n  if (p.key == key) return p.value;\n}',
  },
  {
    title: 'Min / Max Heap',
    slug: 'heap',
    category: 'Advanced Structures',
    description: 'A specialized tree structure maintaining strong ordering properties (Min/Max) perfectly mapped to sequential array memory layers.',
    bestTime: 'O(1)',
    avgTime: 'O(log n)',
    worstTime: 'O(log n)',
    spaceComplexity: 'O(n)',
    pseudo: '// Insert & Bubble Up\narr.push(value);\nint curr = arr.length - 1;\nwhile (curr > 0 && arr[curr] < arr[parent(curr)]) {\n  swap(arr[curr], arr[parent(curr)]);\n  curr = parent(curr);\n}\n\n// Extract Min\nval = arr[0]; arr[0] = arr.pop();\nbubbleDown(0);',
  },
  {
    title: 'Trie (Prefix Tree)',
    slug: 'trie',
    category: 'Advanced Structures',
    description: 'An efficient multi-way character search tree optimal for autocompletion, dictionary implementations, and fast shared prefix lookups.',
    bestTime: 'O(L)',
    avgTime: 'O(L)',
    worstTime: 'O(L)',
    spaceComplexity: 'O(N × L)',
    pseudo: 'Node curr = root;\nfor (char c : word) {\n  if (!curr.children.containsKey(c)) {\n    curr.children.put(c, new Node());\n  }\n  curr = curr.children.get(c);\n}\ncurr.isEndOfWord = true;',
  },

  // ── SORTING ALGORITHMS ──
  {
    title: 'Bubble Sort',
    slug: 'bubble-sort',
    category: 'Sorting Algorithms',
    stable: true,
    description: 'Repeatedly compares adjacent values and swaps them until the largest remaining value bubbles to the end.',
    bestTime: 'O(n)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    pseudo: 'for i in 0..n\n  for j in 0..n-i-1\n    if arr[j] > arr[j+1]\n      swap(arr[j], arr[j+1])',
  },
  {
    title: 'Selection Sort',
    slug: 'selection-sort',
    category: 'Sorting Algorithms',
    stable: false,
    description: 'Finds the smallest remaining value and places it at the current boundary of the sorted prefix.',
    bestTime: 'O(n²)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    pseudo: 'for i in 0..n\n  min = i\n  for j in i+1..n\n    if arr[j] < arr[min]\n      min = j\n  swap(arr[i], arr[min])',
  },
  {
    title: 'Insertion Sort',
    slug: 'insertion-sort',
    category: 'Sorting Algorithms',
    stable: true,
    description: 'Builds a sorted prefix by inserting each new value into the correct position among earlier values.',
    bestTime: 'O(n)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(1)',
    pseudo: 'for i in 1..n\n  key = arr[i]\n  j = i - 1\n  while j >= 0 and arr[j] > key\n    arr[j+1] = arr[j]\n    j--\n  arr[j+1] = key',
  },
  {
    title: 'Merge Sort',
    slug: 'merge-sort',
    category: 'Sorting Algorithms',
    stable: true,
    description: 'Divide and conquer: breaks the array into halves, sorts each recursively, and merges them back.',
    bestTime: 'O(n log n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n log n)',
    spaceComplexity: 'O(n)',
    pseudo: 'if n <= 1 return arr\nmid = n / 2\nleft = merge_sort(arr[0..mid])\nright = merge_sort(arr[mid..n])\nreturn merge(left, right)',
  },
  {
    title: 'Quick Sort',
    slug: 'quick-sort',
    category: 'Sorting Algorithms',
    stable: false,
    description: 'Partitions values around a pivot, then recursively sorts values below and above that pivot.',
    bestTime: 'O(n log n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n²)',
    spaceComplexity: 'O(log n)',
    pseudo: 'pivot = arr[hi]\npartition(lo, hi)\nquick_sort(lo, pi-1)\nquick_sort(pi+1, hi)',
  },

  // ── SEARCHING ALGORITHMS ──
  {
    title: 'Binary Search',
    slug: 'binary-search',
    category: 'Searching Algorithms',
    description: 'Efficiently searches a sorted array by repeatedly dividing the search interval in half.',
    bestTime: 'O(1)',
    avgTime: 'O(log n)',
    worstTime: 'O(log n)',
    spaceComplexity: 'O(1)',
    pseudo: 'lo = 0, hi = n - 1\nwhile lo <= hi:\n  mid = (lo + hi) / 2\n  if arr[mid] == target: return mid\n  if arr[mid] < target: lo = mid + 1\n  else: hi = mid - 1\nreturn not_found',
  },

  // ── TREES & GRAPHS ──
  {
    title: 'Binary Tree',
    slug: 'binary-tree',
    category: 'Trees & Graphs',
    description: 'A hierarchical structure where each node has at most two children. Supports interactive depth-first traversals.',
    bestTime: 'O(1)',
    avgTime: 'O(n)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(h)',
    pseudo: '// Recursive Tree Traversal\nvoid traverse(Node node) {\n  if (node == null) return;\n  // Pre-order: process(node)\n  traverse(node.left);\n  // In-order: process(node)\n  traverse(node.right);\n  // Post-order: process(node)\n}',
  },
  {
    title: 'Binary Search Tree',
    slug: 'binary-search-tree',
    category: 'Trees & Graphs',
    description: 'A tree where values in the left subtree are smaller than the parent, and values in the right subtree are larger.',
    bestTime: 'O(log n)',
    avgTime: 'O(log n)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(h)',
    pseudo: '// Searching in a BST\nNode search(Node root, int key) {\n  if (root == null || root.val == key)\n    return root;\n  if (key < root.val)\n    return search(root.left, key);\n  return search(root.right, key);\n}',
  },
  {
    title: 'Breadth-First Search',
    slug: 'bfs',
    category: 'Trees & Graphs',
    description: 'Explores a graph level by level outward from the starting node, utilizing a Queue for tracking frontiers.',
    bestTime: 'O(V + E)',
    avgTime: 'O(V + E)',
    worstTime: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudo: 'queue.push(startNode);\nvisited[startNode] = true;\nwhile (!queue.isEmpty()) {\n  curr = queue.pop();\n  for (neighbor : curr.neighbors) {\n    if (!visited[neighbor]) {\n      visited[neighbor] = true;\n      queue.push(neighbor);\n    }\n  }\n}',
  },
  {
    title: 'Depth-First Search',
    slug: 'dfs',
    category: 'Trees & Graphs',
    description: 'Explores deeply along each branch before backtracking, utilizing recursion or an explicit Stack.',
    bestTime: 'O(V + E)',
    avgTime: 'O(V + E)',
    worstTime: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudo: 'void dfs(Node u) {\n  visited[u] = true;\n  for (neighbor : u.neighbors) {\n    if (!visited[neighbor]) {\n      dfs(neighbor);\n    }\n  }\n}',
  },
  {
    title: "Dijkstra's Shortest Path",
    slug: 'dijkstra',
    category: 'Trees & Graphs',
    description: 'Finds optimal minimum weight pathways radiating from source nodes to target vectors across weighted complex networks.',
    bestTime: 'O(E + V log V)',
    avgTime: 'O(E + V log V)',
    worstTime: 'O(E + V log V)',
    spaceComplexity: 'O(V)',
    pseudo: 'dist[start] = 0; pq.push(start, 0);\nwhile (!pq.isEmpty()) {\n  u = pq.extractMin();\n  for (Edge e : u.edges) {\n    if (dist[u] + e.weight < dist[e.to]) {\n      dist[e.to] = dist[u] + e.weight;\n      pq.push(e.to, dist[e.to]);\n    }\n  }\n}',
  },

  // ── DYNAMIC PROGRAMMING ──
  {
    title: 'DP Tabulation (Fibonacci)',
    slug: 'dp-fibonacci',
    category: 'Dynamic Programming',
    description: 'Iterative bottom-up state accumulation preventing exponentially redundant calls by caching computed optimal substructures.',
    bestTime: 'O(n)',
    avgTime: 'O(n)',
    worstTime: 'O(n)',
    spaceComplexity: 'O(n)',
    pseudo: '// Base foundations\ndp[0] = 0;\ndp[1] = 1;\n\n// Iterative state progression\nfor (int i = 2; i <= n; i++) {\n  dp[i] = dp[i-1] + dp[i-2];\n}\nreturn dp[n];',
  },
  {
    title: '0/1 Knapsack Grid',
    slug: 'knapsack',
    category: 'Dynamic Programming',
    description: 'Maximizes aggregate scalar item values bounded by discrete capacity constraints utilizing multi-dimensional choice matrices.',
    bestTime: 'O(N × W)',
    avgTime: 'O(N × W)',
    worstTime: 'O(N × W)',
    spaceComplexity: 'O(N × W)',
    pseudo: 'for (int i = 1; i <= n; i++) {\n  for (int w = 0; w <= W; w++) {\n    if (weight[i-1] <= w) {\n      dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - weight[i-1]]);\n    } else {\n      dp[i][w] = dp[i-1][w];\n    }\n  }\n}',
  },
];

const CATEGORIES = [
  'Linear Data Structures',
  'Advanced Structures',
  'Sorting Algorithms',
  'Searching Algorithms',
  'Trees & Graphs',
  'Dynamic Programming',
];

const easeSmooth = [0.22, 1, 0.36, 1] as const;

// ── SUB-VISUALIZERS ──────────────────────────────────────────────────────────

// 1. Array Visualizer
function ArrayVisualizer() {
  const [array, setArray] = useState<number[]>([15, 32, 68, 42, 88, 24, 53]);
  const [inputVal, setInputVal] = useState<string>('99');
  const [inputIdx, setInputIdx] = useState<string>('2');
  const [lastAccessed, setLastAccessed] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>('Array initialized. Perform an action below.');

  const updateIndex = () => {
    const idx = parseInt(inputIdx, 10);
    const val = parseInt(inputVal, 10);
    if (isNaN(idx) || idx < 0 || idx >= array.length) {
      setMsg(`Invalid index: ${inputIdx}. Must be between 0 and ${array.length - 1}.`);
      return;
    }
    if (isNaN(val)) return;
    setArray((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    setLastAccessed(idx);
    setMsg(`Updated index [${idx}] to value ${val}. Time taken: O(1).`);
  };

  const pushVal = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (array.length >= 12) {
      setMsg('Maximum array visualizer capacity reached (12).');
      return;
    }
    setArray((prev) => [...prev, val]);
    setLastAccessed(array.length);
    setMsg(`Pushed value ${val} to the end of the array. Time taken: O(1) amortized.`);
  };

  const popVal = () => {
    if (array.length === 0) {
      setMsg('Array underflow: Cannot pop from an empty array.');
      return;
    }
    const popped = array[array.length - 1];
    setArray((prev) => prev.slice(0, prev.length - 1));
    setLastAccessed(null);
    setMsg(`Popped value ${popped} from the end. Time taken: O(1).`);
  };

  const reset = () => {
    setArray([15, 32, 68, 42, 88, 24, 53]);
    setLastAccessed(null);
    setMsg('Array reset to initial configuration.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px]">
        <div className="flex flex-wrap gap-3 items-end justify-center max-w-full overflow-x-auto p-4">
          <AnimatePresence>
            {array.map((val, idx) => {
              const isGlowing = lastAccessed === idx;
              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  className={cn(
                    'flex flex-col items-center rounded-lg border bg-background p-4 w-16 shadow-sm transition-colors relative',
                    isGlowing ? 'border-primary bg-primary/10 shadow-glow' : 'border-border',
                  )}
                >
                  <span className={cn('font-display text-xl font-bold', isGlowing ? 'text-primary' : 'text-foreground')}>
                    {val}
                  </span>
                  <span className="mt-2 font-mono text-[10px] text-muted-foreground border-t border-border/50 pt-1 w-full text-center">
                    [{idx}]
                  </span>
                  {isGlowing && (
                    <span className="absolute -top-2 -right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {array.length === 0 && (
            <div className="text-sm text-muted-foreground italic border border-dashed border-border p-8 rounded-lg">
              Array is currently empty.
            </div>
          )}
        </div>
        <div className="mt-6 text-center font-mono text-xs text-muted-foreground bg-surface px-4 py-2 rounded-full border border-border">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Val:</span>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Idx:</span>
            <input
              type="number"
              value={inputIdx}
              onChange={(e) => setInputIdx(e.target.value)}
              className="w-14 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={updateIndex}
            className="h-9 px-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Set Index
          </button>
          <button
            type="button"
            onClick={pushVal}
            className="h-9 px-3 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-primary transition-all flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5 text-primary" /> Push
          </button>
          <button
            type="button"
            onClick={popVal}
            className="h-9 px-3 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-destructive transition-all flex items-center gap-1"
          >
            <Minus className="h-3.5 w-3.5 text-destructive" /> Pop
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

// 2. Linked List Visualizer
function LinkedListVisualizer() {
  const [nodes, setNodes] = useState<number[]>([12, 99, 37, 50]);
  const [inputVal, setInputVal] = useState<string>('45');
  const [lastAction, setLastAction] = useState<string>('Initial state: 4 nodes connected via pointer reference.');

  const appendNode = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (nodes.length >= 7) {
      setLastAction('Maximum list display capacity reached.');
      return;
    }
    setNodes((prev) => [...prev, val]);
    setLastAction(`Appended node (${val}) to the Tail. Time: O(1) keeping tail pointer.`);
  };

  const prependNode = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (nodes.length >= 7) {
      setLastAction('Maximum list display capacity reached.');
      return;
    }
    setNodes((prev) => [val, ...prev]);
    setLastAction(`Prepended node (${val}) as new Head. Time: O(1).`);
  };

  const deleteHead = () => {
    if (nodes.length === 0) {
      setLastAction('List is empty.');
      return;
    }
    const popped = nodes[0];
    setNodes((prev) => prev.slice(1));
    setLastAction(`Deleted Head node (${popped}). Next node becomes Head. Time: O(1).`);
  };

  const deleteTail = () => {
    if (nodes.length === 0) {
      setLastAction('List is empty.');
      return;
    }
    const popped = nodes[nodes.length - 1];
    setNodes((prev) => prev.slice(0, prev.length - 1));
    setLastAction(`Deleted Tail node (${popped}). Requires O(n) traversal to update second-to-last node pointer.`);
  };

  const reset = () => {
    setNodes([12, 99, 37, 50]);
    setLastAction('List reset.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-8 overflow-x-auto min-h-[320px]">
        <div className="flex items-center gap-3 py-8 px-4">
          <AnimatePresence>
            {nodes.map((val, idx) => {
              const isHead = idx === 0;
              const isTail = idx === nodes.length - 1;
              return (
                <motion.div
                  key={`${val}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.5, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 30 }}
                  className="flex items-center gap-3 shrink-0"
                >
                  <div className="relative flex flex-col items-center rounded-xl border border-border bg-gradient-surface p-4 w-20 shadow-sm">
                    {/* Badge */}
                    <div className="absolute -top-3 flex gap-1">
                      {isHead && <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground shadow-glow">HEAD</span>}
                      {isTail && <span className="rounded bg-muted-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold text-background">TAIL</span>}
                    </div>

                    <span className="font-display text-lg font-bold text-foreground mt-1">{val}</span>
                    <span className="mt-2 text-[9px] font-mono text-muted-foreground border-t border-border/60 pt-1 w-full text-center overflow-hidden text-ellipsis">
                      next: {idx === nodes.length - 1 ? 'null' : 'ptr'}
                    </span>
                  </div>

                  {/* Pointer Arrow */}
                  {idx < nodes.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {nodes.length === 0 && (
            <div className="text-sm text-muted-foreground italic border border-dashed border-border p-8 rounded-lg">
              Linked List is currently empty (head = null).
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-2 border-t border-border text-center font-mono text-xs text-muted-foreground">
        {lastAction}
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Val:</span>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={appendNode}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            Append
          </button>
          <button
            type="button"
            onClick={prependNode}
            className="h-9 px-3 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-primary transition-all"
          >
            Prepend
          </button>
          <button
            type="button"
            onClick={deleteHead}
            className="h-9 px-3 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-destructive transition-all flex items-center gap-1"
          >
            Del Head
          </button>
          <button
            type="button"
            onClick={deleteTail}
            className="h-9 px-3 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-destructive transition-all flex items-center gap-1"
          >
            Del Tail
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

// 3. Stack Visualizer
function StackVisualizer() {
  const [stack, setStack] = useState<number[]>([10, 20, 30]);
  const [inputVal, setInputVal] = useState<string>('40');
  const [msg, setMsg] = useState<string>('Stack state: Top element is readily accessible in O(1).');

  const pushVal = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (stack.length >= 6) {
      setMsg('Stack overflow: Display container limit reached.');
      return;
    }
    setStack((prev) => [...prev, val]);
    setMsg(`Pushed ${val} onto top of Stack. Time: O(1).`);
  };

  const popVal = () => {
    if (stack.length === 0) {
      setMsg('Stack underflow: No elements to pop.');
      return;
    }
    const popped = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, prev.length - 1));
    setMsg(`Popped ${popped} from the top. Time: O(1).`);
  };

  const clear = () => {
    setStack([]);
    setMsg('Stack cleared.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px]">
        <div className="relative w-48 border-x-4 border-b-4 border-primary/40 rounded-b-xl bg-surface/20 p-4 flex flex-col-reverse gap-2 min-h-[220px] justify-start shadow-inner">
          <AnimatePresence>
            {stack.map((val, idx) => {
              const isTop = idx === stack.length - 1;
              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  initial={{ opacity: 0, y: -40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.5 }}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 font-mono transition-all relative',
                    isTop ? 'border-primary bg-primary/15 text-primary shadow-glow font-bold' : 'border-border bg-background text-foreground',
                  )}
                >
                  <span>{val}</span>
                  {isTop ? (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground font-sans">TOP</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-sans">idx: {idx}</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {stack.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground italic">
              Stack is empty
            </div>
          )}
        </div>
        <div className="mt-4 text-xs font-mono text-muted-foreground bg-surface px-4 py-1.5 rounded border border-border">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">Push Val:</span>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={pushVal}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Push
          </button>
          <button
            type="button"
            onClick={popVal}
            className="h-9 px-4 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-destructive transition-all flex items-center gap-1.5"
          >
            <Minus className="h-4 w-4 text-destructive" /> Pop
          </button>
        </div>
        <button
          type="button"
          onClick={clear}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// 4. Queue Visualizer
function QueueVisualizer() {
  const [queue, setQueue] = useState<number[]>([15, 25, 35, 45]);
  const [inputVal, setInputVal] = useState<string>('55');
  const [msg, setMsg] = useState<string>('Queue state: Operates strictly FIFO (First-In, First-Out).');

  const enqueue = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (queue.length >= 7) {
      setMsg('Queue full: Visual tunnel limit reached.');
      return;
    }
    setQueue((prev) => [...prev, val]);
    setMsg(`Enqueued ${val} at the REAR. Time: O(1).`);
  };

  const dequeue = () => {
    if (queue.length === 0) {
      setMsg('Queue underflow: Empty queue.');
      return;
    }
    const popped = queue[0];
    setQueue((prev) => prev.slice(1));
    setMsg(`Dequeued front element (${popped}). Time: O(1).`);
  };

  const reset = () => {
    setQueue([15, 25, 35, 45]);
    setMsg('Queue reset.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] overflow-x-auto">
        <div className="flex items-center gap-2 border-y-4 border-primary/30 bg-surface/10 px-6 py-6 min-w-[360px] justify-start rounded-xl relative shadow-inner">
          <div className="absolute -top-3 left-4 rounded bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-[9px] font-mono font-bold text-destructive">
            FRONT EXIT
          </div>
          <div className="absolute -top-3 right-4 rounded bg-success/15 border border-success/30 px-2 py-0.5 text-[9px] font-mono font-bold text-success">
            REAR ENTRANCE
          </div>

          <AnimatePresence>
            {queue.map((val, idx) => {
              const isFront = idx === 0;
              const isRear = idx === queue.length - 1;
              return (
                <motion.div
                  key={`${val}-${idx}`}
                  layout
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.5 }}
                  className={cn(
                    'flex flex-col items-center rounded-lg border bg-background p-3 w-14 shrink-0 shadow-sm relative transition-all',
                    isFront ? 'border-destructive text-destructive font-bold' : isRear ? 'border-success text-success font-bold' : 'border-border text-foreground',
                  )}
                >
                  <span className="font-display text-lg">{val}</span>
                  <div className="mt-1 flex gap-1">
                    {isFront && <span className="text-[8px] font-mono text-destructive">FRONT</span>}
                    {isRear && !isFront && <span className="text-[8px] font-mono text-success">REAR</span>}
                    {!isFront && !isRear && <span className="text-[8px] font-mono text-muted-foreground">#{idx}</span>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {queue.length === 0 && (
            <div className="w-full text-center text-xs text-muted-foreground italic py-2">
              Queue is empty
            </div>
          )}
        </div>
        <div className="mt-6 text-xs font-mono text-muted-foreground bg-surface px-4 py-1.5 rounded border border-border">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">Val:</span>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={enqueue}
            className="h-9 px-4 rounded-md bg-success text-success-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Enqueue
          </button>
          <button
            type="button"
            onClick={dequeue}
            className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Dequeue
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ── ADVANCED MODULES IMPLEMENTATIONS ──

// 5. Hash Table Visualizer
function HashTableVisualizer() {
  // 5 internal slots mapped deterministically
  const [buckets, setBuckets] = useState<Array<Array<{ key: string; val: string }>>>([
    [{ key: 'apple', val: '50' }],
    [],
    [{ key: 'banana', val: '12' }],
    [{ key: 'grape', val: '88' }, { key: 'kiwi', val: '41' }],
    [],
  ]);
  const [inputKey, setInputKey] = useState<string>('mango');
  const [inputVal, setInputVal] = useState<string>('75');
  const [msg, setMsg] = useState<string>('Hash Table operational. Maps string keys into 5 slot buckets.');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const hashString = (str: string) => {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    return sum % 5;
  };

  const insertPair = () => {
    const k = inputKey.trim();
    const v = inputVal.trim();
    if (!k || !v) return;

    const idx = hashString(k);
    setActiveSlot(idx);

    setBuckets((prev) => {
      const next = prev.map((arr) => [...arr]);
      // Remove existing item with same key if present
      const filtered = next[idx].filter((item) => item.key !== k);
      filtered.push({ key: k, val: v });
      next[idx] = filtered;
      return next;
    });

    setMsg(`Hashed key "${k}" -> Sum(charCodes) % 5 = Index [${idx}]. Value securely bound.`);
  };

  const reset = () => {
    setBuckets([
      [{ key: 'apple', val: '50' }],
      [],
      [{ key: 'banana', val: '12' }],
      [{ key: 'grape', val: '88' }, { key: 'kiwi', val: '41' }],
      [],
    ]);
    setActiveSlot(null);
    setMsg('Buckets state reset.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center p-6 min-h-[320px] overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 w-full max-w-2xl mx-auto">
          {buckets.map((bucketItems, bIdx) => {
            const isGlowing = activeSlot === bIdx;
            return (
              <div
                key={`bucket-${bIdx}`}
                className={cn(
                  'rounded-xl border p-3 flex flex-col min-h-[220px] transition-all relative',
                  isGlowing ? 'border-primary bg-primary/5 shadow-glow' : 'border-border bg-surface',
                )}
              >
                {/* Bucket header */}
                <div className="border-b border-border/60 pb-1.5 mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Slot</span>
                  <span className="font-mono text-xs font-bold text-primary">#{bIdx}</span>
                </div>

                {/* Items collection (Separate Chaining preview) */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                  <AnimatePresence>
                    {bucketItems.map((item) => (
                      <motion.div
                        key={item.key}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="rounded border border-border bg-background p-2 flex flex-col gap-0.5 relative shadow-xs"
                      >
                        <span className="font-mono text-xs font-bold text-foreground overflow-hidden text-ellipsis">
                          {item.key}
                        </span>
                        <span className="font-mono text-[10px] text-primary">
                          val: {item.val}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {bucketItems.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/50 italic self-center my-auto">
                      empty
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center font-mono text-xs text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border max-w-xl mx-auto w-full">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Key:</span>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-20 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Val:</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={insertPair}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            Insert Pair
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// 6. Heap Visualizer (Min Heap preview)
function HeapVisualizer() {
  const [heap, setHeap] = useState<number[]>([10, 20, 30, 40, 50, 60]);
  const [inputVal, setInputVal] = useState<string>('15');
  const [msg, setMsg] = useState<string>('Min-Heap property active: Parent node <= children nodes.');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const insertHeap = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val)) return;
    if (heap.length >= 7) {
      setMsg('Maximum layout nodes capacity reached.');
      return;
    }

    // append and trigger simple order compliance simulation
    const next = [...heap, val].sort((a, b) => a - b);
    setHeap(next);
    setActiveIdx(next.indexOf(val));
    setMsg(`Inserted ${val} and automatically bubbled up to secure O(log n) Minimum preservation.`);
  };

  const extractMin = () => {
    if (heap.length === 0) {
      setMsg('Heap underflow.');
      return;
    }
    const min = heap[0];
    const next = heap.slice(1);
    setHeap(next);
    setActiveIdx(0);
    setMsg(`Extracted minimum value (${min}). Final root node replenished and heapified.`);
  };

  const reset = () => {
    setHeap([10, 20, 30, 40, 50, 60]);
    setActiveIdx(null);
    setMsg('Heap vector arrays recovered.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[320px] overflow-x-auto">
        {/* Visualized Sequential Array Layer */}
        <div className="mb-6 flex flex-col items-center w-full max-w-md">
          <span className="font-mono text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Sequential Buffer Array</span>
          <div className="flex gap-1.5 p-2 bg-surface rounded-lg border border-border w-full justify-center">
            {heap.map((val, idx) => (
              <div
                key={`harr-${idx}-${val}`}
                className={cn(
                  'w-10 h-10 rounded border flex flex-col items-center justify-center font-mono font-bold transition-all',
                  activeIdx === idx ? 'border-primary bg-primary/20 text-primary scale-105' : 'border-border bg-background text-foreground',
                )}
              >
                <span className="text-xs">{val}</span>
                <span className="text-[8px] opacity-50 mt-0.5">#{idx}</span>
              </div>
            ))}
            {heap.length === 0 && <span className="text-xs italic text-muted-foreground py-2">empty buffer</span>}
          </div>
        </div>

        {/* Tree structural arrangement levels */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md border-t border-border/50 pt-6">
          {/* Level 0 */}
          <div className="flex justify-center w-full">
            {heap[0] !== undefined && <HeapNode val={heap[0]} idx={0} active={activeIdx === 0} />}
          </div>
          {/* Level 1 */}
          <div className="flex justify-around w-2/3">
            {heap[1] !== undefined && <HeapNode val={heap[1]} idx={1} active={activeIdx === 1} />}
            {heap[2] !== undefined && <HeapNode val={heap[2]} idx={2} active={activeIdx === 2} />}
          </div>
          {/* Level 2 */}
          <div className="flex justify-between w-full px-4">
            {heap[3] !== undefined && <HeapNode val={heap[3]} idx={3} active={activeIdx === 3} />}
            {heap[4] !== undefined && <HeapNode val={heap[4]} idx={4} active={activeIdx === 4} />}
            {heap[5] !== undefined && <HeapNode val={heap[5]} idx={5} active={activeIdx === 5} />}
            {heap[6] !== undefined && <HeapNode val={heap[6]} idx={6} active={activeIdx === 6} />}
          </div>
        </div>

        <div className="mt-6 text-xs font-mono text-muted-foreground bg-surface px-4 py-1.5 rounded border border-border">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">Val:</span>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={insertHeap}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={extractMin}
            className="h-9 px-4 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-destructive transition-all"
          >
            Extract Min
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function HeapNode({ val, idx, active }: { val: number; idx: number; active: boolean }) {
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center font-display font-bold transition-all shadow-sm relative',
        active ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-glow' : 'border-border bg-background text-foreground',
      )}
    >
      <span className="text-sm">{val}</span>
      <span className="absolute -bottom-4 text-[8px] font-mono text-muted-foreground">#{idx}</span>
    </div>
  );
}

// 7. Trie Visualizer
function TrieVisualizer() {
  const [activeWord, setActiveWord] = useState<string>('CAT');
  const [msg, setMsg] = useState<string>('Pre-initialized dictionary paths: "CAT", "CAR", "DOG".');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] overflow-x-auto">
        {/* Simple Interactive Box Map */}
        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          {/* Root */}
          <div className="rounded-md border border-border px-4 py-1.5 font-mono text-xs font-bold bg-surface">
            ROOT (*)
          </div>

          {/* Connectors / Children */}
          <div className="flex justify-around w-full gap-8 border-t-2 border-border/40 pt-4 mt-2">
            {/* C branch */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all', activeWord.startsWith('C') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background')}>
                C
              </div>
              <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all', activeWord.startsWith('CA') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background')}>
                A
              </div>
              <div className="flex gap-2">
                <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all relative', activeWord === 'CAT' ? 'border-success bg-success text-success-foreground shadow-glow scale-110' : 'border-border bg-background')}>
                  T
                  <span className="absolute -bottom-3 left-1 text-[7px] text-muted-foreground">word</span>
                </div>
                <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all relative', activeWord === 'CAR' ? 'border-success bg-success text-success-foreground shadow-glow scale-110' : 'border-border bg-background')}>
                  R
                  <span className="absolute -bottom-3 left-1 text-[7px] text-muted-foreground">word</span>
                </div>
              </div>
            </div>

            {/* D branch */}
            <div className="flex flex-col items-center gap-3">
              <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all', activeWord.startsWith('D') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background')}>
                D
              </div>
              <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all', activeWord.startsWith('DO') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background')}>
                O
              </div>
              <div className={cn('rounded-lg border p-2 font-mono text-xs font-bold w-12 text-center transition-all relative', activeWord === 'DOG' ? 'border-success bg-success text-success-foreground shadow-glow scale-110' : 'border-border bg-background')}>
                G
                <span className="absolute -bottom-3 left-1 text-[7px] text-muted-foreground">word</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs font-mono text-muted-foreground bg-surface px-4 py-1.5 rounded border border-border">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Query Path:</span>
          <button
            type="button"
            onClick={() => { setActiveWord('CAT'); setMsg('Tracing branch path for "CAT". shared prefix: C➔A.'); }}
            className={cn('h-8 px-3 rounded text-xs font-mono font-bold border transition-all', activeWord === 'CAT' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border')}
          >
            CAT
          </button>
          <button
            type="button"
            onClick={() => { setActiveWord('CAR'); setMsg('Tracing branch path for "CAR". shared prefix: C➔A.'); }}
            className={cn('h-8 px-3 rounded text-xs font-mono font-bold border transition-all', activeWord === 'CAR' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border')}
          >
            CAR
          </button>
          <button
            type="button"
            onClick={() => { setActiveWord('DOG'); setMsg('Tracing distinct standalone pathway sequence for "DOG".'); }}
            className={cn('h-8 px-3 rounded text-xs font-mono font-bold border transition-all', activeWord === 'DOG' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border')}
          >
            DOG
          </button>
        </div>
        <span className="text-xs text-muted-foreground italic">O(L) complete word lookup</span>
      </div>
    </div>
  );
}

// 8. Dijkstra Visualizer
function DijkstraVisualizer() {
  const [relaxedCount, setRelaxedCount] = useState<number>(0);
  const distances = useMemo(() => {
    if (relaxedCount === 0) return { A: 0, B: '∞', C: '∞', D: '∞' };
    if (relaxedCount === 1) return { A: 0, B: 4, C: 2, D: '∞' };
    if (relaxedCount === 2) return { A: 0, B: 3, C: 2, D: 7 };
    return { A: 0, B: 3, C: 2, D: 5 };
  }, [relaxedCount]);

  const msg = useMemo(() => {
    if (relaxedCount === 0) return 'Ready. Source node A initialized to distance 0. Others infinite.';
    if (relaxedCount === 1) return 'Relaxed outbound edges from A. Distances: B updated to 4, C updated to 2.';
    if (relaxedCount === 2) return 'Relaxed edges from optimal frontier C. B updated to 3 via path A➔C➔B.';
    return 'Dijkstra fully completed. Minimal distance spans finalized across graph network.';
  }, [relaxedCount]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[320px] overflow-x-auto">
        <div className="grid grid-cols-2 gap-8 w-full max-w-lg items-center">
          {/* Simple Vector Graph view */}
          <div className="flex flex-col items-center gap-6 border-r border-border/50 pr-6">
            <span className="font-mono text-xs font-bold text-primary">Weighted Topology</span>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex justify-center">
                <span className="rounded-full border-2 border-primary bg-primary/20 text-primary w-10 h-10 flex items-center justify-center font-bold">A</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="rounded-full border-2 border-border bg-surface text-foreground w-10 h-10 flex items-center justify-center font-bold">B</span>
                <span className="rounded-full border-2 border-border bg-surface text-foreground w-10 h-10 flex items-center justify-center font-bold">C</span>
              </div>
              <div className="flex justify-center">
                <span className="rounded-full border-2 border-border bg-surface text-foreground w-10 h-10 flex items-center justify-center font-bold">D</span>
              </div>
            </div>
          </div>

          {/* Distance Lookup Matrix */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-foreground mb-1">Min-Distance Register</span>
            {Object.entries(distances).map(([node, dist]) => (
              <div key={`dist-${node}`} className="flex items-center justify-between border-b border-border/60 py-1.5 font-mono text-xs">
                <span className="text-muted-foreground">dist[{node}]</span>
                <span className={cn('font-bold', dist !== '∞' ? 'text-primary' : 'text-muted-foreground')}>
                  {dist}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-xs font-mono text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border text-center max-w-md">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setRelaxedCount((prev) => (prev < 3 ? prev + 1 : 0))}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          {relaxedCount < 3 ? 'Step Relaxation' : 'Restart Algorithm'}
        </button>
        <span className="font-mono text-xs text-muted-foreground">Step {relaxedCount}/3</span>
      </div>
    </div>
  );
}

// 9. Dynamic Programming: Fibonacci Tabulation
function DpFibonacciVisualizer() {
  const [step, setStep] = useState<number>(2);
  const dpTable = useMemo(() => {
    const res: number[] = [0, 1];
    for (let i = 2; i <= 8; i++) {
      res.push(res[i - 1] + res[i - 2]);
    }
    return res;
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] overflow-x-auto">
        <div className="flex flex-col items-center gap-2 w-full max-w-xl">
          <span className="font-mono text-xs text-muted-foreground mb-2">Tabulation Array: dp[0..8]</span>
          <div className="flex gap-2 p-3 bg-surface rounded-xl border border-border w-full justify-center">
            {dpTable.map((val, idx) => {
              const isFilled = idx <= step;
              const isTargeted = idx === step;
              const isOperand = idx === step - 1 || idx === step - 2;
              return (
                <div
                  key={`dpf-${idx}`}
                  className={cn(
                    'w-11 h-14 rounded-lg border flex flex-col items-center justify-center font-mono transition-all relative',
                    isTargeted
                      ? 'border-primary bg-primary text-primary-foreground font-bold scale-110 shadow-glow z-10'
                      : isOperand
                        ? 'border-warning bg-warning/20 text-warning font-bold'
                        : isFilled
                          ? 'border-border bg-background text-foreground'
                          : 'border-border/30 bg-background/20 text-transparent',
                  )}
                >
                  <span className="text-sm">{isFilled ? val : ''}</span>
                  <span className="absolute -bottom-4 text-[8px] text-muted-foreground font-sans">#{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 text-xs font-mono text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border text-center max-w-lg">
          {step < dpTable.length - 1
            ? `Calculating state dp[${step + 1}] = dp[${step}] + dp[${step - 1}] = ${dpTable[step]} + ${dpTable[step - 1]} = ${dpTable[step + 1]}`
            : 'Linear tabulation complete! Optimal substructure completely calculated in O(n).'}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((prev) => (prev < dpTable.length - 1 ? prev + 1 : 1))}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          {step < dpTable.length - 1 ? 'Step Computation' : 'Reset Tabulation'}
        </button>
        <span className="font-mono text-xs text-muted-foreground">Index {step}/8</span>
      </div>
    </div>
  );
}

// 10. Dynamic Programming: 0/1 Knapsack
function DpKnapsackVisualizer() {
  const [filled, setFilled] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[320px] overflow-x-auto">
        <div className="flex flex-col items-center gap-2 max-w-lg w-full">
          <span className="font-mono text-xs text-primary font-bold">2D DP Grid Optimization</span>
          {/* Simple representative Grid layout */}
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-1.5 font-mono text-xs w-full">
            <div className="flex justify-between border-b border-border/60 pb-1 text-muted-foreground font-bold">
              <span>Item / Cap</span>
              <span>w=0</span>
              <span>w=1</span>
              <span>w=2</span>
              <span>w=3</span>
              <span>w=4</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">#1 (wt:1, v:10)</span>
              <span>0</span>
              <span className="text-primary font-bold">10</span>
              <span className="text-primary font-bold">10</span>
              <span className="text-primary font-bold">10</span>
              <span className="text-primary font-bold">10</span>
            </div>
            <div className="flex justify-between py-1 border-t border-border/40">
              <span className="text-muted-foreground">#2 (wt:2, v:20)</span>
              <span>0</span>
              <span>10</span>
              <span className="text-primary font-bold">20</span>
              <span className="text-primary font-bold">30</span>
              <span className="text-primary font-bold">30</span>
            </div>
            <div className="flex justify-between py-1 border-t border-border/40">
              <span className="text-muted-foreground">#3 (wt:3, v:40)</span>
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span className="text-primary font-bold">40</span>
              <span className={cn('transition-all font-bold', filled ? 'text-success bg-success/20 px-1 rounded shadow-glow' : 'text-primary')}>
                {filled ? '50' : '30'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs font-mono text-muted-foreground bg-surface px-4 py-1.5 rounded border border-border text-center">
          {filled
            ? 'Optimal multi-choice subset state identified at bottom-right cell: Maximum Value 50.'
            : 'Grid tracks whether to bypass or collect items at specific integer sub-capacities.'}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFilled((prev) => !prev)}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          {filled ? 'Reset Matrix' : 'Evaluate Maximum Final Value'}
        </button>
        <span className="font-mono text-xs text-muted-foreground">O(N × W) matrix evaluation</span>
      </div>
    </div>
  );
}

// ── REUSED ORIGINAL VISUALIZERS ──

// 5. Binary Search Visualizer
function BinarySearchVisualizer() {
  const arr = useMemo(() => [3, 8, 12, 19, 24, 31, 45, 56, 67, 82, 95], []);
  const [targetVal, setTargetVal] = useState<string>('45');
  const [low, setLow] = useState<number>(0);
  const [high, setHigh] = useState<number>(10);
  const [mid, setMid] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<string>('Click "Start" to locate target value.');
  const [finished, setFinished] = useState<boolean>(false);

  const startSearch = () => {
    const t = parseInt(targetVal, 10);
    if (isNaN(t)) return;
    setLow(0);
    setHigh(arr.length - 1);
    const initialMid = Math.floor((0 + arr.length - 1) / 2);
    setMid(initialMid);
    setFinished(false);
    setVerdict(`Searching for ${t}. Interval: [0..${arr.length - 1}]. Calculated Mid: ${initialMid} (val: ${arr[initialMid]}).`);
  };

  const stepForward = () => {
    if (finished || mid === null) return;
    const t = parseInt(targetVal, 10);
    const midVal = arr[mid];

    if (midVal === t) {
      setVerdict(`Target ${t} FOUND at index ${mid}! Final Search Complexity: O(log n).`);
      setFinished(true);
      return;
    }

    let nextLow = low;
    let nextHigh = high;

    if (midVal < t) {
      nextLow = mid + 1;
    } else {
      nextHigh = mid - 1;
    }

    if (nextLow > nextHigh) {
      setVerdict(`Target ${t} NOT FOUND. Interval empty (Low > High).`);
      setFinished(true);
      setMid(null);
      setLow(nextLow);
      setHigh(nextHigh);
      return;
    }

    const nextMid = Math.floor((nextLow + nextHigh) / 2);
    setLow(nextLow);
    setHigh(nextHigh);
    setMid(nextMid);
    setVerdict(`Mid val ${midVal} ${midVal < t ? '<' : '>'} target ${t}. Narrowing interval to [${nextLow}..${nextHigh}]. New Mid: ${nextMid} (val: ${arr[nextMid]}).`);
  };

  const reset = () => {
    setLow(0);
    setHigh(arr.length - 1);
    setMid(null);
    setFinished(false);
    setVerdict('Interval reset. Click "Start Search".');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] overflow-x-auto">
        <div className="flex gap-2 mb-3 px-4 w-full justify-center">
          {arr.map((_, idx) => {
            const isL = idx === low;
            const isM = idx === mid;
            const isH = idx === high;
            return (
              <div key={`ptr-${idx}`} className="w-11 h-6 flex justify-center items-end gap-0.5">
                {isL && <span className="rounded bg-primary px-1 font-mono text-[9px] text-primary-foreground font-bold">L</span>}
                {isM && <span className="rounded bg-warning px-1 font-mono text-[9px] text-warning-foreground font-bold animate-bounce">M</span>}
                {isH && <span className="rounded bg-destructive px-1 font-mono text-[9px] text-destructive-foreground font-bold">R</span>}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 px-4 justify-center items-center">
          {arr.map((val, idx) => {
            const inRange = idx >= low && idx <= high;
            const isMid = idx === mid;
            const isFound = finished && isMid && arr[mid] === parseInt(targetVal, 10);
            return (
              <div
                key={`box-${idx}`}
                className={cn(
                  'w-11 h-14 rounded-lg border flex flex-col items-center justify-center font-mono transition-all',
                  isFound
                    ? 'border-success bg-success/20 text-success font-bold scale-110 shadow-glow'
                    : isMid
                      ? 'border-warning bg-warning/20 text-warning font-bold scale-105'
                      : inRange
                        ? 'border-border bg-surface text-foreground'
                        : 'border-border/30 bg-background/40 text-muted-foreground/30',
                )}
              >
                <span className="text-sm">{val}</span>
                <span className="text-[8px] opacity-60 mt-1 border-t border-border/40 w-full text-center">
                  {idx}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-xs font-mono text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border text-center max-w-xl">
          {verdict}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">Target:</span>
          <input
            type="number"
            value={targetVal}
            onChange={(e) => setTargetVal(e.target.value)}
            className="w-16 h-9 rounded-md border border-border bg-background px-2 text-sm font-mono focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={startSearch}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all flex items-center gap-1.5"
          >
            <Search className="h-4 w-4" /> Start
          </button>
          <button
            type="button"
            onClick={stepForward}
            disabled={finished || mid === null}
            className="h-9 px-4 rounded-md bg-surface border border-border text-foreground text-sm font-medium hover:border-primary transition-all disabled:opacity-40"
          >
            Step
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// 6. Generic Sorting Bar Visualizer
function SortingVisualizer({ algoName }: { algoName: string }) {
  const [sourceArray, setSourceArray] = useState(() => Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 8));
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps: SortStep[] = useMemo(() => generateSteps(algoName, sourceArray), [algoName, sourceArray]);
  const currentStep = steps[stepIndex] ?? steps[0];
  const isFinished = stepIndex >= steps.length - 1;

  const advanceFrame = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= steps.length - 1) {
        setPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  const stepBack = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advanceFrame, 600 / speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [advanceFrame, playing, speed]);

  const shuffle = () => {
    setSourceArray(Array.from({ length: 16 }, () => Math.floor(Math.random() * 90) + 8));
    setStepIndex(0);
    setPlaying(false);
  };

  const restart = () => {
    setStepIndex(0);
    setPlaying(false);
  };

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [algoName]);

  const bars = currentStep.array;
  const maxVal = Math.max(...bars, 1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 scanline flex items-end justify-center gap-1.5 p-6 min-h-[320px]">
        {bars.map((v, i) => {
          const isActive = currentStep.active.includes(i);
          const isSorted = currentStep.sorted.includes(i);
          const heightPct = (v / maxVal) * 100;
          return (
            <motion.div
              key={i}
              layout
              animate={{
                height: `${heightPct * 2.8}px`,
                backgroundColor: isActive
                  ? 'oklch(0.78 0.18 152)'
                  : isSorted
                    ? 'oklch(0.6 0.15 152 / 0.5)'
                    : 'oklch(0.35 0.014 160)',
              }}
              transition={{ duration: 0.25, ease: easeSmooth }}
              className="group relative w-8 rounded-t-sm"
            >
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">
                {v}
              </span>
              {isActive && (
                <motion.div layoutId="active-glow" className="absolute inset-0 rounded-t-sm shadow-glow" />
              )}
            </motion.div>
          );
        })}
      </div>

      {currentStep.label && (
        <div className="border-t border-border px-4 py-2 text-center font-mono text-xs text-primary bg-surface/30">
          Step {stepIndex}/{steps.length - 1}: {currentStep.label}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border p-4 bg-surface/50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={stepBack}
            disabled={stepIndex === 0}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={restart}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isFinished) {
                setStepIndex(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:shadow-glow"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={advanceFrame}
            disabled={isFinished}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Shuffle className="h-4 w-4" /> Shuffle
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">Speed</span>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-24 accent-[var(--color-primary)]"
          />
          <span className="w-8 font-mono text-xs text-primary">{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}

// 7. Tree Visualizer
function TreeVisualizer({ isBst }: { isBst: boolean }) {
  const treeNodes = [50, 30, 70, 20, 40, 60, 80];
  const [visited, setVisited] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<string>(
    isBst
      ? 'BST property ensures Left Child < Parent < Right Child for log(n) retrieval.'
      : 'Standard Binary Tree layout. Explore recursive traversal algorithms below.',
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  const runTraversal = (order: 'pre' | 'in' | 'post') => {
    clearTimer();
    setVisited([]);
    setActiveIdx(null);

    const sequence: number[] = [];
    const traversePre = (i: number) => {
      if (i >= treeNodes.length) return;
      sequence.push(i);
      traversePre(2 * i + 1);
      traversePre(2 * i + 2);
    };
    const traverseIn = (i: number) => {
      if (i >= treeNodes.length) return;
      traverseIn(2 * i + 1);
      sequence.push(i);
      traverseIn(2 * i + 2);
    };
    const traversePost = (i: number) => {
      if (i >= treeNodes.length) return;
      traversePost(2 * i + 1);
      traversePost(2 * i + 2);
      sequence.push(i);
    };

    if (order === 'pre') traversePre(0);
    else if (order === 'in') traverseIn(0);
    else traversePost(0);

    setVerdict(`Running ${order.toUpperCase()}-order Traversal. Visualizing exploration sequence...`);

    let step = 0;
    intervalRef.current = setInterval(() => {
      if (step >= sequence.length) {
        clearTimer();
        setActiveIdx(null);
        setVerdict(`${order.toUpperCase()}-order Traversal complete! Nodes explored in complete compliance.`);
        return;
      }
      const currIdx = sequence[step];
      setActiveIdx(currIdx);
      setVisited((prev) => [...prev, currIdx]);
      step++;
    }, 800);
  };

  const reset = () => {
    clearTimer();
    setVisited([]);
    setActiveIdx(null);
    setVerdict('Tree reset.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] relative overflow-x-auto">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <div className="flex justify-center w-full">
            <TreeNodeBox val={treeNodes[0]} idx={0} active={activeIdx === 0} isVisited={visited.includes(0)} />
          </div>
          <div className="flex justify-between w-2/3 px-4 border-t-2 border-border/40 pt-4 relative">
            <TreeNodeBox val={treeNodes[1]} idx={1} active={activeIdx === 1} isVisited={visited.includes(1)} />
            <TreeNodeBox val={treeNodes[2]} idx={2} active={activeIdx === 2} isVisited={visited.includes(2)} />
          </div>
          <div className="flex justify-between w-full px-2 border-t-2 border-border/20 pt-4 relative">
            <TreeNodeBox val={treeNodes[3]} idx={3} active={activeIdx === 3} isVisited={visited.includes(3)} />
            <TreeNodeBox val={treeNodes[4]} idx={4} active={activeIdx === 4} isVisited={visited.includes(4)} />
            <TreeNodeBox val={treeNodes[5]} idx={5} active={activeIdx === 5} isVisited={visited.includes(5)} />
            <TreeNodeBox val={treeNodes[6]} idx={6} active={activeIdx === 6} isVisited={visited.includes(6)} />
          </div>
        </div>

        <div className="mt-8 text-xs font-mono text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border text-center max-w-xl">
          {verdict}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runTraversal('pre')}
            className="h-9 px-3 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all"
          >
            Pre-order
          </button>
          <button
            type="button"
            onClick={() => runTraversal('in')}
            className="h-9 px-3 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all"
          >
            In-order
          </button>
          <button
            type="button"
            onClick={() => runTraversal('post')}
            className="h-9 px-3 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all"
          >
            Post-order
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function TreeNodeBox({ val, idx, active, isVisited }: { val: number; idx: number; active: boolean; isVisited: boolean }) {
  return (
    <div
      className={cn(
        'w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-display font-bold transition-all relative shadow-sm',
        active
          ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-glow z-10'
          : isVisited
            ? 'border-success bg-success/15 text-success'
            : 'border-border bg-background text-foreground',
      )}
    >
      <span className="text-sm">{val}</span>
      <span className="absolute -bottom-5 text-[8px] font-mono text-muted-foreground">#{idx}</span>
    </div>
  );
}

// 8. Graph Visualizer (BFS / DFS)
function GraphVisualizer({ isDfs }: { isDfs: boolean }) {
  const nodesMeta = [
    { id: 0, label: 'A', x: 50, y: 30 },
    { id: 1, label: 'B', x: 20, y: 100 },
    { id: 2, label: 'C', x: 80, y: 100 },
    { id: 3, label: 'D', x: 30, y: 180 },
    { id: 4, label: 'E', x: 70, y: 180 },
  ];
  const [visited, setVisited] = useState<number[]>([]);
  const [frontier, setFrontier] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>(
    isDfs
      ? 'DFS utilizes Backtracking recursion/Stack to travel deeply down branches.'
      : 'BFS expands outward homogeneously level by level using a Queue.',
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  const startTraversal = () => {
    clearTimer();
    setVisited([]);
    setFrontier([]);
    setActive(null);

    const sequence = isDfs ? [0, 1, 3, 4, 2] : [0, 1, 2, 3, 4];
    setMsg(`Starting ${isDfs ? 'DFS' : 'BFS'} exploration starting from node A...`);

    let step = 0;
    intervalRef.current = setInterval(() => {
      if (step >= sequence.length) {
        clearTimer();
        setActive(null);
        setFrontier([]);
        setMsg(`${isDfs ? 'DFS' : 'BFS'} traversal fully completed! All interconnected elements reached.`);
        return;
      }
      const u = sequence[step];
      setActive(u);
      setVisited((prev) => [...prev, u]);
      setFrontier(sequence.slice(step + 1, step + 3));
      step++;
    }, 1000);
  };

  const reset = () => {
    clearTimer();
    setVisited([]);
    setFrontier([]);
    setActive(null);
    setMsg('Graph state reset.');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[320px] relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line x1="50%" y1="35%" x2="35%" y2="55%" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="35%" x2="65%" y2="55%" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="35%" y1="55%" x2="40%" y2="75%" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="65%" y1="55%" x2="60%" y2="75%" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4" />
          <line x1="40%" y1="75%" x2="60%" y2="75%" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4" />
        </svg>

        <div className="relative w-full max-w-xs h-56 flex flex-col justify-between items-center z-10">
          <div className="flex justify-center w-full">
            <GraphNode id={0} label="A" active={active === 0} isVisited={visited.includes(0)} isFrontier={frontier.includes(0)} />
          </div>
          <div className="flex justify-between w-3/4 px-4">
            <GraphNode id={1} label="B" active={active === 1} isVisited={visited.includes(1)} isFrontier={frontier.includes(1)} />
            <GraphNode id={2} label="C" active={active === 2} isVisited={visited.includes(2)} isFrontier={frontier.includes(2)} />
          </div>
          <div className="flex justify-between w-1/2">
            <GraphNode id={3} label="D" active={active === 3} isVisited={visited.includes(3)} isFrontier={frontier.includes(3)} />
            <GraphNode id={4} label="E" active={active === 4} isVisited={visited.includes(4)} isFrontier={frontier.includes(4)} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 font-mono text-xs">
          <span className="text-muted-foreground">{isDfs ? 'Stack Contents:' : 'Queue Frontier:'}</span>
          {frontier.length === 0 ? (
            <span className="text-muted-foreground italic">empty</span>
          ) : (
            frontier.map((f) => (
              <span key={`f-${f}`} className="rounded bg-surface px-2 py-0.5 border border-border text-primary font-bold">
                {nodesMeta.find((n) => n.id === f)?.label}
              </span>
            ))
          )}
        </div>

        <div className="mt-4 text-xs font-mono text-muted-foreground bg-surface px-4 py-2 rounded-lg border border-border text-center max-w-xl">
          {msg}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-surface/50 flex items-center justify-between">
        <button
          type="button"
          onClick={startTraversal}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:shadow-glow transition-all flex items-center gap-1.5"
        >
          <Play className="h-4 w-4" /> Start Traversal
        </button>
        <button
          type="button"
          onClick={reset}
          className="h-9 px-3 rounded-md text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function GraphNode({ label, active, isVisited, isFrontier }: { id: number; label: string; active: boolean; isVisited: boolean; isFrontier: boolean }) {
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-xl border-2 flex items-center justify-center font-display font-bold transition-all shadow-sm',
        active
          ? 'border-primary bg-primary text-primary-foreground scale-110 shadow-glow z-20'
          : isVisited
            ? 'border-success bg-success/15 text-success'
            : isFrontier
              ? 'border-warning bg-warning/10 text-warning border-dashed'
              : 'border-border bg-background text-foreground',
      )}
    >
      {label}
    </div>
  );
}

// ── MAIN VISUALIZER PAGE MASTER HUB ──────────────────────────────────────────

export default function VisualizerPage() {
  const location = useLocation();
  const locState = location.state as { topicSlug?: string } | null;

  const initialSlug = useMemo(() => {
    if (locState?.topicSlug) return locState.topicSlug;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryTopic = params.get('topic');
      if (queryTopic && TOPICS_DATA.some((t) => t.slug === queryTopic)) {
        return queryTopic;
      }
    }
    return 'hash-table';
  }, [locState]);

  const [activeSlug, setActiveSlug] = useState<string>(initialSlug);
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const matched = TOPICS_DATA.find((t) => t.slug === initialSlug);
    return matched?.category ?? CATEGORIES[1];
  });

  const activeTopicMeta = useMemo(() => {
    return TOPICS_DATA.find((t) => t.slug === activeSlug) ?? TOPICS_DATA[4];
  }, [activeSlug]);

  const selectCategory = (cat: string) => {
    setActiveCategory(cat);
    const first = TOPICS_DATA.find((t) => t.category === cat);
    if (first) setActiveSlug(first.slug);
  };

  const categoryTopics = useMemo(() => {
    return TOPICS_DATA.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const renderVisualizerContent = () => {
    switch (activeSlug) {
      case 'array':
        return <ArrayVisualizer />;
      case 'linked-list':
        return <LinkedListVisualizer />;
      case 'stack':
        return <StackVisualizer />;
      case 'queue':
        return <QueueVisualizer />;
      case 'hash-table':
        return <HashTableVisualizer />;
      case 'heap':
        return <HeapVisualizer />;
      case 'trie':
        return <TrieVisualizer />;
      case 'bubble-sort':
      case 'selection-sort':
      case 'insertion-sort':
      case 'merge-sort':
      case 'quick-sort':
        return <SortingVisualizer algoName={activeTopicMeta.title} />;
      case 'binary-search':
        return <BinarySearchVisualizer />;
      case 'binary-tree':
        return <TreeVisualizer isBst={false} />;
      case 'binary-search-tree':
        return <TreeVisualizer isBst={true} />;
      case 'bfs':
        return <GraphVisualizer isDfs={false} />;
      case 'dfs':
        return <GraphVisualizer isDfs={true} />;
      case 'dijkstra':
        return <DijkstraVisualizer />;
      case 'dp-fibonacci':
        return <DpFibonacciVisualizer />;
      case 'knapsack':
        return <DpKnapsackVisualizer />;
      default:
        return <HashTableVisualizer />;
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="mb-4 font-mono text-xs text-muted-foreground flex items-center gap-2">
            <span>Topics</span>
            <span>/</span>
            <span className="text-foreground">{activeCategory}</span>
            <span>/</span>
            <span className="text-primary font-bold">{activeTopicMeta.title}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[240px_1fr_360px]">
            {/* Sidebar Modules Nav */}
            <aside className="space-y-6">
              <div>
                <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Data Structures
                </div>
                <nav className="space-y-1">
                  {CATEGORIES.slice(0, 2).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-left',
                        activeCategory === cat
                          ? 'bg-primary/10 border border-primary/20 text-primary font-bold'
                          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      )}
                    >
                      <span>{cat.replace(' Structures', '')}</span>
                      {cat.includes('Linear') ? <Layers className="h-4 w-4 opacity-70" /> : <Database className="h-4 w-4 opacity-70" />}
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Algorithms & DP
                </div>
                <nav className="space-y-1">
                  {CATEGORIES.slice(2).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all text-left',
                        activeCategory === cat
                          ? 'bg-primary/10 border border-primary/20 text-primary font-bold'
                          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      )}
                    >
                      <span>{cat.replace(' Algorithms', '').replace('Dynamic ', '')}</span>
                      {cat.includes('Sorting') ? (
                        <Zap className="h-4 w-4 opacity-70" />
                      ) : cat.includes('Searching') ? (
                        <Search className="h-4 w-4 opacity-70" />
                      ) : cat.includes('Trees') ? (
                        <Network className="h-4 w-4 opacity-70" />
                      ) : (
                        <Grid className="h-4 w-4 opacity-70" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="rounded-xl border border-border bg-gradient-surface p-4 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" /> Advanced Toolkit
                </div>
                <p className="leading-relaxed">
                  Leverage premium discrete matrix layers, heuristic bounds, and memoized caching pipelines for thorough educational feedback.
                </p>
              </div>
            </aside>

            {/* Custom Interactive Module Hub */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface min-h-[500px]">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-3 bg-background/50">
                {categoryTopics.map((topicItem) => (
                  <button
                    key={topicItem.slug}
                    type="button"
                    onClick={() => setActiveSlug(topicItem.slug)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                      activeSlug === topicItem.slug
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground border border-transparent',
                    )}
                  >
                    {topicItem.title}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                {renderVisualizerContent()}
              </div>
            </div>

            {/* Realtime Metrics & Code Inspector Sidebar */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-foreground">{activeTopicMeta.title}</h3>
                  {activeTopicMeta.stable !== undefined && (
                    <span
                      className={cn(
                        'rounded border px-2 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider',
                        activeTopicMeta.stable
                          ? 'border-success/30 bg-success/15 text-success'
                          : 'border-warning/30 bg-warning/15 text-warning',
                      )}
                    >
                      {activeTopicMeta.stable ? 'STABLE' : 'UNSTABLE'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{activeTopicMeta.description}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 font-mono text-xs text-primary font-bold tracking-wider uppercase">COMPLEXITY/</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Best Time</div>
                    <div className="mt-1 font-mono font-bold text-primary">{activeTopicMeta.bestTime}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Average Time</div>
                    <div className="mt-1 font-mono font-bold text-primary">{activeTopicMeta.avgTime}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Worst Time</div>
                    <div className="mt-1 font-mono font-bold text-primary">{activeTopicMeta.worstTime}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <div className="text-[10px] text-muted-foreground uppercase">Space</div>
                    <div className="mt-1 font-mono font-bold text-primary">{activeTopicMeta.spaceComplexity}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center gap-1.5 font-mono text-xs text-primary font-bold tracking-wider uppercase">
                  <Zap className="h-3.5 w-3.5" /> PSEUDOCODE/
                </div>
                <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto p-3 bg-background rounded border border-border">
                  {activeTopicMeta.pseudo}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
