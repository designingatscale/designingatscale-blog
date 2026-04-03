---
title: "Elementary Sorting Algorithms"
date: "2026-02-26"
author: "An Thanh Phan"
excerpt: "An analysis of the four foundational O(n²) sorting algorithms: Bubble Sort, Selection Sort, Insertion Sort, and Cocktail Shaker Sort. Contains inversion logic, exact operation counts, traces, visualizations, and Go implementations."
tags: ["algorithms", "sorting", "complexity-analysis", "arrays"]
topic: "Data Structures and Algorithms"
featured: false
series:
  name: "Sorting Algorithms"
  order: 1
---

## 1. Introduction

Sorting an array $A[0..n-1]$ means rearranging its elements so that $A[0] \le A[1] \le \cdots \le A[n-1]$.

The simplest algorithms do this in $O(n^2)$ time. While slow, they map directly to fundamental concepts. Each one approaches the problem differently.

**Example array used throughout this post:**

| Index | 0 | 1 | 2 | 3 | 4 |
|-------|---|---|---|---|---|
| **Value** | 5 | 3 | 8 | 1 | 2 |

### 1.1 Key Concepts

| Concept | Meaning |
|---------|---------|
| **Inversion** | A pair $(i,j)$ with $i < j$ and $A[i] > A[j]$. A measure of array disorder. |
| **Stable** | Equal elements keep their original relative order. |
| **Adaptive** | Runs faster on partially sorted input. |
| **In-place** | Uses $O(1)$ extra memory. |

### 1.2 The Inversion Lower Bound

An inversion $(i,j)$ indicates $A[i]$ and $A[j]$ sit in the wrong relative order. Sorting means removing all inversions.

- Sorted array: $\text{Inv} = 0$
- Reverse-sorted array: $\text{Inv} = \binom{n}{2} = \frac{n(n-1)}{2}$

> **Theorem:** Any comparison-based algorithm that removes at most **one inversion per comparison** requires $\Omega(n^2)$ comparisons in the worst case. Bubble, Selection, and Insertion Sort all hit this bound.
---

## 2. Bubble Sort

### 2.1 Core Idea

Scan the array left to right. Compare adjacent pairs. Swap them if $A[j] > A[j+1]$. This action **bubbles** the largest unsorted element to the far right.

After pass $i$, the last $i+1$ elements sit in their final sorted spots. The unsorted section shrinks by one.

**Why it works:** Swapping an adjacent, out-of-order pair removes exactly **one** inversion. It generates zero new inversions. An array holds at most $\frac{n(n-1)}{2}$ inversions, placing a strict upper limit on the total number of swaps.

### 2.2 Implementation

```go
func bubbleSort(a []int) {
    n := len(a)
    for i := 0; i < n-1; i++ {
        swapped := false
        for j := 0; j < n-1-i; j++ {
            if a[j] > a[j+1] {
                a[j], a[j+1] = a[j+1], a[j]
                swapped = true
            }
        }
        if !swapped {
            break // array is already sorted
        }
    }
}
```

**Implementation Details:**

- **`for i := 0; i < n-1; i++`** — Outer loop. Caps the passes at $n-1$. Pass $i$ locks the element at index $n-1-i$.
- **`for j := 0; j < n-1-i; j++`** — Inner loop. Scans only the unsorted prefix. The `-i` prevents re-checking solved elements.
- **`swapped` flag** — Tracks if a pass made zero swaps. If so, the array is sorted. This cut-off logic reduces the best-case time to $O(n)$, making the algorithm **adaptive**.
- **`a[j] > a[j+1]`** — Strict inequality prevents swapping equal elements. The sort remains **stable**.

### 2.3 Step-by-Step Trace

**Input:** $[5, 3, 8, 1, 2]$

**Pass 1** (compare indices $0$ to $3$):

| Compare | Action | Array |
|---------|--------|-------|
| $A[0]=5 > A[1]=3$? Yes | Swap | $[\mathbf{3, 5}, 8, 1, 2]$ |
| $A[1]=5 > A[2]=8$? No | — | $[3, 5, 8, 1, 2]$ |
| $A[2]=8 > A[3]=1$? Yes | Swap | $[3, 5, \mathbf{1, 8}, 2]$ |
| $A[3]=8 > A[4]=2$? Yes | Swap | $[3, 5, 1, \mathbf{2, 8}]$ |

→ $8$ is in its final position. 4 comparisons, 3 swaps.

**Pass 2** (compare indices $0$ to $2$):

| Compare | Action | Array |
|---------|--------|-------|
| $A[0]=3 > A[1]=5$? No | — | $[3, 5, 1, 2, 8]$ |
| $A[1]=5 > A[2]=1$? Yes | Swap | $[3, \mathbf{1, 5}, 2, 8]$ |
| $A[2]=5 > A[3]=2$? Yes | Swap | $[3, 1, \mathbf{2, 5}, 8]$ |

→ $5$ is in final position. 3 comparisons, 2 swaps.

**Pass 3** (compare indices $0$ to $1$):

| Compare | Action | Array |
|---------|--------|-------|
| $A[0]=3 > A[1]=1$? Yes | Swap | $[\mathbf{1, 3}, 2, 5, 8]$ |
| $A[1]=3 > A[2]=2$? Yes | Swap | $[1, \mathbf{2, 3}, 5, 8]$ |

→ $3$ is in final position. 2 comparisons, 2 swaps.

**Pass 4** (compare index $0$):

| Compare | Action | Array |
|---------|--------|-------|
| $A[0]=1 > A[1]=2$? No | — | $[1, 2, 3, 5, 8]$ |

→ No swaps → `swapped = false` → **stop early**. 1 comparison, 0 swaps.

**Total:** 10 comparisons, 7 swaps.

### 2.4 Complexity Analysis

**Comparisons** in pass $i$ (0-indexed): inner loop runs $n-1-i$ times.

$$C(n) = \sum_{i=0}^{n-2}(n-1-i) = (n-1) + (n-2) + \cdots + 1 = \frac{n(n-1)}{2}$$

**Swaps** — each swap removes exactly one inversion:

| Case | Inversions | Swaps | Comparisons |
|------|-----------|-------|-------------|
| **Best** (sorted) | $0$ | $0$ | $n - 1$ (with `swapped` flag) |
| **Worst** (reversed) | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{2}$ |
| **Average** | $\frac{n(n-1)}{4}$ | $\frac{n(n-1)}{4}$ | $\frac{n(n-1)}{2}$ |

> **Note:** The swap count in Bubble Sort directly equals the starting inversion count. Each adjacent swap fixes one inversion. It never creates new ones.

| Property | Value |
|----------|-------|
| **Time** | Best $O(n)$, Worst/Average $O(n^2)$ |
| **Space** | $O(1)$ |
| **Stable** | ✓ (equal elements never swap) |
| **Adaptive** | ✓ (with `swapped` optimization) |

### 2.5 Interactive Visualization

```sorting-visualizer
algorithm: bubble-sort
array: 5,3,8,1,2,7,4,6
```

---

## 3. Selection Sort

### 3.1 Core Idea

Split the array into a **sorted prefix** and an **unsorted suffix**. During each pass, find the **minimum** value on the right and **swap** it to the end of the left section.

Bubble Sort shifts elements one spot at a time. Selection Sort jumps an element directly to its final position with one swap.

**Why it works:** Pass $i$ locks the $i+1$ smallest elements into $A[0..i]$. At pass $n-1$, sorting concludes.

### 3.2 Implementation

```go
func selectionSort(a []int) {
    n := len(a)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if a[j] < a[minIdx] {
                minIdx = j
            }
        }
        if minIdx != i {
            a[i], a[minIdx] = a[minIdx], a[i]
        }
    }
}
```

**Implementation Details:**

- **`minIdx := i`** — Sets a baseline minimum. Scans the rest of the array to find the true minimum.
- **`if a[j] < a[minIdx]`** — Keeps the first occurrence of duplicates. However, the subsequent swap step still breaks stability in most array configurations.
- **`if minIdx != i`** — Prevents swapping an element with itself. This skips a pointless memory write.
- **No early exits** — Selection Sort scans the entire unsorted suffix every time. It always runs $\frac{n(n-1)}{2}$ comparisons. It is never adaptive.

### 3.3 Step-by-Step Trace

**Input:** $[5, 3, 8, 1, 2]$

**Pass $i=0$:** Find min in $A[0..4]$

Scan: $5, 3, 8, \underline{1}, 2$ → min is $A[3]=1$. Swap $A[0] \leftrightarrow A[3]$:

$$[5, 3, 8, 1, 2] \rightarrow [\mathbf{1}, 3, 8, \mathbf{5}, 2]$$

**Pass $i=1$:** Find min in $A[1..4]$

Scan: $3, 8, 5, \underline{2}$ → min is $A[4]=2$. Swap $A[1] \leftrightarrow A[4]$:

$$[1, 3, 8, 5, 2] \rightarrow [1, \mathbf{2}, 8, 5, \mathbf{3}]$$

**Pass $i=2$:** Find min in $A[2..4]$

Scan: $8, 5, \underline{3}$ → min is $A[4]=3$. Swap $A[2] \leftrightarrow A[4]$:

$$[1, 2, 8, 5, 3] \rightarrow [1, 2, \mathbf{3}, 5, \mathbf{8}]$$

**Pass $i=3$:** Find min in $A[3..4]$

Scan: $\underline{5}, 8$ → min is $A[3]=5$. No swap needed ($\text{minIdx} = i$).

$$[1, 2, 3, \mathbf{5}, 8]$$

**Total:** 10 comparisons, 3 swaps.

### 3.4 Complexity Analysis

**Comparisons** are always the same — every pass scans the entire unsorted suffix:

$$C(n) = \sum_{i=0}^{n-2}(n-1-i) = \frac{n(n-1)}{2}$$

**Swaps** — at most one swap per pass, regardless of input:

| Case | Comparisons | Swaps |
|------|------------|-------|
| **Best** | $\frac{n(n-1)}{2}$ | $0$ (already sorted) |
| **Worst** | $\frac{n(n-1)}{2}$ | $n - 1$ |
| **Average** | $\frac{n(n-1)}{2}$ | $O(n)$ |

> **Note:** Selection Sort executes at most $n-1$ swaps. It fits well in environments that charge a premium for memory writes (Flash memory, EEPROM). Fast or slow sorting, the algorithm will always cost $\frac{n(n-1)}{2}$ comparisons.

### 3.5 Stability Issue

Selection Sort is **NOT stable**. Consider $[3_a, 3_b, 1]$:

- Pass 0: Swap $A[0]=3_a$ with $A[2]=1$ → $[1, 3_b, 3_a]$
- Now $3_b$ appears before $3_a$ — their original order is reversed!

> A long-range swap throws $3_a$ past $3_b$. This destroys the original relative order. Bubble and Insertion Sort avoid this because they only move adjacent elements.

| Property | Value |
|----------|-------|
| **Time** | Best/Worst/Average $O(n^2)$ |
| **Space** | $O(1)$ |
| **Stable** | ✗ |
| **Adaptive** | ✗ |

### 3.6 Interactive Visualization

```sorting-visualizer
algorithm: selection-sort
array: 5,3,8,1,2,7,4,6
```

---

## 4. Insertion Sort

### 4.1 Core Idea

Grow a sorted prefix element by element. Take the **key** (the next element in line). Shift larger elements in the sorted prefix to the right. Insert the key into the resulting gap.

It works exactly like organizing a hand of playing cards. You keep the left side sorted and slot in incoming cards one by one.

**Why it works:** Step $i$ sorts the prefix $A[0..i]$. By maintaining this invariant through loop completion, the entire array orders itself.

### 4.2 Implementation

```go
func insertionSort(a []int) {
    n := len(a)
    for i := 1; i < n; i++ {
        key := a[i]
        j := i - 1
        for j >= 0 && a[j] > key {
            a[j+1] = a[j] // shift right
            j--
        }
        a[j+1] = key // insert
    }
}
```

**Implementation Details:**

- **`for i := 1; i < n; i++`** — Begins at index 1. Index 0 starts as a trivially sorted array of length one.
- **`key := a[i]`** — Caches the target value. Shifting will overwrite `a[i]`.
- **`for j >= 0 && a[j] > key`** — Scans backward. Shifts larger items right. The strict `>` ensures equal elements do not cross paths, keeping the sort stable.
- **`a[j+1] = a[j]`** — Shifts cost 1 assignment. Swaps cost 3. This mathematical fact makes shifts significantly cheaper than Bubble Sort swaps.
- **`a[j+1] = key`** — Drops the cached key into the open slot.

### 4.3 Step-by-Step Trace

**Input:** $[5, 3, 8, 1, 2]$

**$i=1$, key $= 3$:** Insert into sorted prefix $[5]$

- $A[0]=5 > 3$? Yes → shift: $[5, \mathbf{5}, 8, 1, 2]$
- Insert key at position 0: $[\mathbf{3}, 5, 8, 1, 2]$

Sorted prefix: $[3, 5]$. 1 comparison, 1 shift.

**$i=2$, key $= 8$:** Insert into sorted prefix $[3, 5]$

- $A[1]=5 > 8$? No → stop immediately
- Key stays at position 2: $[3, 5, \mathbf{8}, 1, 2]$

Sorted prefix: $[3, 5, 8]$. 1 comparison, 0 shifts.

**$i=3$, key $= 1$:** Insert into sorted prefix $[3, 5, 8]$

- $A[2]=8 > 1$? Yes → shift: $[3, 5, \_, \mathbf{8}, 2]$
- $A[1]=5 > 1$? Yes → shift: $[3, \_, \mathbf{5}, 8, 2]$
- $A[0]=3 > 1$? Yes → shift: $[\_, \mathbf{3}, 5, 8, 2]$
- Insert key at position 0: $[\mathbf{1}, 3, 5, 8, 2]$

Sorted prefix: $[1, 3, 5, 8]$. 3 comparisons, 3 shifts.

**$i=4$, key $= 2$:** Insert into sorted prefix $[1, 3, 5, 8]$

- $A[3]=8 > 2$? Yes → shift
- $A[2]=5 > 2$? Yes → shift
- $A[1]=3 > 2$? Yes → shift
- $A[0]=1 > 2$? No → stop
- Insert key at position 1: $[1, \mathbf{2}, 3, 5, 8]$

Sorted prefix: $[1, 2, 3, 5, 8]$. 4 comparisons, 3 shifts.

**Total:** 9 comparisons, 7 shifts.

### 4.4 Complexity Analysis

**Inversions and Shifts:**

Inserting $A[i]$ forces the inner loop to shift $A[j]$ right every time $A[j] > \text{key}$. Each shift systematically removes one inversion $(j, i)$. So:

$$\text{Total shifts} = \text{Inv}(A)$$

The number of comparisons is $\text{Inv}(A) + (n - 1)$ because each insertion does at least one comparison (to find the stopping point).

| Case | Inversions | Comparisons | Shifts |
|------|-----------|-------------|--------|
| **Best** (sorted) | $0$ | $n - 1$ | $0$ |
| **Worst** (reversed) | $\frac{n(n-1)}{2}$ | $\frac{n(n+1)}{2} - 1$ | $\frac{n(n-1)}{2}$ |
| **Average** | $\frac{n(n-1)}{4}$ | $\frac{n^2 + 3n - 4}{4}$ | $\frac{n(n-1)}{4}$ |

> **Insertion vs Bubble Sort:**
> 1. Both perform the same volume of fixup moves. Insertion Sort uses shifts (1 assignment). Bubble Sort uses swaps (3 assignments).
> 2. Insertion Sort utilizes sequential memory access. This plays better with modern CPU branch prediction.
> 3. Both hit $O(n)$ time on sorted arrays. Insertion Sort simply carries less setup overhead per iteration.

### 4.5 Real-World Usage

Insertion Sort sees heavy use as a fallback in **hybrid sorting** systems:

| Algorithm | Uses Insertion Sort for... |
|-----------|---------------------------|
| **Timsort** (Python, Java) | Subsequences shorter than 32–64 elements |
| **Introsort** (C++ STL) | Partitions smaller than 16 elements |
| **Go `sort.Slice`** | Partitions smaller than ~12 elements |

**Why?** For small $n$, the $O(n^2)$ vs $O(n \log n)$ difference is negligible, but Insertion Sort has:
- Lower constant factors (no recursion overhead)
- Better cache locality (sequential access)
- Best-case $O(n)$ on nearly-sorted subsequences (common after partitioning)

> **Threshold strategy:** Modern hardware runs Insertion Sort faster than Quicksort or Mergesort for $n \lesssim 20$. Standard library developers exploit this hardware quirk by dropping to Insertion Sort on short inputs.

| Property | Value |
|----------|-------|
| **Time** | Best $O(n)$, Worst/Average $O(n^2)$ |
| **Space** | $O(1)$ |
| **Stable** | ✓ (shifts preserve order of equal elements) |
| **Adaptive** | ✓ (runs in $O(n + \text{Inv})$ time) |

### 4.6 Interactive Visualization

```sorting-visualizer
algorithm: insertion-sort
array: 5,3,8,1,2,7,4,6
```

---

## 5. Cocktail Shaker Sort

### 5.1 Core Idea

Bidirectional Bubble Sort alternates sweeps: left-to-right, then right-to-left. Standard Bubble Sort struggles to push small elements left. They get stuck. Programmers call this the **turtle problem**.

Cocktail Shaker Sort solves it. It handles both "turtles" (stuck small elements) and "rabbits" (mobile large elements) efficiently.

**The mechanism:** Take an array like $[2, 3, 4, 5, 1]$. In standard Bubble Sort, the $1$ acts as a turtle. It shifts left once per full pass, dragging the sort to 4 passes. Cocktail Shaker Sort grabs the $1$ during the backward pass and drops it at index 0 immediately.

### 5.2 Implementation

```go
func cocktailShakerSort(a []int) {
    n := len(a)
    start, end := 0, n-1
    swapped := true

    for swapped {
        swapped = false

        // Forward pass: bubble largest to the right
        for i := start; i < end; i++ {
            if a[i] > a[i+1] {
                a[i], a[i+1] = a[i+1], a[i]
                swapped = true
            }
        }
        end--

        if !swapped {
            break
        }
        swapped = false

        // Backward pass: bubble smallest to the left
        for i := end; i > start; i-- {
            if a[i] < a[i-1] {
                a[i], a[i-1] = a[i-1], a[i]
                swapped = true
            }
        }
        start++
    }
}
```

**Key details:**

- **Shrinking window:** `start` ticks up. `end` ticks down. The algorithm ignores the settled outer edges.
- **Early Exits:** The forward sweep might catch a sorted state. It stops right there. The algorithm applies Bubble Sort's short-circuit optimization across both directions.
- **Stability:** Neighboring elements swap cleanly. Equal items do not swap.

### 5.3 Step-by-Step Trace

**Input:** $[5, 3, 8, 1, 2]$

**Round 1 — Forward pass** ($\rightarrow$, indices 0 to 3):

| Compare | Action | Array |
|---------|--------|-------|
| $5 > 3$? Yes | Swap | $[\mathbf{3, 5}, 8, 1, 2]$ |
| $5 > 8$? No | — | $[3, 5, 8, 1, 2]$ |
| $8 > 1$? Yes | Swap | $[3, 5, \mathbf{1, 8}, 2]$ |
| $8 > 2$? Yes | Swap | $[3, 5, 1, \mathbf{2, 8}]$ |

→ $8$ settled. `end = 3`. 4 comparisons, 3 swaps.

**Round 1 — Backward pass** ($\leftarrow$, indices 3 down to 1):

| Compare | Action | Array |
|---------|--------|-------|
| $A[2]=1 < A[3]=2$? No | — | $[3, 5, 1, 2, 8]$ |
| $A[1]=5 > A[2]=1$? Yes | Swap | $[3, \mathbf{1, 5}, 2, 8]$ |
| $A[0]=3 > A[1]=1$? Yes | Swap | $[\mathbf{1, 3}, 5, 2, 8]$ |

→ $1$ settled. `start = 1`. 3 comparisons, 2 swaps.

**Round 2 — Forward pass** ($\rightarrow$, indices 1 to 2):

| Compare | Action | Array |
|---------|--------|-------|
| $3 > 5$? No | — | $[1, 3, 5, 2, 8]$ |
| $5 > 2$? Yes | Swap | $[1, 3, \mathbf{2, 5}, 8]$ |

→ `end = 2`. 2 comparisons, 1 swap.

**Round 2 — Backward pass** ($\leftarrow$, indices 2 down to 2):

| Compare | Action | Array |
|---------|--------|-------|
| $A[1]=3 > A[2]=2$? Yes | Swap | $[1, \mathbf{2, 3}, 5, 8]$ |

→ `start = 2`. 1 comparison, 1 swap.

**Round 3 — Forward pass** ($\rightarrow$, indices 2 to 1): window empty → no swaps → done.

**Final:** $[1, 2, 3, 5, 8]$ — **10 comparisons, 7 swaps**.

### 5.4 Complexity Analysis

| Case | Comparisons | Swaps |
|------|------------|-------|
| **Best** (sorted) | $n - 1$ | $0$ |
| **Worst** (reversed) | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{2}$ |
| **Average** | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{4}$ |

> **Versus Bubble Sort:** Both have the same asymptotic complexity. The advantage is practical: Cocktail Shaker Sort handles "turtles" better, reducing the number of **passes** needed. On $[2,3,4,5,6,7,8,9,10,1]$, Bubble Sort needs 9 passes while Cocktail Shaker Sort needs only 2 rounds (4 passes).

| Property | Value |
|----------|-------|
| **Time** | Best $O(n)$, Worst/Average $O(n^2)$ |
| **Space** | $O(1)$ |
| **Stable** | ✓ |
| **Adaptive** | ✓ |

### 5.5 Interactive Visualization

```sorting-visualizer
algorithm: cocktail-shaker-sort
array: 5,3,8,1,2,7,4,6
```

---

## 6. Comparison

### 6.1 Complexity Summary

| Algorithm | Best | Worst | Avg | Comparisons (worst) | Swaps/Shifts (worst) | Stable | Adaptive |
|-----------|------|-------|-----|---------------------|---------------------|--------|----------|
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{2}$ swaps | ✓ | ✓ |
| **Selection Sort** | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $\frac{n(n-1)}{2}$ | $n-1$ swaps | ✗ | ✗ |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $\frac{n(n+1)}{2} - 1$ | $\frac{n(n-1)}{2}$ shifts | ✓ | ✓ |
| **Cocktail Shaker** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $\frac{n(n-1)}{2}$ | $\frac{n(n-1)}{2}$ swaps | ✓ | ✓ |

### 6.2 When to Use Which

| Scenario | Best Choice | Why |
|----------|-------------|-----|
| Small arrays ($n < 20$) | **Insertion Sort** | Lowest constant factor, used by production sort libraries |
| Nearly sorted data | **Insertion Sort** | $O(n + \text{Inv})$ — near-linear for few inversions |
| Minimize writes | **Selection Sort** | At most $n-1$ swaps total |
| Turtles in the data | **Cocktail Shaker** | Bidirectional sweeps handle elements far from position |
| Stability required | **Insertion Sort** | Stable + adaptive + practical |
| Teaching fundamentals | **Bubble Sort** | Simplest to understand and analyze |

---

## 7. Practice Problems

### 7.1 Count Inversions

> [leetcode.com/problems/count-of-smaller-numbers-after-self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) (related)

**Problem:** Given an array $A[0..n-1]$, count the total number of inversions — pairs $(i,j)$ where $i < j$ and $A[i] > A[j]$.

**Example:** $A = [5, 3, 8, 1, 2]$

Inversions: $(0,1), (0,3), (0,4), (1,3), (1,4), (2,3), (2,4)$ → **7 inversions**.

> This directly connects to our analysis: Bubble Sort on this array required exactly 7 swaps, and Insertion Sort required exactly 7 shifts.

**Solution — $O(n^2)$:**

```go
func countInversions(a []int) int {
    n := len(a)
    count := 0
    for i := 0; i < n; i++ {
        for j := i + 1; j < n; j++ {
            if a[i] > a[j] {
                count++
            }
        }
    }
    return count
}
```

**Follow-up:** Can you solve this in $O(n \log n)$? *(Hint: modify Merge Sort to count inversions during the merge step — each time an element from the right half is placed before elements from the left half, it contributes `len(left) - i` inversions at once.)*

---

### 7.2 Sort with Minimum Swaps

**Problem:** Given a permutation $A[0..n-1]$ of integers $1$ to $n$, find the minimum number of swaps (not restricted to adjacent) needed to sort it.

**Example:** $A = [4, 3, 1, 2]$

- Swap $A[0]=4$ with $A[3]=2$: $[2, 3, 1, 4]$
- Swap $A[0]=2$ with $A[2]=1$: $[1, 3, 2, 4]$
- Swap $A[1]=3$ with $A[2]=2$: $[1, 2, 3, 4]$

Minimum swaps = **3**.

> Unlike Bubble Sort (which only swaps adjacent elements), arbitrary swaps can fix multiple inversions at once. The answer is related to **cycle decomposition** of the permutation.

**Solution — Cycle Decomposition, $O(n)$:**

Each permutation decomposes into disjoint cycles. A cycle of length $k$ requires exactly $k-1$ swaps to sort (each swap puts one element in its correct position).

$$\text{minSwaps} = n - \text{numberOfCycles}$$

For $A = [4, 3, 1, 2]$: one cycle $0 \to 3 \to 1 \to 2 \to 0$ of length 4, so $4 - 1 = 3$ swaps.

```go
func minSwapsToSort(a []int) int {
    n := len(a)
    visited := make([]bool, n)
    cycles := 0

    for i := 0; i < n; i++ {
        if visited[i] {
            continue
        }
        j := i
        for !visited[j] {
            visited[j] = true
            j = a[j] - 1 // element a[j] should be at index a[j]-1
        }
        cycles++
    }

    return n - cycles
}
```

---

### 7.3 Sort an Almost-Sorted Array

**Problem:** Given an array where each element is at most $k$ positions away from its sorted position (a **$k$-sorted** array), sort it efficiently.

**Example:** $A = [3, 1, 2, 5, 4, 7, 6, 8]$, $k = 2$

> This is exactly the scenario where Insertion Sort shines. Since each element moves at most $k$ positions during insertion, the inner loop runs at most $k$ times per element.

**Solution — Insertion Sort, $O(nk)$:**

```go
func sortKSorted(a []int, k int) {
    n := len(a)
    for i := 1; i < n; i++ {
        key := a[i]
        j := i - 1
        for j >= max(0, i-k) && a[j] > key {
            a[j+1] = a[j]
            j--
        }
        a[j+1] = key
    }
}
```

**Analysis:**
- The inner loop runs at most $\min(k, i)$ times for each $i$
- Total comparisons: $\sum_{i=1}^{n-1} \min(k, i) \le nk$
- **Time complexity:** $O(nk)$

When $k$ is a constant (e.g., $k = 5$), this runs in $O(n)$ — **linear time**!

> **Follow-up:** For large $k$, you can solve this in $O(n \log k)$ using a min-heap of size $k+1$: maintain a sliding window of $k+1$ elements, always extract the minimum and place it.

---

## 8. Final Thoughts

1. **Inversions dictate the workload.** Bubble Sort and Insertion Sort execute exactly $\text{Inv}(A)$ fixup moves. The mechanical difference lies in shift vs swap overhead.
2. **Operations have varying costs.** Selection Sort avoids memory writes by spending CPU cycles on comparisons. It trades off $O(n^2)$ scans to limit swaps to $O(n)$.
3. **Hardware dictates winning algorithms.** Insertion Sort limits branching logic, plays well with CPU caching, and runs fast on small sets. Production standard libraries rely on it.
4. **Data shape matters.** Algorithms suffer on edge-case data. Cocktail Shaker Sort exists solely to fix the asymmetry of Bubble Sort's edge-case "turtles". 
5. **Worst cases do not define typical behavior.** Most basic sorts detect presorted data and quit in $O(n)$ time. Selection Sort remains the rigid exception.
6. **Efficiency requires structural leaps.** Hitting the $O(n \log n)$ threshold requires abandoning strict adjacent comparisons. That shifts the focus to divide-and-conquer systems like Merge Sort and Quicksort.
