---
title: "Quick Sort"
date: "2026-02-28"
author: "An Thanh Phan"
excerpt: "An analysis of Quick Sort. Why it wins in practice. Covers Lomuto and Hoare partitioning, pivot strategies, worst-case analysis, tail-call optimization, the QuickSelect algorithm, and LeetCode applications."
tags: ["algorithms", "sorting", "divide-and-conquer", "complexity-analysis"]
topic: "Data Structures and Algorithms"
featured: false
series:
  name: "Sorting Algorithms"
  order: 3
---

## 1. Introduction

[Merge Sort](/post/2026-02-merge-sort) hits $O(n \log n)$ but burns $O(n)$ extra space doing it. Quick Sort matches that speed **in practice** while sorting **in-place** using only $O(\log n)$ stack space.

> **History:** Tony Hoare invented Quick Sort in 1959 at Moscow State University. He needed to sort words for a Russian-to-English dictionary. Today, it stands as the most widely used sorting algorithm in the world.

### 1.1 Why Quick Sort Dominates

| Property | Merge Sort | Quick Sort |
|----------|-----------|------------|
| Worst case | $O(n \log n)$ | $O(n^2)$ |
| Average case | $O(n \log n)$ | $O(n \log n)$ |
| Auxiliary space | $O(n)$ | $O(\log n)$ |
| Cache performance | Poor (copies between arrays) | **Excellent** (in-place, sequential) |
| In practice | Slower constant factor | **2-3× faster** |

The $O(n^2)$ worst case sounds dangerous. With proper pivot selection, it almost never happens. The algorithm runs in-place. It plays perfectly with CPU caches. These physical traits make it the default in-memory sorter for C, C++, Java (primitives), and Go.

---

## 2. Core Idea

### 2.1 Divide and Conquer

1. **Partition:** Pick a **pivot**. Shift all elements $\le$ the pivot to the left. Shift all elements $>$ the pivot to the right. The pivot locks into its **final sorted position**.
2. **Conquer:** Fire off recursive sorts on the left and right subarrays.
3. **Combine:** Do nothing. The partitioning already sorted the data in-place.

**The contrast:** Merge Sort does all its heavy lifting during the **combine** phase. Quick Sort does the hard work upfront during the **divide** phase. Since the pivot lands exactly where it belongs, the algorithm skips the combine step entirely.

### 2.2 The Partition Invariant

After partitioning around pivot $p$, the array satisfies:

$$A[lo..q-1] \le p = A[q] \le A[q+1..hi]$$

where $q$ is the pivot's final index. This means:
- Every element left of $q$ is $\le p$
- Every element right of $q$ is $> p$ (or $\ge p$ depending on scheme)
- The pivot $A[q]$ is in its **final sorted position** — it will never move again

---

## 3. Implementation

### 3.1 Lomuto Partition Scheme

The simpler of two common partition schemes. Uses the **last element** as pivot:

```go
func quickSort(a []int, lo, hi int) {
    if lo >= hi {
        return
    }
    p := lomutoPartition(a, lo, hi)
    quickSort(a, lo, p-1)
    quickSort(a, p+1, hi)
}

func lomutoPartition(a []int, lo, hi int) int {
    pivot := a[hi] // choose last element as pivot
    i := lo        // i = boundary of "≤ pivot" region

    for j := lo; j < hi; j++ {
        if a[j] <= pivot {
            a[i], a[j] = a[j], a[i]
            i++
        }
    }

    a[i], a[hi] = a[hi], a[i] // place pivot at boundary
    return i
}
```

**How Lomuto works — the invariant:**

At any point during the loop, the array is divided into four regions:

```
[  ≤ pivot  |  > pivot  |  unexamined  | pivot ]
   lo..i-1     i..j-1       j..hi-1       hi
```

- **`lo..i-1`** — elements $\le$ pivot (already processed and swapped left)
- **`i..j-1`** — elements $>$ pivot (processed but stayed right)
- **`j..hi-1`** — not yet examined
- **`hi`** — the pivot itself

**For each element `a[j]`:**
- If `a[j] <= pivot`: swap `a[j]` with `a[i]` (move it into the $\le$ region), then increment `i` to grow the $\le$ region
- If `a[j] > pivot`: skip it — it's already in the $>$ region, just advance `j`

After the loop, swap `a[i]` with `a[hi]` to place the pivot between the two regions.

### 3.2 Hoare Partition Scheme

Tony Hoare's original scheme uses two pointers that scan inward from both ends:

```go
func hoarePartition(a []int, lo, hi int) int {
    pivot := a[lo] // choose first element as pivot
    i, j := lo-1, hi+1

    for {
        // Move i right until we find an element >= pivot
        for {
            i++
            if a[i] >= pivot {
                break
            }
        }
        // Move j left until we find an element <= pivot
        for {
            j--
            if a[j] <= pivot {
                break
            }
        }
        if i >= j {
            return j
        }
        a[i], a[j] = a[j], a[i]
    }
}
```

**Hoare vs Lomuto:**

| Aspect | Lomuto | Hoare |
|--------|--------|-------|
| Swaps (average) | $\sim n/2$ | $\sim n/6$ |
| Swaps (sorted input) | $0$ | $n/2$ |
| Duplicate handling | Poor (all equal → $O(n^2)$) | Good |
| Implementation | Simpler | Trickier (off-by-one) |
| Returned index | Pivot's final position | Boundary (pivot may not be at `j`) |

> **Efficiency:** Hoare executes roughly $3\times$ fewer swaps. Both pointers actively skip elements that already sit on the correct side. Lomuto runs blind and swaps everything.

### 3.3 Three-Way Partition (Dutch National Flag)

Throw a massive block of **duplicate** elements at Lomuto or Hoare, and they degrade. They fail to distribute identical numbers evenly. Dijkstra's **three-way partition** (the Dutch National Flag) fixes this edge case instantly:

```go
func quickSort3Way(a []int, lo, hi int) {
    if lo >= hi {
        return
    }
    pivot := a[lo]
    lt, gt := lo, hi // lt = less-than boundary, gt = greater-than boundary
    i := lo + 1

    for i <= gt {
        if a[i] < pivot {
            a[lt], a[i] = a[i], a[lt]
            lt++
            i++
        } else if a[i] > pivot {
            a[gt], a[i] = a[i], a[gt]
            gt--
            // don't increment i — the swapped element hasn't been examined
        } else {
            i++ // a[i] == pivot, leave in place
        }
    }

    // Now: a[lo..lt-1] < pivot, a[lt..gt] == pivot, a[gt+1..hi] > pivot
    quickSort3Way(a, lo, lt-1)
    quickSort3Way(a, gt+1, hi)
}
```

**The three regions:**

```
[  < pivot  |  = pivot  |  unexamined  |  > pivot  ]
   lo..lt-1    lt..i-1      i..gt        gt+1..hi
```

**Why this matters:** If all elements are equal, `lt = lo` and `gt = hi` after one pass — the recursion terminates immediately. Time complexity with $k$ distinct values: $O(n \log k)$ instead of $O(n^2)$.

### 3.4 Pivot Selection Strategies

The pivot determines the partition balance. Bad pivots lead to $O(n^2)$:

| Strategy | How | Worst case | When to use |
|----------|-----|-----------|-------------|
| **Last element** | `pivot = a[hi]` | Sorted/reverse-sorted input | Teaching |
| **Random** | `pivot = a[random(lo, hi)]` | Extremely unlikely $O(n^2)$ | **General purpose** |
| **Median-of-three** | Median of `a[lo], a[mid], a[hi]` | Rare adversarial inputs | **Production** |
| **Ninther** | Median of 3 medians-of-3 | Very rare | Large $n$ |

**Median-of-three** implementation:

```go
func medianOfThree(a []int, lo, hi int) int {
    mid := lo + (hi-lo)/2
    if a[lo] > a[mid] {
        a[lo], a[mid] = a[mid], a[lo]
    }
    if a[lo] > a[hi] {
        a[lo], a[hi] = a[hi], a[lo]
    }
    if a[mid] > a[hi] {
        a[mid], a[hi] = a[hi], a[mid]
    }
    // Now a[lo] <= a[mid] <= a[hi]
    // Move median to hi-1 position for Lomuto
    a[mid], a[hi-1] = a[hi-1], a[mid]
    return a[hi-1]
}
```

> **The math behind the median:** It kills the worst-case scenario on pre-sorted or reversed data. Finding the median of three points guarantees at least a 25%-75% split. That uneven, but bounded, split secures the $O(n \log n)$ absolute runtime.

### 3.5 Interactive Visualization

```sorting-visualizer
algorithm: quick-sort
array: 38,27,43,3,9,82,10,15
```

---

## 4. Step-by-Step Trace

**Input:** $[38, 27, 43, 3, 9, 82, 10, 15]$ — using Lomuto partition (last element as pivot).

### 4.1 First Partition: pivot = 15

Scan through $A[0..6]$, comparing each element to $15$:

| $j$ | $A[j]$ | $A[j] \le 15$? | Action | $i$ after | Array |
|-----|--------|---------------|--------|-----------|-------|
| 0 | 38 | No | skip | 0 | $[38, 27, 43, 3, 9, 82, 10, 15]$ |
| 1 | 27 | No | skip | 0 | unchanged |
| 2 | 43 | No | skip | 0 | unchanged |
| 3 | 3 | Yes | swap $A[0] \leftrightarrow A[3]$ | 1 | $[\mathbf{3}, 27, 43, \mathbf{38}, 9, 82, 10, 15]$ |
| 4 | 9 | Yes | swap $A[1] \leftrightarrow A[4]$ | 2 | $[3, \mathbf{9}, 43, 38, \mathbf{27}, 82, 10, 15]$ |
| 5 | 82 | No | skip | 2 | unchanged |
| 6 | 10 | Yes | swap $A[2] \leftrightarrow A[6]$ | 3 | $[3, 9, \mathbf{10}, 38, 27, 82, \mathbf{43}, 15]$ |

Place pivot: swap $A[3] \leftrightarrow A[7]$:

$$[3, 9, 10, \mathbf{15}, 27, 82, 43, 38]$$

Pivot $15$ is at index $3$ — its **final sorted position**. ✓

### 4.2 Recurse Left: $[3, 9, 10]$, pivot = 10

| $j$ | $A[j]$ | $\le 10$? | Action |
|-----|--------|----------|--------|
| 0 | 3 | Yes | stays |
| 1 | 9 | Yes | stays |

Place pivot: $[3, 9, \mathbf{10}]$ — already in place. Pivot at index 2.

Recurse on $[3, 9]$, pivot $= 9$: $3 \le 9$ → stays. Result: $[3, \mathbf{9}]$. Both in position.

### 4.3 Recurse Right: $[27, 82, 43, 38]$, pivot = 38

| $j$ | $A[j]$ | $\le 38$? | Action |
|-----|--------|----------|--------|
| 4 | 27 | Yes | stays |
| 5 | 82 | No | skip |
| 6 | 43 | No | skip |

Place pivot: swap $A[5] \leftrightarrow A[7]$: $[27, \mathbf{38}, 43, 82]$. Pivot at index 5.

Recurse on $[43, 82]$, pivot $= 82$: $43 \le 82$ → stays. Result: $[43, \mathbf{82}]$.

**Final sorted array:** $[3, 9, 10, 15, 27, 38, 43, 82]$ ✓

---

## 5. Complexity Analysis

### 5.1 Best Case — Balanced Partitions

When the pivot always splits the array into two equal halves:

$$T(n) = 2T(n/2) + \Theta(n)$$

Same as Merge Sort → $T(n) = \Theta(n \log n)$.

### 5.2 Worst Case — Maximally Unbalanced

When the pivot is always the smallest or largest element (e.g., sorted input with last-element pivot):

$$T(n) = T(n-1) + T(0) + \Theta(n) = T(n-1) + \Theta(n)$$

Unrolling: $T(n) = \Theta(n) + \Theta(n-1) + \cdots + \Theta(1) = \Theta(n^2)$.

**When this happens:**
- Sorted/reverse-sorted input with first/last element pivot
- All equal elements with Lomuto partition

### 5.3 Average Case

For random input (or random pivot selection):

$$T(n) = \frac{1}{n}\sum_{q=0}^{n-1}\left[T(q) + T(n-1-q)\right] + \Theta(n)$$

Each partition rank $q$ is equally likely. By symmetry:

$$T(n) = \frac{2}{n}\sum_{q=0}^{n-1}T(q) + \Theta(n)$$

Solving this recurrence (via substitution $T(n) \le cn\ln n$):

$$T(n) = 2n\ln n + O(n) \approx 1.39 \cdot n\log_2 n$$

> **The reality:** Quick Sort's average case runs exactly 39% more comparisons than the absolute theoretical minimum ($n \log_2 n$). But out in the real world, its flawless cache behavior erases that math penalty entirely.

### 5.4 Space Complexity

| Case | Stack depth | Why |
|------|------------|-----|
| Best | $O(\log n)$ | Balanced partitions → balanced recursion tree |
| Worst | $O(n)$ | Degenerate partitions → linear recursion chain |
| With tail-call optimization | $O(\log n)$ always | Always recurse on the smaller half first |

**Tail-call optimization:**

```go
func quickSortTailCall(a []int, lo, hi int) {
    for lo < hi {
        p := lomutoPartition(a, lo, hi)
        // Recurse on the smaller half, iterate on the larger
        if p-lo < hi-p {
            quickSortTailCall(a, lo, p-1)
            lo = p + 1 // tail call on right half
        } else {
            quickSortTailCall(a, p+1, hi)
            hi = p - 1 // tail call on left half
        }
    }
}
```

By always recursing on the **smaller** partition and looping on the larger, the stack depth is at most $O(\log n)$ — each recursive call handles at most half the elements.

### 5.5 Property Summary

| Property | Value |
|----------|-------|
| **Time** | Best/Average $O(n \log n)$, Worst $O(n^2)$ |
| **Space** | $O(\log n)$ with tail-call optimization |
| **Stable** | ✗ (long-range swaps) |
| **Adaptive** | ✗ (but good on random data) |
| **In-place** | ✓ |

---

## 6. Quick Sort vs Merge Sort

| Aspect | Quick Sort | Merge Sort |
|--------|-----------|------------|
| Average comparisons | $1.39n \log n$ | $n \log n - 1.26n$ |
| Worst case | $O(n^2)$ | $O(n \log n)$ |
| Auxiliary space | $O(\log n)$ | $O(n)$ |
| Cache misses | **Few** (in-place, sequential) | Many (copy to aux array) |
| Stability | **Not stable** | Stable |
| Practical speed | **Faster** (2-3× due to cache) | Slower constant |
| Best for | Arrays in memory | Linked lists, external sorting, stability needed |

> **Hardware wins:** Quick Sort operates in-place. Merge Sort bounces data between two separate arrays. That bouncing causes **cache misses**. A single cache miss burns 100-200 CPU cycles. That hardware penalty easily outstrips Quick Sort's extra comparisons.

### 6.1 Introsort — Best of Both Worlds

**Introsort** (David Musser, 1997) fuses the best algorithms together. C++ STL (`std::sort`) and Go run it by default:

1. Fire off Quick Sort.
2. If the recursion dives deeper than $2\log_2 n$, abort and run **Heapsort** (locking in $O(n \log n)$).
3. If the partition drops below 16 items, drop to **Insertion Sort**.

This architecture guarantees a hard $O(n \log n)$ worst case without sacrificing the everyday speed of Quick Sort.

---

## 7. QuickSelect — Finding the k-th Smallest

### 7.1 The Problem

**Given:** An unsorted array $A[0..n-1]$ and an integer $k$.
**Find:** The $k$-th smallest element (the element that would be at index $k$ in the sorted array).

**Naive approach:** Sort the array in $O(n \log n)$, return $A[k]$.

**Better:** Use Quick Sort's partition — but only recurse into the half that contains index $k$.

### 7.2 Algorithm

```go
func quickSelect(a []int, lo, hi, k int) int {
    if lo == hi {
        return a[lo]
    }

    p := lomutoPartition(a, lo, hi)

    if k == p {
        return a[p] // pivot IS the k-th element
    } else if k < p {
        return quickSelect(a, lo, p-1, k) // k-th is in the left half
    } else {
        return quickSelect(a, p+1, hi, k) // k-th is in the right half
    }
}
```

**The mechanic:** The partition locks the pivot at index $p$. If $k = p$, stop. You found the answer. If $k < p$, look left. If $k > p$, look right. **You only ever recurse down one path.**

### 7.3 Complexity

**Average case:**

$$T(n) = T(n/2) + O(n)$$

By the Master Theorem: $a=1, b=2, f(n)=O(n)$, $\log_b a = 0$, $f(n) = \Omega(n^{0+\varepsilon})$ → **Case 3**: $T(n) = O(n)$.

**Comparison with sorting:**

| Approach | Time | 
|----------|------|
| Sort + index | $O(n \log n)$ |
| QuickSelect (average) | $O(n)$ |
| QuickSelect (worst) | $O(n^2)$ |
| Median of medians (worst-case) | $O(n)$ guaranteed |

> **The speed:** QuickSelect runs $O(n)$ on average. You don't waste time sorting the entire board. The work strictly drops in half every step forming a geometric series: $n + n/2 + n/4 + \cdots = 2n = O(n)$.

### 7.4 Median of Medians — Guaranteed $O(n)$

To avoid the $O(n^2)$ worst case, use the **Median of Medians** algorithm (Blum, Floyd, Pratt, Rivest, Tarjan, 1973):

1. Divide $A$ into groups of 5
2. Find the median of each group (by brute force — 5 elements)
3. Recursively find the median of these medians → use it as the pivot
4. Partition using this pivot and recurse into the relevant half

This guarantees at least a 30-70 split at each step, giving $T(n) = T(n/5) + T(7n/10) + O(n) = O(n)$.

> **Real-world execution:** Engineers stick to randomized QuickSelect. The strict Median of Medians carries a brutal constant factor penalty (~$5\times$). Unless you face targeted adversarial data, randomized QuickSelect hits $O(n)$ every single time.

---

## 8. Practical Applications

### 8.1 [Easy] Sort an Array — LeetCode #912

> [leetcode.com/problems/sort-an-array](https://leetcode.com/problems/sort-an-array/)

**Problem:** Sort an array of integers.

**Why this matters:** This problem is a litmus test for Quick Sort — naive implementations get TLE on sorted/reverse-sorted inputs. You need proper pivot selection and three-way partition for duplicates.

```go
func sortArray(nums []int) []int {
    quickSort3Way(nums, 0, len(nums)-1)
    return nums
}

func quickSort3Way(a []int, lo, hi int) {
    if lo >= hi {
        return
    }
    // Random pivot to avoid worst case
    r := lo + rand.Intn(hi-lo+1)
    a[lo], a[r] = a[r], a[lo]

    pivot := a[lo]
    lt, gt := lo, hi
    i := lo + 1

    for i <= gt {
        if a[i] < pivot {
            a[lt], a[i] = a[i], a[lt]
            lt++; i++
        } else if a[i] > pivot {
            a[gt], a[i] = a[i], a[gt]
            gt--
        } else {
            i++
        }
    }

    quickSort3Way(a, lo, lt-1)
    quickSort3Way(a, gt+1, hi)
}
```

**Complexity:** $O(n \log n)$ average, $O(n^2)$ worst (but extremely unlikely with random pivot).

---

### 8.2 [Medium] Kth Largest Element in an Array — LeetCode #215

> [leetcode.com/problems/kth-largest-element-in-an-array](https://leetcode.com/problems/kth-largest-element-in-an-array/)

**Problem:** Find the $k$-th largest element in an unsorted array.

**Connection:** This is the classic **QuickSelect** problem. The $k$-th largest element is the $(n-k)$-th smallest, so we use QuickSelect with target index $n - k$.

```go
func findKthLargest(nums []int, k int) int {
    target := len(nums) - k
    return quickSelect(nums, 0, len(nums)-1, target)
}

func quickSelect(a []int, lo, hi, k int) int {
    if lo == hi {
        return a[lo]
    }
    // Random pivot
    r := lo + rand.Intn(hi-lo+1)
    a[hi], a[r] = a[r], a[hi]

    pivot := a[hi]
    i := lo
    for j := lo; j < hi; j++ {
        if a[j] <= pivot {
            a[i], a[j] = a[j], a[i]
            i++
        }
    }
    a[i], a[hi] = a[hi], a[i]

    if k == i {
        return a[i]
    } else if k < i {
        return quickSelect(a, lo, i-1, k)
    }
    return quickSelect(a, i+1, hi, k)
}
```

**Complexity:** $O(n)$ average, $O(n^2)$ worst.

---

### 8.3 [Medium] Top K Frequent Elements — LeetCode #347

> [leetcode.com/problems/top-k-frequent-elements](https://leetcode.com/problems/top-k-frequent-elements/)

**Problem:** Given an integer array `nums` and integer $k$, return the $k$ most frequent elements.

**Connection:** Count frequencies with a hash map, then use **QuickSelect** to find the top $k$ by frequency — $O(n)$ average instead of $O(n \log n)$ with full sorting.

```go
func topKFrequent(nums []int, k int) []int {
    freq := map[int]int{}
    for _, v := range nums {
        freq[v]++
    }

    // Convert to slice of unique elements
    unique := make([]int, 0, len(freq))
    for v := range freq {
        unique = append(unique, v)
    }

    // QuickSelect to find the k-th most frequent
    n := len(unique)
    target := n - k // we want elements with the k highest frequencies

    var qs func(lo, hi int)
    qs = func(lo, hi int) {
        if lo >= hi {
            return
        }
        r := lo + rand.Intn(hi-lo+1)
        unique[hi], unique[r] = unique[r], unique[hi]

        pivotFreq := freq[unique[hi]]
        i := lo
        for j := lo; j < hi; j++ {
            if freq[unique[j]] <= pivotFreq {
                unique[i], unique[j] = unique[j], unique[i]
                i++
            }
        }
        unique[i], unique[hi] = unique[hi], unique[i]

        if i == target {
            return
        } else if target < i {
            qs(lo, i-1)
        } else {
            qs(i+1, hi)
        }
    }

    qs(0, n-1)
    return unique[target:]
}
```

**Complexity:** $O(n)$ average for the entire solution.

---

### 8.4 [Hard] Kth Smallest Element in a Sorted Matrix — LeetCode #378

> [leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/)

**Problem:** Given an $n \times n$ matrix where each row and column is sorted in ascending order, return the $k$-th smallest element.

**Connection to partitioning:** While QuickSelect works on 1D arrays, this problem extends the concept using **binary search on value space** — a partition-like technique. We binary search on the answer, using the matrix structure to count elements $\le$ mid efficiently.

```go
func kthSmallest(matrix [][]int, k int) int {
    n := len(matrix)
    lo, hi := matrix[0][0], matrix[n-1][n-1]

    for lo < hi {
        mid := lo + (hi-lo)/2
        count := countLessOrEqual(matrix, mid, n)
        if count < k {
            lo = mid + 1
        } else {
            hi = mid
        }
    }
    return lo
}

func countLessOrEqual(matrix [][]int, target, n int) int {
    count := 0
    row, col := n-1, 0 // start from bottom-left corner
    for row >= 0 && col < n {
        if matrix[row][col] <= target {
            count += row + 1 // all elements above in this column
            col++
        } else {
            row--
        }
    }
    return count
}
```

**Complexity:** $O(n \log(\text{max} - \text{min}))$ — each binary search step does an $O(n)$ staircase scan.

---

## 9. Final Thoughts

1. **Quick Sort owns the benchmark.** It processes in-place. It respects CPU caches. That physical alignment makes it $2-3\times$ faster than Merge Sort, even when it runs more raw comparisons.
2. **The partition drives the engine.** Lomuto reads clearly. Hoare runs clean with fewer swaps. The three-way split blocks duplicates from crashing the system.
3. **Pivots matter.** Grabbing a random point or calculating the median-of-three mathematically deletes the $O(n^2)$ threat. Wrap it in Introsort and you lock down the worst case permanently.
4. **QuickSelect changes the game.** You drop $2T(n/2) + O(n)$ to a straight $T(n/2) + O(n)$. Ignoring half the board guarantees $O(n)$ speed.
5. **The concept scales.** You partition by value to find the $k$-th element, sort the Dutch National Flag, or run binary searches on matrices. 
6. **Instability is a valid trade-off.** Quick Sort rips elements out of order. If you need stability, you pay for it with Merge Sort or Timsort space overhead. If you just need raw speed, Quick Sort wins.
