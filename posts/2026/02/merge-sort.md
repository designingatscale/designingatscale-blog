---
title: "Merge Sort"
date: "2026-02-27"
author: "An Thanh Phan"
excerpt: "An analysis of Merge Sort. Covers the divide-and-conquer strategy, the merge procedure, recurrence analysis, the Master Theorem, stability, space tradeoffs, and LeetCode applications."
tags: ["algorithms", "sorting", "divide-and-conquer", "complexity-analysis"]
topic: "Data Structures and Algorithms"
featured: false
series:
  name: "Sorting Algorithms"
  order: 2
---

## 1. Introduction

The [previous post](/post/2026-02-elementary-sorting-algorithms) proved that removing at most **one inversion per comparison** forces an algorithm into $\Omega(n^2)$ bounds. Merge Sort shatters that limit. It removes **multiple inversions per comparison** using divide-and-conquer logic.

> **History:** John von Neumann invented Merge Sort in 1945 for the EDVAC, one of the earliest stored-program computers.

### 1.1 The $\Omega(n \log n)$ Lower Bound

**Claim:** No comparison-based sorting algorithm can sort all inputs of size $n$ using fewer than $\Omega(n \log n)$ comparisons.

**Proof sketch:** Model the algorithm as a **decision tree** — a binary tree where each internal node is a comparison "$A[i] \le A[j]$?", and each leaf is a specific permutation (the sorted order).

- The algorithm must distinguish between all $n!$ possible input permutations
- Each comparison has 2 outcomes (yes/no), so a tree of height $h$ has at most $2^h$ leaves
- We need $2^h \ge n!$, so $h \ge \log_2(n!)$
- By **Stirling's approximation**: $\log_2(n!) = n\log_2 n - n\log_2 e + O(\log n) = \Theta(n \log n)$

> **Merge Sort achieves this bound exactly — it is asymptotically optimal.** No comparison sort can ever beat $O(n \log n)$.

---

## 2. Core Idea

### 2.1 Divide and Conquer

Merge Sort relies heavily on the **divide-and-conquer** pattern. You will see this mechanism everywhere in computer science (binary search, quicksort, FFT, Strassen's matrix multiplication):

| Phase | What happens | Cost |
|-------|-------------|------|
| **Divide** | Split $A[0..n-1]$ into $A[0..m-1]$ and $A[m..n-1]$ where $m = \lfloor n/2 \rfloor$ | $O(1)$ |
| **Conquer** | Recursively sort each half | $2T(n/2)$ |
| **Combine** | Merge the two sorted halves into one sorted array | $O(n)$ |

The core mechanic: **merging two sorted arrays is cheap**. A basic two-pointer technique finishes the job in $O(n)$ time by constantly grabbing the smaller of the two front elements. The algorithm kicks the expensive sorting work down to smaller and smaller subproblems. It only stops when it hits a base case of size 1.

### 2.2 The Math Behind Halving

Splitting the array straight down the middle builds a **balanced** recursion tree. It hits a absolute depth of $\log_2 n$. At each level, the total merge work caps out at $O(n)$:

$$\underbrace{O(\log n)}_{\text{levels}} \times \underbrace{O(n)}_{\text{merge work per level}} = O(n \log n)$$

**What if we split unevenly?** Suppose we split into sizes $1$ and $n-1$:
- Level 0: merge $n$ elements
- Level 1: merge $n-1$ elements
- ...
- Level $n-1$: merge $1$ element

Total: $(n) + (n-1) + \cdots + 1 = \frac{n(n-1)}{2} = O(n^2)$ — no better than Insertion Sort! **Balanced division is critical.**

---

## 3. Implementation

### 3.1 The Merge Procedure — Heart of the Algorithm

Before looking at the full sort, let's understand the merge procedure in detail. Given two **sorted** arrays, produce one sorted array containing all elements:

```go
func merge(left, right []int) []int {
    result := make([]int, 0, len(left)+len(right))
    i, j := 0, 0

    // Two-pointer: always pick the smaller front element
    for i < len(left) && j < len(right) {
        if left[i] <= right[j] {
            result = append(result, left[i])
            i++
        } else {
            result = append(result, right[j])
            j++
        }
    }

    // One side is exhausted — append the remaining elements
    result = append(result, left[i:]...)
    result = append(result, right[j:]...)
    return result
}
```

**Mechanism:** Both inputs arrive sorted. At any given moment, the absolute smallest unprocessed element sits at either `left[i]` or `right[j]`. You grab the smaller one. By constantly pulling the global minimum of the remaining pool, the final array builds itself in order.

**Strict inequality:** Using `<=` guarantees **stability**. When `left[i] == right[j]`, the algorithm pulls from the left half first. The left half elements started earlier in the original array. They keep that head start.

**Complexity:** Each iteration places one element into the result. With $m + n$ total elements, the loop runs at most $m + n$ times. Each iteration does $O(1)$ work (one comparison + one append). Total: $O(m + n)$.

### 3.2 Top-Down Merge Sort (Recursive)

The simplest approach maps directly to the divide-and-conquer blueprint:

```go
func mergeSort(a []int) []int {
    n := len(a)
    if n <= 1 {
        return a // base case: single element is already sorted
    }

    mid := n / 2
    left := mergeSort(a[:mid])   // sort first half
    right := mergeSort(a[mid:])  // sort second half

    return merge(left, right)    // combine
}
```

**Implementation Details:**

- **`if n <= 1`**: Base case. An array of 0 or 1 elements is trivially sorted. This terminates the recursion.
- **`mid := n / 2`**: Integer division gives us a balanced split. For odd $n$, the left half has $\lfloor n/2 \rfloor$ elements and the right half has $\lceil n/2 \rceil$.
- **`a[:mid]` and `a[mid:]`**: In Go, these create **slices** (views into the same underlying array), so the division itself is $O(1)$ — no copying.
- **`merge(left, right)`**: The returned slices are **new** sorted arrays. Each recursive call allocates a new slice.

**The flaw:** Every `merge` call triggers a new `make` allocation. Across $O(n)$ merge calls, the program burns $O(n \log n)$ total memory. The garbage collector then has to clean up the mess.

### 3.3 In-Place Buffer — Single Allocation

The fix: allocate exactly **one** auxiliary array upfront. Reuse it at every level.

```go
func mergeSortOptimized(a []int) {
    aux := make([]int, len(a)) // one allocation for the entire sort
    sort(a, aux, 0, len(a)-1)
}

func sort(a, aux []int, lo, hi int) {
    if lo >= hi {
        return
    }
    mid := lo + (hi-lo)/2 // avoids integer overflow vs (lo+hi)/2
    sort(a, aux, lo, mid)
    sort(a, aux, mid+1, hi)

    // Optimization 1: skip merge if halves are already in order
    if a[mid] <= a[mid+1] {
        return
    }

    mergeRange(a, aux, lo, mid, hi)
}

func mergeRange(a, aux []int, lo, mid, hi int) {
    // Copy the range to auxiliary array
    copy(aux[lo:hi+1], a[lo:hi+1])

    i, j := lo, mid+1
    for k := lo; k <= hi; k++ {
        if i > mid {
            // left half exhausted — take from right
            a[k] = aux[j]; j++
        } else if j > hi {
            // right half exhausted — take from left
            a[k] = aux[i]; i++
        } else if aux[i] <= aux[j] {
            // left element is smaller or equal — take from left (stable)
            a[k] = aux[i]; i++
        } else {
            // right element is smaller — take from right
            a[k] = aux[j]; j++
        }
    }
}
```

**Key improvements explained:**

**1. `lo + (hi-lo)/2` instead of `(lo+hi)/2`:**

Both compute the midpoint, but `(lo+hi)` can overflow if `lo` and `hi` are large. In Go, `int` is 64-bit so overflow is unlikely, but this habit prevents bugs in languages with 32-bit integers (Java, C). It's a best practice adopted from Joshua Bloch's famous blog post ["Nearly All Binary Searches and Mergesorts are Broken"](https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/).

**2. `if a[mid] <= a[mid+1]` — the "already sorted" optimization:**

Both halves finish sorting. You now hold `a[lo..mid]` and `a[mid+1..hi]`. If the largest number on the left (`a[mid]`) is $\le$ the smallest number on the right (`a[mid+1]`), the entire block `a[lo..hi]` is clean. Skip the merge.

- **Cost:** One extra comparison per merge call
- **Benefit:** On already-sorted input, every merge is skipped → $O(n)$ total time
- **Impact on average case:** Negligible — the comparison almost never succeeds on random data

**3. Copy to `aux`, then merge back to `a`:**

We copy `a[lo..hi]` to `aux[lo..hi]`, then write the merged result back to `a[lo..hi]`. This avoids allocating new arrays on every merge. The `aux` array is allocated once upfront and shared across all recursion levels.

**Memory comparison:**

| Version | Allocations | Total memory | GC pressure |
|---------|------------|-------------|-------------|
| Top-down (naive) | $O(n)$ allocations | $O(n \log n)$ | High |
| With shared buffer | $1$ allocation | $O(n)$ | Minimal |

### 3.4 Bottom-Up Merge Sort (Iterative)

You can reverse the engine and merge bottom-up. Treat every single element as a sorted run of size 1. Merge adjacent pairs into runs of size 2. Merge those into 4. Keep doubling.

```go
func mergeSortBottomUp(a []int) {
    n := len(a)
    aux := make([]int, n)

    // width doubles each pass: 1, 2, 4, 8, ...
    for width := 1; width < n; width *= 2 {
        // merge adjacent runs of 'width' elements
        for lo := 0; lo < n-width; lo += 2 * width {
            mid := lo + width - 1
            hi := min(lo+2*width-1, n-1) // clamp to array bounds
            mergeRange(a, aux, lo, mid, hi)
        }
    }
}
```

**How it works, step by step** for $n = 8$:

| Pass | Width | Merges performed |
|------|-------|-----------------|
| 1 | 1 | $[0] \oplus [1]$, $[2] \oplus [3]$, $[4] \oplus [5]$, $[6] \oplus [7]$ |
| 2 | 2 | $[0,1] \oplus [2,3]$, $[4,5] \oplus [6,7]$ |
| 3 | 4 | $[0,1,2,3] \oplus [4,5,6,7]$ |

**Why `lo < n-width`?** This condition ensures there exists at least one element in the right half to merge with. If `lo >= n-width`, the remaining run is already complete with no pair to merge against.

**Why `min(lo+2*width-1, n-1)`?** When `n` is not a power of 2, the last run may be shorter than `width`. Clamping `hi` to `n-1` handles this edge case.

**Advantages over top-down:**

| Aspect | Top-down | Bottom-up |
|--------|----------|-----------|
| Recursion stack | $O(\log n)$ | None |
| Cache locality | Random access across levels | Sequential passes |
| Code complexity | Simpler logic | Trickier index math |
| External sorting | Not suitable | **Essential** — processes data in sequential passes |

### 3.5 Optimization: Cutoff to Insertion Sort

Every production Merge Sort switches to **Insertion Sort** for small subarrays:

```go
const CUTOFF = 16 // typical: 7-32

func sort(a, aux []int, lo, hi int) {
    if hi-lo < CUTOFF {
        insertionSort(a, lo, hi) // no recursion, no allocation
        return
    }
    mid := lo + (hi-lo)/2
    sort(a, aux, lo, mid)
    sort(a, aux, mid+1, hi)
    if a[mid] <= a[mid+1] {
        return
    }
    mergeRange(a, aux, lo, mid, hi)
}

func insertionSort(a []int, lo, hi int) {
    for i := lo + 1; i <= hi; i++ {
        key := a[i]
        j := i - 1
        for j >= lo && a[j] > key {
            a[j+1] = a[j]
            j--
        }
        a[j+1] = key
    }
}
```

**The tactical advantage:**

1. **It kills recursion drag:** A pure Merge Sort bottoms out at $n=1$, generating massive function call overhead. Implementing a cutoff at 16 deletes millions of tiny recursive calls on large data sets.
2. **Insertion Sort wins sprints:** For $n \le 16$, the $O(n^2)$ penalty vanishes. Insertion Sort uses zero allocations, relies on sequential array access, and plays nicely with CPU branch prediction. It runs faster in the real world on small blocks.
3. **Industry standard:** Timsort (Python, Java, Swift, Rust) relies on a `minrun = 32-64`. Go's `sort.Slice` uses a cutoff around 12. C++ STL's `stable_sort` hovers near 15.

### 3.6 Interactive Visualization

```sorting-visualizer
algorithm: merge-sort
array: 38,27,43,3,9,82,10,15
```

---

## 4. Step-by-Step Trace

**Input:** $[38, 27, 43, 3, 9, 82, 10, 15]$

### 4.1 Recursion Tree

```
                [38, 27, 43, 3, 9, 82, 10, 15]
               /                                \
        [38, 27, 43, 3]                  [9, 82, 10, 15]
       /              \                 /               \
    [38, 27]        [43, 3]         [9, 82]          [10, 15]
   /       \       /      \        /      \          /       \
 [38]     [27]   [43]    [3]     [9]     [82]      [10]     [15]
```

Depth = $\log_2 8 = 3$ levels. The recursion goes down first (divide), then comes back up (merge).

### 4.2 Merge Phase

**Level 1 — Merge singletons** (4 merges, 1 comparison each):

| Merge | Left | Right | Compare | Result |
|-------|------|-------|---------|--------|
| 1 | $[38]$ | $[27]$ | $38 > 27$ → pick $27$ | $[27, 38]$ |
| 2 | $[43]$ | $[3]$ | $43 > 3$ → pick $3$ | $[3, 43]$ |
| 3 | $[9]$ | $[82]$ | $9 \le 82$ → pick $9$ | $[9, 82]$ |
| 4 | $[10]$ | $[15]$ | $10 \le 15$ → pick $10$ | $[10, 15]$ |

Subtotal: **4 comparisons**.

**Level 2 — Merge pairs** (2 merges):

**$[27, 38]$ ⊕ $[3, 43]$:**

| Step | Left ptr | Right ptr | Compare | Pick | Result |
|------|---------|----------|---------|------|--------|
| 1 | $27$ | $3$ | $27 > 3$ | $3$ (right) | $[3]$ |
| 2 | $27$ | $43$ | $27 \le 43$ | $27$ (left) | $[3, 27]$ |
| 3 | $38$ | $43$ | $38 \le 43$ | $38$ (left) | $[3, 27, 38]$ |
| 4 | — | $43$ | left exhausted | $43$ | $[3, 27, 38, 43]$ |

3 comparisons.

**$[9, 82]$ ⊕ $[10, 15]$:**

| Step | Left ptr | Right ptr | Compare | Pick | Result |
|------|---------|----------|---------|------|--------|
| 1 | $9$ | $10$ | $9 \le 10$ | $9$ | $[9]$ |
| 2 | $82$ | $10$ | $82 > 10$ | $10$ | $[9, 10]$ |
| 3 | $82$ | $15$ | $82 > 15$ | $15$ | $[9, 10, 15]$ |
| 4 | $82$ | — | right exhausted | $82$ | $[9, 10, 15, 82]$ |

3 comparisons. Subtotal: **6 comparisons**.

**Level 3 — Final merge:**

**$[3, 27, 38, 43]$ ⊕ $[9, 10, 15, 82]$:**

| Step | Left | Right | Compare | Pick | Result |
|------|------|-------|---------|------|--------|
| 1 | $3$ | $9$ | $3 \le 9$ | $3$ | $[3]$ |
| 2 | $27$ | $9$ | $27 > 9$ | $9$ | $[3, 9]$ |
| 3 | $27$ | $10$ | $27 > 10$ | $10$ | $[3, 9, 10]$ |
| 4 | $27$ | $15$ | $27 > 15$ | $15$ | $[3, 9, 10, 15]$ |
| 5 | $27$ | $82$ | $27 \le 82$ | $27$ | $[3, 9, 10, 15, 27]$ |
| 6 | $38$ | $82$ | $38 \le 82$ | $38$ | $[3, 9, 10, 15, 27, 38]$ |
| 7 | $43$ | $82$ | $43 \le 82$ | $43$ | $[3, 9, 10, 15, 27, 38, 43]$ |
| — | — | $82$ | exhausted | $82$ | $[3, 9, 10, 15, 27, 38, 43, 82]$ |

Subtotal: **7 comparisons**.

**Grand total: $4 + 6 + 7 = 17$ comparisons** for $n = 8$.
Theoretical worst case: $n \log_2 n - n + 1 = 8 \times 3 - 8 + 1 = 17$ ✓

---

## 5. Complexity Analysis

### 5.1 The Recurrence

Let $T(n)$ be the running time for an array of size $n$:

$$T(n) = \underbrace{2 \cdot T(n/2)}_{\text{sort two halves}} + \underbrace{\Theta(n)}_{\text{merge cost}}, \quad T(1) = \Theta(1)$$

We solve this recurrence using three methods.

### 5.2 Method 1 — Recursion Tree

Expand the recurrence by drawing the recursion tree:

| Level $k$ | Subproblems | Size each | Merge work per subproblem | Total work at level |
|-----------|-------------|-----------|--------------------------|---------------------|
| 0 | $1$ | $n$ | $cn$ | $cn$ |
| 1 | $2$ | $n/2$ | $c \cdot n/2$ | $cn$ |
| 2 | $4$ | $n/4$ | $c \cdot n/4$ | $cn$ |
| $k$ | $2^k$ | $n/2^k$ | $c \cdot n/2^k$ | $cn$ |
| $\log_2 n$ | $n$ | $1$ | $c$ | $cn$ |

At level $k$: there are $2^k$ subproblems of size $n/2^k$, each doing $c \cdot n/2^k$ merge work. Total work at level $k$: $2^k \times c \cdot n/2^k = cn$.

**Every level does exactly $cn$ work.** The tree has $\log_2 n + 1$ levels (from size $n$ down to size $1$). Total:

$$T(n) = cn \cdot (\log_2 n + 1) = cn\log_2 n + cn = \Theta(n \log n)$$

### 5.3 Method 2 — Telescoping

Divide both sides of $T(n) = 2T(n/2) + cn$ by $n$:

$$\frac{T(n)}{n} = \frac{T(n/2)}{n/2} + c$$

Let $S(n) = T(n)/n$. Then $S(n) = S(n/2) + c$. Unrolling:

$$S(n) = S(n/2) + c = S(n/4) + 2c = \cdots = S(1) + c \cdot \log_2 n$$

So $S(n) = \Theta(\log n)$, and $T(n) = n \cdot S(n) = \Theta(n \log n)$.

### 5.4 Method 3 — The Master Theorem

The **Master Theorem** solves recurrences formatted like this:

$$T(n) = a \cdot T(n/b) + f(n)$$

Mechanics:
- $a \ge 1$: The total count of subproblems.
- $b > 1$: The factor driving the input size reduction.
- $f(n)$: The absolute cost of the work happening outside the recursion (dividing and combining).

**The critical exponent** is $\log_b a$. It charts the growth rate of the subproblems. The theorem measures $f(n)$ directly against $n^{\log_b a}$:

| Case | Condition | Logic | Result |
|------|-----------|-------|--------|
| **Case 1** | $f(n) = O(n^{\log_b a - \varepsilon})$ for some $\varepsilon > 0$ | Recursion runs heavy. Combining handles easily. | $T(n) = \Theta(n^{\log_b a})$ |
| **Case 2** | $f(n) = \Theta(n^{\log_b a} \cdot \log^k n)$ for $k \ge 0$ | Work splits evenly between the recursion depth and the combine phase. | $T(n) = \Theta(n^{\log_b a} \cdot \log^{k+1} n)$ |
| **Case 3** | $f(n) = \Omega(n^{\log_b a + \varepsilon})$ for some $\varepsilon > 0$, and $af(n/b) \le cf(n)$ for some $c < 1$ | Combining costs everything. The recursion runs fast. | $T(n) = \Theta(f(n))$ |

**Applying to Merge Sort:**

$$T(n) = 2T(n/2) + \Theta(n)$$

- $a = 2$ (two recursive calls)
- $b = 2$ (each on half the input)
- $f(n) = \Theta(n)$

Compute the critical exponent: $\log_b a = \log_2 2 = 1$.

Compare $f(n)$ with $n^{\log_b a} = n^1 = n$:

$f(n) = \Theta(n) = \Theta(n^1 \cdot \log^0 n)$

This matches **Case 2** with $k = 0$:

$$T(n) = \Theta(n^1 \cdot \log^{0+1} n) = \Theta(n \log n) \quad \blacksquare$$

**Other examples of the Master Theorem:**

| Recurrence | $a$ | $b$ | $\log_b a$ | $f(n)$ | Case | $T(n)$ |
|-----------|-----|-----|-----------|--------|------|--------|
| Binary Search: $T(n) = T(n/2) + O(1)$ | 1 | 2 | 0 | $O(1) = O(n^0)$ | 2 | $\Theta(\log n)$ |
| Merge Sort: $T(n) = 2T(n/2) + O(n)$ | 2 | 2 | 1 | $O(n) = O(n^1)$ | 2 | $\Theta(n \log n)$ |
| Strassen: $T(n) = 7T(n/2) + O(n^2)$ | 7 | 2 | 2.81 | $O(n^2)$, $2 < 2.81$ | 1 | $\Theta(n^{2.81})$ |
| Stooge Sort: $T(n) = 3T(2n/3) + O(1)$ | 3 | 3/2 | 2.71 | $O(1)$ | 1 | $\Theta(n^{2.71})$ |

### 5.5 Exact Comparison Counts

For $n = 2^k$ elements, the exact number of comparisons in the merge steps:

| Case | Comparisons | When it occurs |
|------|------------|------|
| **Best** | $\frac{n \log_2 n}{2}$ | One half is entirely smaller than the other at every merge (no interleaving — we exhaust one side after $n/2$ comparisons) |
| **Worst** | $n \log_2 n - n + 1$ | Elements alternate perfectly between halves at every merge (maximum interleaving — every comparison produces exactly one output element) |
| **Average** | $\approx n \log_2 n - 1.26n$ | Random permutation |

> **Key difference from Insertion Sort:** The best and worst cases differ by only a constant factor. Merge Sort is **NOT adaptive** — it does $\Theta(n \log n)$ work regardless of input order (unless we add the `a[mid] <= a[mid+1]` optimization).

### 5.6 Space Complexity

| Variant | Auxiliary Space | Notes |
|---------|----------------|-------|
| Top-down (naive) | $O(n \log n)$ total | New arrays at each recursion level |
| Top-down (shared buffer) | $O(n)$ array + $O(\log n)$ stack | **Recommended** |
| Bottom-up | $O(n)$ array only | No stack — best total space |

> **Space is Merge Sort's primary weakness** compared to Quicksort ($O(\log n)$ stack, in-place). In-place merge exists but requires $O(n \log n)$ or $O(n \log^2 n)$ time — slower and far more complex. In practice, the $O(n)$ extra space is accepted as the price for guaranteed $O(n \log n)$ and stability.

### 5.7 Property Summary

| Property | Value |
|----------|-------|
| **Time** | Best/Worst/Average $\Theta(n \log n)$ |
| **Space** | $O(n)$ auxiliary |
| **Stable** | ✓ (with `<=` in merge) |
| **Adaptive** | ✗ (always $\Theta(n \log n)$)* |
| **In-place** | ✗ |

*With the `a[mid] <= a[mid+1]` optimization, best case becomes $O(n)$.

---

## 6. Merge Sort vs Elementary Sorts

### 6.1 Asymptotic Gap

For $n = 1{,}000{,}000$:

| Algorithm | Worst-case comparisons | Ratio |
|-----------|----------------------|-------|
| Insertion Sort | $\frac{n(n-1)}{2} \approx 5 \times 10^{11}$ | 25,000× slower |
| Merge Sort | $n \log_2 n \approx 2 \times 10^{7}$ | **baseline** |

### 6.2 The Crossover Point

Despite better asymptotics, Merge Sort has higher constant factors due to:
- Function call overhead (recursion)
- Memory allocation for the auxiliary array
- Cache misses from copying between `a` and `aux`

| $n$ | Insertion Sort ($\sim n^2/4$) | Merge Sort ($\sim n \log_2 n$) | Winner |
|-----|------------------------------|-------------------------------|--------|
| 8 | 16 | 24 | Insertion |
| 16 | 64 | 64 | Tie |
| 32 | 256 | 160 | **Merge** |
| 64 | 1,024 | 384 | **Merge** |

> This is why **Timsort** (Python, Java, Swift, Rust) uses Insertion Sort for runs shorter than 32–64 elements, then merges them with Merge Sort. The hybrid approach gets the best of both worlds.

---

## 7. Practical Applications

### 7.1 [Easy] Merge Two Sorted Lists — LeetCode #21

> [leetcode.com/problems/merge-two-sorted-lists](https://leetcode.com/problems/merge-two-sorted-lists/)

**Problem:** Merge two sorted linked lists into one sorted linked list.

**Connection to Merge Sort:** This is the `merge` subroutine applied to linked lists. On linked lists, the merge needs no extra space — we just rewire pointers.

```go
func mergeTwoLists(l1, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    curr := dummy

    for l1 != nil && l2 != nil {
        if l1.Val <= l2.Val {
            curr.Next = l1
            l1 = l1.Next
        } else {
            curr.Next = l2
            l2 = l2.Next
        }
        curr = curr.Next
    }

    if l1 != nil {
        curr.Next = l1
    } else {
        curr.Next = l2
    }

    return dummy.Next
}
```

**Complexity:** $O(m + n)$ time, $O(1)$ space.

The `dummy` node avoids special-casing the head of the result list — a common linked list technique.

---

### 7.2 [Medium] Sort List — LeetCode #148

> [leetcode.com/problems/sort-list](https://leetcode.com/problems/sort-list/)

**Problem:** Sort a linked list in $O(n \log n)$ time.

**Why Merge Sort is ideal for linked lists:**
1. **Merge is free** — just pointer manipulation, no auxiliary array needed
2. **Splitting uses slow/fast pointers** — finds the midpoint in $O(n)$
3. **No random access needed** — unlike Quicksort which needs it for partitioning

```go
func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }

    // Find midpoint with slow/fast pointers
    slow, fast := head, head.Next
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    mid := slow.Next
    slow.Next = nil // cut the list in two

    left := sortList(head)
    right := sortList(mid)

    return mergeTwoLists(left, right)
}
```

**Why `fast` starts at `head.Next`:** If both start at `head`, for a 2-element list `[a, b]`, slow would end at `b` and we'd get an infinite loop (left = `[a, b]`, right = `nil`). Starting fast one ahead ensures slow stops at the last node of the first half.

**Complexity:** $O(n \log n)$ time, $O(\log n)$ stack space.

---

### 7.3 [Medium] Count of Smaller Numbers After Self — LeetCode #315

> [leetcode.com/problems/count-of-smaller-numbers-after-self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/)

**Problem:** Given `nums`, return `counts` where `counts[i]` = number of elements to the right of `nums[i]` that are smaller than `nums[i]`.

**Example:** `nums = [5, 2, 6, 1]` → `counts = [2, 1, 1, 0]`

**Connection to Merge Sort:** This is a generalized **inversion counting** problem. During the merge step, when we pick `right[j] < left[i]`, we know `right[j]` is smaller than all remaining elements in the left half. We track how many right-half elements have been placed before each left-half element.

```go
func countSmaller(nums []int) []int {
    n := len(nums)
    counts := make([]int, n)
    indices := make([]int, n) // track original positions through merges
    for i := range indices {
        indices[i] = i
    }
    aux := make([]int, n)
    auxIdx := make([]int, n)

    var msort func(lo, hi int)
    msort = func(lo, hi int) {
        if lo >= hi {
            return
        }
        mid := lo + (hi-lo)/2
        msort(lo, mid)
        msort(mid+1, hi)

        copy(aux[lo:hi+1], nums[lo:hi+1])
        copy(auxIdx[lo:hi+1], indices[lo:hi+1])

        i, j := lo, mid+1
        rightCount := 0 // how many right-half elements placed so far

        for k := lo; k <= hi; k++ {
            if i > mid {
                nums[k] = aux[j]
                indices[k] = auxIdx[j]
                j++
            } else if j > hi {
                nums[k] = aux[i]
                indices[k] = auxIdx[i]
                counts[auxIdx[i]] += rightCount
                i++
            } else if aux[i] <= aux[j] {
                nums[k] = aux[i]
                indices[k] = auxIdx[i]
                counts[auxIdx[i]] += rightCount
                i++
            } else {
                nums[k] = aux[j]
                indices[k] = auxIdx[j]
                rightCount++
                j++
            }
        }
    }

    msort(0, n-1)
    return counts
}
```

**Why `rightCount` works:** When we place `left[i]` into position `k`, all `rightCount` elements from the right half that have already been placed came from positions *after* `left[i]` in the original array and are smaller. So each of those contributes to `counts[originalIndex(left[i])]`.

**Complexity:** $O(n \log n)$ time, $O(n)$ space.

---

### 7.4 [Hard] Count of Range Sum — LeetCode #327

> [leetcode.com/problems/count-of-range-sum](https://leetcode.com/problems/count-of-range-sum/)

**Problem:** Given `nums` and integers `lower`, `upper`, count the number of range sums $S(i,j) = \sum_{k=i}^{j} nums[k]$ that satisfy $\text{lower} \le S(i,j) \le \text{upper}$.

**Example:** `nums = [-2, 5, -1]`, `lower = -2`, `upper = 2` → **3** (the ranges $[-2]$, $[-2,5,-1]$, $[-1]$).

**Key transformation:** Define prefix sums $P[0] = 0,\; P[k] = \sum_{i=0}^{k-1} nums[i]$. Then:

$$S(i,j) = P[j+1] - P[i]$$

The problem becomes: count pairs $(i,j)$ with $i < j$ and $\text{lower} \le P[j] - P[i] \le \text{upper}$.

Rearranging: for each $j$, count how many $i < j$ satisfy $P[j] - \text{upper} \le P[i] \le P[j] - \text{lower}$.

**During the merge step**, the left half and right half are each sorted. For each element $P[j]$ in the right half, the valid $P[i]$ values in the left half form a **contiguous range** (because the left half is sorted). We use two pointers to find this range in $O(1)$ amortized time.

```go
func countRangeSum(nums []int, lower, upper int) int {
    n := len(nums)
    prefix := make([]int64, n+1)
    for i, v := range nums {
        prefix[i+1] = prefix[i] + int64(v)
    }

    count := 0
    aux := make([]int64, n+1)

    var msort func(lo, hi int)
    msort = func(lo, hi int) {
        if lo >= hi {
            return
        }
        mid := lo + (hi-lo)/2
        msort(lo, mid)
        msort(mid+1, hi)

        // Count: for each j in right half, count valid i in left half
        // Valid i: prefix[j]-upper <= prefix[i] <= prefix[j]-lower
        lo2, hi2 := lo, lo
        for j := mid + 1; j <= hi; j++ {
            for lo2 <= mid && prefix[lo2] < prefix[j]-int64(upper) {
                lo2++
            }
            for hi2 <= mid && prefix[hi2] <= prefix[j]-int64(lower) {
                hi2++
            }
            count += hi2 - lo2
        }

        // Standard merge
        copy(aux[lo:hi+1], prefix[lo:hi+1])
        i, j := lo, mid+1
        for k := lo; k <= hi; k++ {
            if i > mid {
                prefix[k] = aux[j]; j++
            } else if j > hi {
                prefix[k] = aux[i]; i++
            } else if aux[i] <= aux[j] {
                prefix[k] = aux[i]; i++
            } else {
                prefix[k] = aux[j]; j++
            }
        }
    }

    msort(0, n)
    return count
}
```

**Why $O(n \log n)$?** The two pointers `lo2` and `hi2` only move forward. Across all $j$ in the right half, they traverse at most the entire left half. So the counting step is $O(n)$ per merge level, and there are $O(\log n)$ levels.

**Complexity:** $O(n \log n)$ time, $O(n)$ space.

---

## 8. Final Thoughts

1. **Math dictates the floor.** Merge Sort hits the $\Omega(n \log n)$ lower bound. The decision tree proves that no comparison-based sort will ever beat that speed.
2. **The merge runs the machine.** A strict two-pointer system processes the arrays in flat $O(n)$ time. The `<=` operator locks in the stability.
3. **Raw theory needs practical fixes.** A shared auxiliary buffer kills the memory leaks. Splicing in Insertion Sort handling handles the micro-arrays. Checking if the chunk is "already sorted" short-circuits dead processing time.
4. **Memory is the hidden cost.** The algorithm demands $O(n)$ extra space. That forces developers toward Quicksort for basic array tasks. But linked lists and disk-based sorting jobs have to rely on Merge Sort. Nothing else handles them better.
5. **The pattern scales.** Counting inversions, range sums, and closest pairs all run on this identical blueprint: split the board, solve the pieces, and merge the answers.
6. **The Master Theorem cuts through the noise.** It simplifies any divide-and-conquer formula down to a straight comparison between the split depth and the merge cost.
