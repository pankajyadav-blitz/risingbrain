# Pattern Wise Sheet

> Master data structures and algorithms topic by topic

**17 topics · 69 subtopics · 390 problems**

_Ported from the RisingBrain content set (`../demo/risingbrain/data/seed_v2.json`). Each topic groups one or more pattern-based subtopics; every subtopic carries a **strategy** (how the pattern works) and an **identification** cue (how to spot it), followed by its problems._

## Topics

- [Array](#array) — 25 problems
- [Strings](#strings) — 11 problems
- [Binary Search](#binary-search) — 23 problems
- [Stack](#stack) — 32 problems
- [Recursion](#recursion) — 20 problems
- [Linked List](#linked-list) — 29 problems
- [Double Linked List](#double-linked-list) — 9 problems
- [HashMap](#hashmap) — 13 problems
- [Tree](#tree) — 31 problems
- [Binary Search Tree](#binary-search-tree) — 12 problems
- [Graph](#graph) — 45 problems
- [Heap](#heap) — 20 problems
- [Backtracking](#backtracking) — 24 problems
- [Greedy](#greedy) — 19 problems
- [Dynamic Programming](#dynamic-programming) — 49 problems
- [Trie](#trie) — 12 problems
- [Bit Manipulation](#bit-manipulation) — 16 problems

---

## Array

Fundamental collection of elements stored at contiguous memory locations.

### Two-Pointer

**Strategy:** Use two indices that move towards or away from each other to reduce redundant comparisons.

**Identify when:** Problem involves pairs, sorted arrays, triplets, or opposite-end traversal.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Two Sum II | LC 167 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) · [GFG](https://www.geeksforgeeks.org/problems/pair-with-given-sum-in-a-sorted-array4940/1) · [YouTube](https://www.youtube.com/watch?v=o_fANlVBKuU&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2) |
| 2 | 3Sum | LC 15 | 🟡 Medium | Facebook, Microsoft, Morgan Stanley | [LeetCode](https://leetcode.com/problems/3sum/) · [GFG](https://www.geeksforgeeks.org/problems/triplet-sum-in-array-1587115621/1) · [YouTube](https://www.youtube.com/watch?v=PShx8lzd8_E&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2&index=2) |
| 3 | Sort Colors | LC 75 | 🟡 Medium | Microsoft, Flipkart, Adobe | [LeetCode](https://leetcode.com/problems/sort-colors/) · [GFG](https://www.geeksforgeeks.org/problems/sort-an-array-of-0s-1s-and-2s4231/1) · [YouTube](https://www.youtube.com/watch?v=E-txNhS9TnI&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2&index=3) |
| 4 | Move Zeroes | LC 283 | 🟢 Easy | Amazon, Google, Swiggy | [LeetCode](https://leetcode.com/problems/move-zeroes/) · [GFG](https://www.geeksforgeeks.org/problems/move-all-zeroes-to-end-of-array0751/1) · [YouTube](https://www.youtube.com/watch?v=kxibKXHbgVs&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2&index=4) |
| 5 | Container With Most Water | LC 11 | 🟡 Medium | Amazon, Apple, DE Shaw | [LeetCode](https://leetcode.com/problems/container-with-most-water/) · [GFG](https://www.geeksforgeeks.org/problems/container-with-most-water0535/1) · [YouTube](https://www.youtube.com/watch?v=eiYG5tDu_Ok&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2&index=5) |
| 6 | Trapping Rain Water | LC 42 | 🔴 Hard | Google, Goldman Sachs, Sumo Logic | [LeetCode](https://leetcode.com/problems/trapping-rain-water/) · [GFG](https://www.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1) · [YouTube](https://www.youtube.com/watch?v=uLCmHMPQo2M&list=PLvNVexrplJJzvtkPJ6tTZGqbwd5NlJBF2&index=6) |

### Sliding Window

**Strategy:** Maintain a window of fixed size or expand/shrink it to satisfy a condition.

**Identify when:** Problem uses words like “window of size k”, “longest”, “shortest”, or “at most K”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Maximum Sum Subarray of Size K | GFG | 🟢 Easy | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/) · [GFG](https://www.geeksforgeeks.org/problems/max-sum-subarray-of-size-k5313/1) · [YouTube](https://www.youtube.com/watch?v=dgjKO46bu3A&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=2) |
| 2 | Max Consecutive ones | LC 485 | 🟢 Easy | Amazon, Google, Paytm | [LeetCode](https://leetcode.com/problems/max-consecutive-ones/description/) · [GFG](https://www.geeksforgeeks.org/problems/max-consecutive-one/1) · [YouTube](https://www.youtube.com/watch?v=-ge71216LWw&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=3) |
| 3 | Max Consecutive ones III | LC 1004 | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/max-consecutive-ones-iii/description/) · [GFG](https://www.geeksforgeeks.org/problems/maximize-number-of-1s0905/1) · [YouTube](https://www.youtube.com/watch?v=sVEFAIUmTuM&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=4) |
| 4 | Subarray Product Less Than K | LC 713 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/subarray-product-less-than-k/description/) · [GFG](https://www.geeksforgeeks.org/problems/count-the-subarrays-having-product-less-than-k1708/1) · [YouTube](http://youtube.com/watch?v=-eEZskncDLc&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=5) |
| 5 | Sliding Window Maximum | LC 239 | 🔴 Hard | Amazon, Google, DE Shaw | [LeetCode](https://leetcode.com/problems/sliding-window-maximum/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-of-all-subarrays-of-size-k3101/1) · [YouTube](https://www.youtube.com/watch?v=e8iJPXS64MY&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=9) |
| 6 | Subarray with k distinct integers | LC 992 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/subarrays-with-k-different-integers/description/) · [GFG](https://www.geeksforgeeks.org/problems/subarrays-with-k-different-integers/1) · [YouTube](https://www.youtube.com/watch?v=fJNlpnYZpY8&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=8) |
| 7 | Fruits Into Baskets | LC 904 | 🟡 Medium | Amazon, Flipkart, PhonePe | [LeetCode](https://leetcode.com/problems/fruit-into-baskets/) · [GFG](https://www.geeksforgeeks.org/problems/fruit-into-baskets-1663137462/1) · [YouTube](https://www.youtube.com/watch?v=kge_3sdDWfE&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=7) |
| 8 | Minimum Size Subarray Sum | LC 209 | 🟡 Medium | Amazon, Morgan Stanley, Adobe | [LeetCode](https://leetcode.com/problems/minimum-size-subarray-sum/) · [GFG](https://www.geeksforgeeks.org/problems/smallest-subarray-with-sum-greater-than-x5651/1) · [YouTube](https://www.youtube.com/watch?v=A5XgKA7FDQE&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=6) |

### Prefix Sum

**Strategy:** Precompute cumulative sums so any subarray or range sum can be answered in O(1).

**Identify when:** Problem talks about range sum, subarray sum, cumulative sum, or prefix-based queries.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Subarray Sum Equals K | LC 560 | 🟡 Medium | Facebook, Amazon, Goldman Sachs | [LeetCode](https://leetcode.com/problems/subarray-sum-equals-k/) · [GFG](https://www.geeksforgeeks.org/problems/subarrays-with-sum-k/1) · [YouTube](https://www.youtube.com/watch?v=d2wUDNz_6iA&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=5) |
| 2 | Matrix Block Sum (Running Sum of 2D Array) | LC 1314 | 🟡 Medium | Amazon, Google, Flipkart | [LeetCode](https://leetcode.com/problems/matrix-block-sum/) · [GFG](https://www.geeksforgeeks.org/problems/2d-submatrix-sum-queries/1) · [YouTube](https://www.youtube.com/watch?v=3hF88U-KHyY&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=4) |
| 3 | Product of Array Except Self | LC 238 | 🟡 Medium | Amazon, Facebook, Flipkart | [LeetCode](https://leetcode.com/problems/product-of-array-except-self/description/) · [GFG](https://www.geeksforgeeks.org/problems/product-array-puzzle4525/1) · [YouTube](https://www.youtube.com/watch?v=I4zq1fXgugY&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=3) |
| 4 | Continuous Subarray Sum | LC 523 | 🟡 Medium | Facebook, DE Shaw, Sumo Logic | [LeetCode](https://leetcode.com/problems/continuous-subarray-sum/) · [GFG](https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1) · [YouTube](https://www.youtube.com/watch?v=1EToqmJBNjY&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=2) |
| 5 | Subarray Sum Divisible by K | LC 974 | 🟡 Medium | Goldman Sachs, Microsoft, PayPal | [LeetCode](https://leetcode.com/problems/subarray-sums-divisible-by-k/) · [GFG](https://www.geeksforgeeks.org/problems/sub-array-sum-divisible-by-k2617/1) · [YouTube](https://youtu.be/7IJdLmNJaSA?si=C0kzObuVWbuQvV4J) |
| 6 | Find Pivot Index | LC 724 | 🟢 Easy | Amazon, Paytm, Morgan Stanley | [LeetCode](https://leetcode.com/problems/find-pivot-index/) · [GFG](https://www.geeksforgeeks.org/problems/equilibrium-point-1587115620/1) · [YouTube](https://www.youtube.com/watch?v=WOivGAlWxlM&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL) |

### Kadane’s Algorithm

**Strategy:** Track the best subarray sum ending at each index and update the global maximum.

**Identify when:** Problem asks for maximum/minimum sum or product of a contiguous subarray.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Maximum Subarray | LC 53 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/maximum-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1) · [YouTube](https://www.youtube.com/watch?v=CU_TwNzuttQ&list=PLvNVexrplJJy-eQ3PNGlfRN2IvC9VE_Zz&index=22) |
| 2 | Maximum Product Subarray | LC 152 | 🟡 Medium | Google, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/maximum-product-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1) · [YouTube](https://www.youtube.com/watch?v=JjxEFeNdOoE&list=PLvNVexrplJJy-eQ3PNGlfRN2IvC9VE_Zz&index=23) |
| 3 | Maximum Sum Circular Subarray | LC 918 | 🟡 Medium | Amazon, Google, DE Shaw | [LeetCode](https://leetcode.com/problems/maximum-sum-circular-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/max-circular-subarray-sum-1587115620/1) |
| 4 | Maximum Absolute Sum of Any Subarray | LC 1749 | 🟡 Medium | Microsoft, Apple, Adobe | [LeetCode](https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/description/) |
| 5 | Largest Sum Contiguous Subarray | GFG | 🟡 Medium | Amazon, Flipkart, Zomato | [LeetCode](https://leetcode.com/problems/maximum-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/k-th-largest-sum-contiguous-subarray/1) · [YouTube](https://www.youtube.com/watch?v=CU_TwNzuttQ&list=PLvNVexrplJJy-eQ3PNGlfRN2IvC9VE_Zz&index=22) |

---

## Strings

Sequence of characters and common string manipulation patterns.

### Two-Pointer (Palindrome)

**Strategy:** Compare characters from both ends and move inward until the condition fails.

**Identify when:** Problem talks about palindrome checks, symmetric comparison, or reversing from both ends.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Reverse a String | LC 344 | 🟢 Easy | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/reverse-string/) · [GFG](https://www.geeksforgeeks.org/problems/reverse-a-string/1) |
| 2 | Valid Palindrome | LC 125 | 🟢 Easy | Amazon, Goldman Sachs, PayPal | [LeetCode](https://leetcode.com/problems/valid-palindrome/) · [GFG](https://www.geeksforgeeks.org/problems/string-palindromic-ignoring-spaces4723/1) · [YouTube](https://www.youtube.com/watch?v=L84y20axpIA) |
| 3 | Valid Palindrome II | LC 680 | 🟢 Easy | Microsoft, Morgan Stanley, PhonePe | [LeetCode](https://leetcode.com/problems/valid-palindrome-ii/) · [GFG](https://www.geeksforgeeks.org/problems/palindrome-string0817/1) · [YouTube](https://youtu.be/lVFCrcWz7JA?si=1jKSZ9WWGjLwr7mS) |
| 4 | Longest Palindromic Substring | LC 5 | 🟡 Medium | Google, Sumo Logic, DE Shaw | [LeetCode](https://leetcode.com/problems/longest-palindromic-substring/) · [GFG](https://practice.geeksforgeeks.org/problems/longest-palindrome-in-a-string3411/1) · [YouTube](https://youtu.be/5MS14_6rSa8) |
| 5 | Palindromic Substrings | LC 647 | 🟡 Medium | Amazon, Adobe, Flipkart | [LeetCode](https://leetcode.com/problems/palindromic-substrings/) · [GFG](https://www.geeksforgeeks.org/problems/count-palindrome-sub-strings-of-a-string0652/1) · [YouTube](https://youtu.be/vb88HyMMbig) |

### Sliding Window (String)

**Strategy:** Maintain a moving window and adjust its size to satisfy character constraints.

**Identify when:** Problem uses words like longest, shortest, substring, at most K, exactly K.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Find All Anagrams in a String | LC 438 | 🟡 Medium | Facebook, PhonePe, Swiggy | [LeetCode](https://leetcode.com/problems/find-all-anagrams-in-a-string/) · [GFG](https://www.geeksforgeeks.org/problems/count-occurences-of-anagrams5839/1) · [YouTube](https://youtu.be/91SdYBHSvjE) |
| 2 | Longest Substring Without Repeating Characters | LC 3 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/longest-substring-without-repeating-characters/) · [GFG](https://www.geeksforgeeks.org/problems/longest-distinct-characters-in-string5848/1) · [YouTube](https://youtu.be/92dMI4paQY4) |
| 3 | Longest Substring with K Uniques | LC 340 | 🟡 Medium | Amazon, Paytm, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/longest-k-unique-characters-substring0853/1) · [YouTube](https://youtu.be/Gsz_bGhI6v4) |
| 4 | Permutation in String | LC 567 | 🟡 Medium | Google, PhonePe, Adobe | [LeetCode](https://leetcode.com/problems/permutation-in-string/) · [GFG](https://www.geeksforgeeks.org/problems/permutations-of-a-given-string-1587115620/1) · [YouTube](https://youtu.be/7ZKe7P5bJbA) |
| 5 | Minimum Window Substring | LC 76 | 🔴 Hard | Microsoft, Flipkart, PhonePe | [LeetCode](https://leetcode.com/problems/minimum-window-substring/) · [GFG](https://www.geeksforgeeks.org/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string-1587115621/1) · [YouTube](https://youtu.be/9w9xip122n8) |
| 6 | Substring with Concatenation of All Words | LC 30 | 🔴 Hard | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/substring-with-concatenation-of-all-words/) |

---

## Binary Search

Efficient search algorithm that divides the search interval in half.

### Classic Binary Search

**Strategy:** Divide-and-conquer → narrow search space in sorted array.

**Identify when:** Problem mentions a sorted array or “find element efficiently.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Binary Search | LC 704 | 🟢 Easy | Google, Amazon, Atlassian | [LeetCode](https://leetcode.com/problems/binary-search/) · [GFG](https://www.geeksforgeeks.org/problems/binary-search-1587115620/1) · [YouTube](https://youtu.be/bjMOevaiZn0?si=1En1Sz8BoLlpg9LD) |
| 2 | Sqrt(x) | LC 69 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/sqrtx/description/) · [GFG](https://www.geeksforgeeks.org/problems/square-root/1) · [YouTube](https://www.youtube.com/watch?v=-gUwj9ZSRn8&list=PLvNVexrplJJx8Fi1geIYySPo3L13-0ZJr&index=2) |
| 3 | Search Insert Position | LC 35 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/search-insert-position/description/) · [GFG](https://www.geeksforgeeks.org/problems/search-insert-position-of-k-in-a-sorted-array/1) · [YouTube](https://youtu.be/-UyYRPvYNkI?si=_m0S-b7Vie2w643t) |
| 4 | Search in Rotated Sorted Array | LC 33 | 🟡 Medium | Amazon, Microsoft, Adobe | [LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array/) · [GFG](https://www.geeksforgeeks.org/problems/search-in-a-rotated-array4618/1) · [YouTube](https://youtu.be/aFN2LrKg6i0?si=djEiRxbZse_2GViD) |
| 5 | Find Minimum in Rotated Sorted Array | LC 153 | 🟡 Medium | Microsoft, Apple, Goldman Sachs | [LeetCode](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-element-in-a-sorted-and-rotated-array3611/1) · [YouTube](https://youtu.be/eDC6Pk-LQDw?si=ERs4FwLlwDkCSNMO) |
| 6 | Find Peak Element | LC 162 | 🟡 Medium | Amazon, Google, Zomato | [LeetCode](https://leetcode.com/problems/find-peak-element/) · [GFG](https://www.geeksforgeeks.org/problems/peak-element/1) · [YouTube](https://youtu.be/NUnhHa47f-Q?si=S37zB8zQ2B2k5g6G) |

### Lower / Upper Bound

**Strategy:** Find first/last occurrence or smallest/largest index satisfying a condition.

**Identify when:** Problem mentions first/last occurrence, bounds, or constraints on index.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Find First and Last Position of Element | LC 34 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/) · [GFG](https://www.geeksforgeeks.org/problems/first-and-last-occurrences-of-x3116/1) · [YouTube](https://youtu.be/ThfrnBTyPNY?si=90O7yBlX6Yr_wtVm) |
| 2 | Find kth rotation | LC 189 | 🟢 Easy | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/rotate-array/description/) · [GFG](https://www.geeksforgeeks.org/problems/rotation4723/1) · [YouTube](https://youtu.be/DuMn3EezZUo?si=-9wGWDwGLv-S7l7B) |
| 3 | Count Occurrences | GFG | 🟢 Easy | Amazon, Google | [GFG](https://www.geeksforgeeks.org/problems/number-of-occurrence2259/1) · [YouTube](https://youtu.be/m3a0NRGqrNg?si=XuI1aKVz4062Rn-u) |
| 4 | Ceiling in a Sorted Array | GFG | 🟢 Easy | Microsoft, Apple, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/ceil-in-a-sorted-array/1) · [YouTube](https://youtu.be/jkqDSR_PUDs?si=9Qlu9PJWEW8xnZm_) |
| 5 | Floor in a Sorted Array | GFG | 🟢 Easy | Amazon, Google, Zomato | [GFG](https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1) · [YouTube](https://youtu.be/jkqDSR_PUDs?si=9Qlu9PJWEW8xnZm_) |

### Binary Search on Answers

**Strategy:** Treat answer space as sorted → binary search to find minimum/maximum feasible value.

**Identify when:** Problem mentions minimum/maximum feasible value or optimization over a range.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Koko Eating Bananas | LC 875 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/koko-eating-bananas/) · [GFG](https://www.geeksforgeeks.org/problems/koko-eating-bananas/1) · [YouTube](https://youtu.be/sPlRs126bFU?si=8mCShPyIVcIMUgPe) |
| 2 | Capacity To Ship Packages Within D Days | LC 1011 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/) · [GFG](https://www.geeksforgeeks.org/problems/capacity-to-ship-packages-within-d-days/1) · [YouTube](https://youtu.be/rJ1Ih0BLRW0?si=DUydKTlbeARqjYIC) |
| 3 | Min Speed to Arrive on Time | LC 1870 | 🟡 Medium | Microsoft, Apple, Goldman Sachs | [LeetCode](https://leetcode.com/problems/minimum-speed-to-arrive-on-time/description/) · [YouTube](https://youtu.be/yhhfDh3TEzg?si=Z8m7CfU6inCkZUPk) |
| 4 | Aggressive cows | GFG | 🟡 Medium | Flipkart, PhonePe, Amazon | [GFG](https://www.geeksforgeeks.org/problems/aggressive-cows/1) · [YouTube](https://youtu.be/WMtvM9BrrM0?si=YbrPPUabxAyo7FQ9) |
| 5 | Min number of days to make m bouquets | LC 1482 | 🟡 Medium | Flipkart, PhonePe, Paytm | [LeetCode](https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-days-to-make-m-bouquets/1) · [YouTube](https://youtu.be/n4F8Q5HV8RY?si=ijL3GyO4BO37r01X) |
| 6 | Magnetic Force Between Two Balls | LC 1552 | 🟡 Medium | Flipkart, PhonePe, Paytm | [LeetCode](https://leetcode.com/problems/magnetic-force-between-two-balls/description/) · [YouTube](https://www.youtube.com/watch?v=oAD4ctsWRpY) |
| 7 | Allocate Minimum Number of Pages | GFG | 🟡 Medium | Flipkart, PhonePe, Paytm | [GFG](https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1) · [YouTube](https://www.youtube.com/watch?v=Flewu6KqN54) |
| 8 | Split Array Largest Sum | LC 410 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/split-array-largest-sum/) · [GFG](https://www.geeksforgeeks.org/problems/split-array-largest-sum--141634/1) · [YouTube](https://www.youtube.com/watch?v=nNlRAJ_jv_Y) |

### Search in 2D Matrix

**Strategy:** Apply binary search row-wise / column-wise or flattened array.

**Identify when:** Problem mentions 2D matrix, row/column sorted, or kth smallest element.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Search a 2D Matrix | LC 74 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/search-a-2d-matrix/) · [GFG](https://www.geeksforgeeks.org/problems/search-in-a-matrix17201720/1) · [YouTube](https://www.youtube.com/watch?v=2jqTPmHyz8U) |
| 2 | Search a 2D Matrix II | LC 240 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/search-a-2d-matrix-ii/) · [GFG](https://www.geeksforgeeks.org/problems/search-in-a-matrix-1587115621/1) · [YouTube](https://www.youtube.com/watch?v=bNKpSXldPh4) |
| 3 | Kth Smallest Element in Sorted Matrix | LC 378 | 🟡 Medium | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/kth-element-in-matrix/1) · [YouTube](https://www.youtube.com/watch?v=16YmDvztm8I) |
| 4 | Matrix Median | GFG | 🔴 Hard | Amazon, Adobe, Sumo Logic | [GFG](https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1) |

---

## Stack

LIFO (Last In First Out) data structure patterns.

### Monotonic Stack

**Strategy:** Maintain a monotonic increasing/decreasing stack to find next/prev greater/smaller, histogram ranges, or collisions.

**Identify when:** Problem mentions “next greater/smaller element,” spans, or trapping area.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Next Greater Element I | LC 496 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/next-greater-element-i/) · [GFG](https://www.geeksforgeeks.org/problems/next-larger-element-1587115620/1) · [YouTube](https://youtu.be/rfl_M3SuvIE) |
| 2 | Next Greater Element II | LC 503 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/next-greater-element-ii/) · [YouTube](https://youtu.be/s0ly3pzYnVo) |
| 3 | Daily Temperatures | LC 739 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/daily-temperatures/) · [YouTube](https://youtu.be/OQY4tbt_m6I) |
| 4 | Online Stock Span | LC 901 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/online-stock-span/) · [GFG](https://www.geeksforgeeks.org/problems/stock-span-problem-1587115621/1) · [YouTube](https://youtu.be/6Izu3F3vibo) |
| 5 | Largest Rectangle in Histogram | LC 84 | 🔴 Hard | Google, PayPal, DE Shaw | [LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-rectangular-area-in-a-histogram-1587115620/1) · [YouTube](https://youtu.be/OQJjh6AT00g) |
| 6 | Maximal Rectangle | LC 85 | 🔴 Hard | Amazon, Goldman Sachs, Zomato | [LeetCode](https://leetcode.com/problems/maximal-rectangle/) · [GFG](https://www.geeksforgeeks.org/problems/max-rectangle/1) · [YouTube](https://youtu.be/9BsmRHimO1I) |
| 7 | Asteroid Collision | LC 735 | 🟡 Medium | Flipkart, PhonePe, Morgan Stanley | [LeetCode](https://leetcode.com/problems/asteroid-collision/) · [GFG](https://www.geeksforgeeks.org/problems/asteroid-collision/1) · [YouTube](https://youtu.be/sLdOQswhsQQ) |

### Expression Evaluation

**Strategy:** Use two stacks or postfix evaluation to handle numbers and operators efficiently.

**Identify when:** Problem involves evaluating arithmetic expressions, parentheses, or decoding strings.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Basic Calculator I | LC 224 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/basic-calculator/) · [GFG](https://www.geeksforgeeks.org/problems/calculator/1) |
| 2 | Basic Calculator II | LC 227 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/basic-calculator-ii/) · [GFG](https://www.geeksforgeeks.org/problems/create-your-own-calculator4308/1) · [YouTube](https://youtu.be/UFU7usbJj3s) |
| 3 | Evaluate Reverse Polish Notation | LC 150 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/evaluate-reverse-polish-notation/) · [GFG](https://www.geeksforgeeks.org/problems/evaluation-of-postfix-expression1735/1) · [YouTube](https://youtu.be/wKbDy5FWksE) |
| 4 | Decode String | LC 394 | 🟡 Medium | Google, PayPal, Zomato | [LeetCode](https://leetcode.com/problems/decode-string/) · [GFG](https://www.geeksforgeeks.org/problems/decode-the-string2444/1) · [YouTube](https://youtu.be/hTf5N2vOCL8?si=4H7jCGEYzMy8wOfL) |

### Stack Simulation / Undo Operation

**Strategy:** Simulate operations using a stack → pop on undo, remove adjacent duplicates, collapse characters.

**Identify when:** Problem mentions “undo,” “remove duplicates,” or “backspace string” operations.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Backspace String Compare | LC 844 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/backspace-string-compare/) · [GFG](https://www.geeksforgeeks.org/problems/string-comparison5858/1) · [YouTube](https://youtu.be/mRCQeS5wFfQ?si=ZPXG095PWtTf08sw) |
| 2 | Remove All Adjacent Duplicates | LC 1047 | 🟢 Easy | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/) · [GFG](https://www.geeksforgeeks.org/dsa/remove-all-adjacent-duplicates-in-string-ii/) · [YouTube](https://youtu.be/lNJBYVQwE7Q?si=cycOhFzVjx4v48dI) |
| 3 | Make the String Great | LC 1544 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/make-the-string-great/) · [GFG](https://www.geeksforgeeks.org/problems/good-string5712/1) · [YouTube](https://youtu.be/HQWyxg4dxxM?si=LE2QLIv-EcpNIBxv) |
| 4 | Minimum String Length After Removing Substrings | GFG | 🟡 Medium | Google, PayPal, Zomato | [LeetCode](https://leetcode.com/problems/minimum-string-length-after-removing-substrings/description/) · [YouTube](https://youtu.be/eYGXPLsEqMo?si=PyWmgau5uM2raSW7) |

### Parenthesis & Scoring

**Strategy:** Push opening symbols and validate closing ones; sometimes track count or score.

**Identify when:** Problem mentions parentheses, balanced brackets, scoring, or generation.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Valid Parentheses | LC 20 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/valid-parentheses/) · [GFG](https://www.geeksforgeeks.org/problems/parenthesis-checker2744/1) · [YouTube](https://youtu.be/3VCxVEkraw8?si=p-bvF1Rx6gdsHaSe) |
| 2 | Minimum Add to Make Parentheses Valid | LC 921 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/) · [GFG](https://www.geeksforgeeks.org/problems/min-add-to-make-parentheses-valid/1) · [YouTube](https://youtu.be/OJnsjxISoP0?si=YWC2gEdH8LiLbmnr) |
| 3 | Longest Valid Parentheses | LC 32 | 🔴 Hard | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/longest-valid-parentheses/) · [GFG](https://www.geeksforgeeks.org/problems/longest-valid-parentheses5657/1) · [YouTube](https://youtu.be/rOy5MWUs18Q?si=GDPgZlMppmDPCv_6) |
| 4 | Score of Parentheses | LC 856 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/score-of-parentheses/) · [GFG](https://www.geeksforgeeks.org/problems/score-of-parentheses-string/1) · [YouTube](https://youtu.be/6ELzHiH4kZ8?si=W-Bjvo4FpLvJYcb8) |

### Stack-Based Design

**Strategy:** Use two stacks to implement another data structure or maintain extra info.

**Identify when:** Problem mentions designing stack/queue systems or custom operations.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Min Stack | LC 155 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/min-stack/) · [GFG](https://www.geeksforgeeks.org/problems/get-minimum-element-from-stack/1) · [YouTube](https://youtu.be/D9HDBEx_Bac?si=4d-suWPCG6phLsvU) |
| 2 | Max Stack | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/get-max-from-stack/1) |
| 3 | Implement Queue using Stacks | LC 232 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/implement-queue-using-stacks/) · [GFG](https://www.geeksforgeeks.org/problems/queue-using-stack/1) · [YouTube](https://youtu.be/83r2JVsu5Ro?si=1Lz8Vw7H58Duim_n) |
| 4 | Implement Stack using Queues | LC 225 | 🟢 Easy | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/implement-stack-using-queues/) · [GFG](https://www.geeksforgeeks.org/problems/stack-using-two-queues/1) · [YouTube](https://youtu.be/leR-4ANdsRQ?si=cufoTT1MA0d7t47Z) |
| 5 | Design Stack with Increment Operation | LC 1381 | 🟡 Medium | Microsoft, Morgan Stanley, Goldman Sachs | [LeetCode](https://leetcode.com/problems/design-a-stack-with-increment-operation/description/) · [GFG](https://www.geeksforgeeks.org/problems/stacks-operations/1) · [YouTube](https://youtu.be/v6lQm02OEiw?si=DcGBVdIpEHyFKTqU) |

### Stack + Greedy

**Strategy:** Combine stack properties with greedy choices to optimize strings or numbers.

**Identify when:** Problems asking for smallest/largest sequence, removing k elements

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Remove K Digits | LC 402 | 🟡 Medium | Goldman Sachs, Sumo Logic, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/remove-k-digits/) · [GFG](https://www.geeksforgeeks.org/problems/remove-k-digits/1) · [YouTube](https://youtu.be/u9Ih5uY-6U0?si=qBZ1HKJ63A5yBHIy) |
| 2 | Remove Duplicate Letters | LC 316 | 🟡 Medium | Google, Microsoft, Meta | [LeetCode](https://leetcode.com/problems/remove-duplicate-letters/) · [YouTube](https://youtu.be/VNBVQ89mlTo?si=_m94Uvyq0XIHJ2Ra) |
| 3 | Smallest Subsequence of Distinct Characters | LC 1081 | 🟡 Medium | Google, Amazon, Uber | [LeetCode](https://leetcode.com/problems/smallest-subsequence-of-distinct-characters/) |
| 4 | Create Maximum Number | LC 321 | 🔴 Hard | Google, Amazon, ByteDance | [LeetCode](https://leetcode.com/problems/create-maximum-number/) |
| 5 | Minimum Remove to Make Valid Parentheses | LC 1249 | 🟡 Medium | Meta, Amazon, Bloomberg | [LeetCode](https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/) · [GFG](https://www.geeksforgeeks.org/problems/min-add-to-make-parentheses-valid/1) · [YouTube](https://youtu.be/54m6kYA9QFE?si=jXy2ClmV9PpTh5Ko) |

### Recursive Stack

**Strategy:** Handle top/head element recursively → recurse on remaining stack/list → combine/insert results.

**Identify when:** Problem mentions reverse/insert/delete recursively, sort stack, merge lists, or check palindrome recursively.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Reverse a Stack (Recursive) | GFG | 🟡 Medium | Amazon, Samsung | [GFG](https://www.geeksforgeeks.org/problems/reverse-a-stack/1) · [YouTube](https://youtu.be/PrvZ91XczPA?si=4p8IwVUzKUPV_jtX) |
| 2 | Insert at Bottom of Stack | GFG | 🟡 Medium | Google, Microsoft | [LeetCode](https://leetcode.com/problems/implement-stack-using-queues/) · [GFG](https://www.geeksforgeeks.org/problems/insert-an-element-at-the-bottom-of-a-stack/1) |
| 3 | Delete Middle Element of Stack | LC 206 | 🟢 Easy | Amazon, Microsoft | [GFG](https://www.geeksforgeeks.org/problems/delete-middle-element-of-a-stack/1) |

---

## Recursion

Solving problems by breaking them down into smaller, self-similar subproblems.

### Linear Recursion

**Strategy:** Solve problems by reducing them to a simpler instance of the same problem.

**Identify when:** Problems requiring repetitive smaller tasks without splitting into multiple branches.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Factorial of N | Classic | 🟢 Easy | Amazon, PayPal, Oracle | [GFG](https://practice.geeksforgeeks.org/problems/factorial5739/1) · [YouTube](https://youtu.be/085ESSh8LJQ?si=_d87KP4InoMdL_Ab) |
| 2 | Print 1 to N / N to 1 | Classic | 🟢 Easy | Zoho, Freshworks, Paytm | [GFG](https://practice.geeksforgeeks.org/problems/print-1-to-n-without-using-loops3621/1) · [YouTube](https://youtu.be/085ESSh8LJQ?si=_d87KP4InoMdL_Ab) |
| 3 | Check Palindrome (Recursive) | Classic | 🟢 Easy | Uber, PayPal, Intuit | [GFG](https://practice.geeksforgeeks.org/problems/palindrome0746/1) · [YouTube](https://youtu.be/085ESSh8LJQ?si=_d87KP4InoMdL_Ab) |
| 4 | Pow(x, n) | Classic | 🟡 Medium | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/powx-n/) · [GFG](https://www.geeksforgeeks.org/problems/power-of-numbers-1587115620/1) · [YouTube](https://youtu.be/4XKU03AZt54?si=wMUCTlShlzgyz4ar) |

### Non-Linear Recursion

**Strategy:** Make multiple recursive calls at each step to explore different branches and combine their results.

**Identify when:** Problems where each step leads to multiple possibilities, such as Fibonacci sequences or finding unique paths on a grid.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Fibonacci Number | Classic | 🟢 Easy | Amazon, Google, Meta | [LeetCode](https://leetcode.com/problems/fibonacci-number/) · [GFG](https://www.geeksforgeeks.org/problems/print-first-n-fibonacci-numbers1002/1) · [YouTube](https://youtu.be/Z27GTaBEiMg?si=SMDB8BYTXkZk7G2p) |
| 2 | Climbing Stairs | Classic | 🟢 Easy | Amazon, Adobe, Goldman Sachs | [LeetCode](https://leetcode.com/problems/climbing-stairs/) · [GFG](https://www.geeksforgeeks.org/problems/count-ways-to-reach-the-nth-stair-1587115620/1) · [YouTube](https://youtu.be/Z27GTaBEiMg?si=SMDB8BYTXkZk7G2p) |
| 3 | Unique Paths | Classic | 🟡 Medium | Google, Uber, Flipkart | [LeetCode](https://leetcode.com/problems/unique-paths/) · [GFG](https://www.geeksforgeeks.org/problems/unique-paths-in-a-grid--170647/1) · [YouTube](https://youtu.be/NA4E0QQdTOk?si=tzUU5ismfzX4CCxn) |
| 4 | House Robber / Stickler Thief | Classic | 🟡 Medium | Amazon, Walmart, PayPal | [LeetCode](https://leetcode.com/problems/house-robber/) · [GFG](https://www.geeksforgeeks.org/problems/stickler-theif-1587115621/1) |

### Divide & Conquer

**Strategy:** Divide the problem into smaller subproblems, solve them recursively, and combine results.

**Identify when:** Sorting, searching in structured data, reducing complexity logarithmically.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Merge Sort | Classic | 🟡 Medium | Google, Microsoft, Adobe | [GFG](https://practice.geeksforgeeks.org/problems/merge-sort/1) |
| 2 | Quick Sort | Classic | 🟡 Medium | Amazon, Oracle, Samsung | [GFG](https://practice.geeksforgeeks.org/problems/quick-sort/1) |
| 3 | Binary Search (Recursive) | LC 704 | 🟢 Easy | Google, Amazon, Atlassian | [LeetCode](https://leetcode.com/problems/binary-search/) · [GFG](https://practice.geeksforgeeks.org/problems/binary-search/1) · [YouTube](https://youtu.be/bjMOevaiZn0?si=1En1Sz8BoLlpg9LD) |
| 4 | Power (xⁿ) | LC 50 | 🟡 Medium | Flipkart, Uber, Paytm | [LeetCode](https://leetcode.com/problems/powx-n/) · [YouTube](https://youtu.be/4XKU03AZt54?si=wMUCTlShlzgyz4ar) |
| 5 | Median of Two Sorted Arrays | Classic | 🔴 Hard | Google, Meta, Apple | [LeetCode](https://leetcode.com/problems/median-of-two-sorted-arrays/) · [GFG](https://www.geeksforgeeks.org/problems/median-of-two-sorted-arrays-of-different-sizes/1) |

### Recursion on LinkedList/Stack

**Strategy:** Process data structures recursively by handling the first/last element and recursing on the rest.

**Identify when:** Problems asking to reverse, delete, or merge standard linear data structures.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Reverse Linked List | LC 206 | 🟢 Easy | Microsoft, Amazon, Google | [LeetCode](https://leetcode.com/problems/reverse-linked-list/) · [GFG](https://practice.geeksforgeeks.org/problems/reverse-a-linked-list/1) |
| 2 | Merge 2 Sorted Lists | LC 21 | 🟢 Easy | Meta, Google, Adobe | [LeetCode](https://leetcode.com/problems/merge-two-sorted-lists/) · [GFG](https://practice.geeksforgeeks.org/problems/merge-two-sorted-linked-lists/1) |
| 3 | Delete Middle of Stack | Classic | 🟢 Easy | Zoho, Freshworks, Oracle | [GFG](https://practice.geeksforgeeks.org/problems/delete-middle-element-of-a-stack/1) |
| 4 | Reverse Stack | Classic | 🟡 Medium | Amazon, Adobe, Zoho | [GFG](https://practice.geeksforgeeks.org/problems/reverse-a-stack/1) · [YouTube](https://youtu.be/PrvZ91XczPA?si=4p8IwVUzKUPV_jtX) |

### Subsequences

**Strategy:** Explore all possible subsets by choosing to include or exclude each element.

**Identify when:** Problems asking for subsets, combinations, or subsequences.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Generate All Subsets | LC 78 | 🟡 Medium | Meta, Microsoft, Amazon | [LeetCode](https://leetcode.com/problems/subsets/) · [GFG](https://practice.geeksforgeeks.org/problems/power-set/1) |
| 2 | Subset Sum | Classic | 🟡 Medium | Adobe, Flipkart, Paytm | [GFG](https://practice.geeksforgeeks.org/problems/subset-sum-problem2014/1) |
| 3 | Count Subsequences with Given Sum | LC 494 | 🟡 Medium | Amazon, Google, Uber | [LeetCode](https://leetcode.com/problems/target-sum/) · [GFG](https://practice.geeksforgeeks.org/problems/perfect-sum-problem5633/1) |

---

## Linked List

Linear data structure where elements are not stored at contiguous memory locations.

### Basic Operations

**Strategy:** Directly manipulate pointers to insert, delete, traverse, and get length.

**Identify when:** Problem mentions insertion, deletion at head/tail/Nth node or traversal.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Search in Linked List | GFG | 🟢 Easy | Facebook, DE Shaw, Zomato | [GFG](https://www.geeksforgeeks.org/problems/search-in-linked-list-1664434326/1) |
| 2 | Insert at Head / Tail / Nth Position | GFG | 🟢 Easy | Amazon, Paytm, PayPal | [GFG](https://www.geeksforgeeks.org/problems/linked-list-insertion-1587115620/1) |
| 3 | Delete Head / Tail / Nth Node | GFG | 🟢 Easy | Google, Adobe, Morgan Stanley | [LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/description/) · [GFG](https://www.geeksforgeeks.org/problems/delete-a-node-in-single-linked-list/1) |
| 4 | Design Linked List | LC 707 | 🟡 Medium | Amazon, Facebook, Goldman Sachs | [LeetCode](https://leetcode.com/problems/design-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/introduction-to-linked-list/1) |
| 5 | Odd–Even Linked List | LC 328 | 🟡 Medium | Google, PayPal, Zomato | [LeetCode](https://leetcode.com/problems/odd-even-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/rearrange-a-linked-list/1) |
| 6 | Intersection of Two Linked Lists | LC 160 | 🟢 Easy | Amazon, Microsoft, Flipkart | [LeetCode](https://leetcode.com/problems/intersection-of-two-linked-lists/) · [GFG](https://www.geeksforgeeks.org/write-a-function-to-get-the-intersection-point-of-two-linked-lists/) |

### Fast and Slow Pointers

**Strategy:** Use two pointers at different speeds to detect cycles, middle node, or duplicates.

**Identify when:** Problem involves loops, cycle detection, or middle node operations.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Middle of the Linked List | LC 876 | 🟢 Easy | DE Shaw, Flipkart, Paytm | [LeetCode](https://leetcode.com/problems/middle-of-the-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/finding-middle-element-in-a-linked-list/1) |
| 2 | Linked List Cycle | LC 141 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/linked-list-cycle/) · [GFG](https://www.geeksforgeeks.org/problems/detect-loop-in-linked-list/1) |
| 3 | Linked List Cycle II | LC 142 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/linked-list-cycle-ii/) · [GFG](https://www.geeksforgeeks.org/problems/remove-loop-in-linked-list/1) |
| 4 | Remove Nth Node From End | LC 19 | 🟡 Medium | Google, PayPal, Swiggy | [LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) · [GFG](https://www.geeksforgeeks.org/problems/nth-node-from-end-of-linked-list/1) |

### Reversal Pattern

**Strategy:** Reverse entire list, partial list, or groups to reorder nodes.

**Identify when:** Problem mentions reversing nodes or rearranging linked list order.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Reverse a Linked List | LC 206 | 🟢 Easy | Amazon, Microsoft, Goldman Sachs | [LeetCode](https://leetcode.com/problems/reverse-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/reverse-a-linked-list/1) |
| 2 | Reverse Linked List II (between m & n) | LC 92 | 🟡 Medium | Microsoft, Amazon, Google | [LeetCode](https://leetcode.com/problems/reverse-linked-list-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/reverse-a-sublist-of-a-linked-list/1) |
| 3 | Palindrome Linked List | LC 234 | 🟢 Easy | Amazon, PhonePe, Adobe | [LeetCode](https://leetcode.com/problems/palindrome-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/check-if-linked-list-is-pallindrome/1) |
| 4 | Maximum Twin Sum of a Linked List | LC | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/maximum-twin-sum-of-a-linked-list/) |
| 5 | Reverse Nodes in k-Group | LC 25 | 🔴 Hard | Google, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/reverse-nodes-in-k-group/) · [GFG](https://www.geeksforgeeks.org/problems/reverse-a-linked-list-in-groups-of-given-size/1) |
| 6 | Swap Nodes in Pairs | LC 24 | 🟡 Medium | Amazon, PhonePe, Adobe | [LeetCode](https://leetcode.com/problems/swap-nodes-in-pairs/) · [GFG](https://www.geeksforgeeks.org/problems/pairwise-swap-elements-of-a-linked-list-by-swapping-data/1) |
| 7 | Rotate List (circular linkedlist) | LC 61 | 🟡 Medium | Amazon, Microsoft, Sumo Logic | [LeetCode](https://leetcode.com/problems/rotate-list/) · [GFG](https://www.geeksforgeeks.org/problems/rotate-a-linked-list/1) |

### Merge / Sort

**Strategy:** Merge sorted lists, sort list using merge sort, or reorder using middle + reverse + merge.

**Identify when:** Problem mentions merging, sorting, or reordering linked lists.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Merge Two Sorted Lists | LC 21 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/merge-two-sorted-lists/) · [GFG](https://www.geeksforgeeks.org/problems/merge-two-sorted-linked-lists/1) |
| 2 | Merge K Sorted Lists | LC 23 | 🔴 Hard | Microsoft, Facebook, DE Shaw | [LeetCode](https://leetcode.com/problems/merge-k-sorted-lists/) · [GFG](https://www.geeksforgeeks.org/problems/merge-k-sorted-linked-lists/1) |
| 3 | Sort List | LC 148 | 🟡 Medium | Flipkart, Paytm, Adobe | [LeetCode](https://leetcode.com/problems/sort-list/) · [GFG](https://www.geeksforgeeks.org/problems/sort-a-linked-list/1) |
| 4 | Reorder List | LC 143 | 🟡 Medium | Amazon, PayPal, Morgan Stanley | [LeetCode](https://leetcode.com/problems/reorder-list/) · [GFG](https://www.geeksforgeeks.org/problems/reorder-list/1) |
| 5 | Remove Duplicates from Sorted List | LC 83 | 🟢 Easy | Google, PhonePe, Sumo Logic | [LeetCode](https://leetcode.com/problems/remove-duplicates-from-sorted-list/) · [GFG](https://www.geeksforgeeks.org/problems/remove-duplicate-element-from-sorted-linked-list/1) |
| 6 | Remove Duplicates from Sorted List II | LC 82 | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/) · [GFG](https://www.geeksforgeeks.org/remove-duplicates-sorted-linked-list/) |
| 7 | Partition List | LC 86 | 🟡 Medium | Amazon, Microsoft, Facebook | [LeetCode](https://leetcode.com/problems/partition-list/) · [GFG](https://www.geeksforgeeks.org/partitioning-a-linked-list-around-a-given-value/) |

### LinkedList with Stack/HashMap

**Strategy:** Use a stack to handle backward traversal, carry logic, or next greater node.

**Identify when:** Problem mentions reverse order processing or “next greater” style operations.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Add Two Numbers | LC 2 | 🟡 Medium | Amazon, Microsoft, Goldman Sachs | [LeetCode](https://leetcode.com/problems/add-two-numbers/) · [GFG](https://www.geeksforgeeks.org/problems/add-two-numbers-represented-by-linked-lists/1) |
| 2 | Add Two Numbers II | LC 445 | 🟡 Medium | Google, Facebook, DE Shaw | [LeetCode](https://leetcode.com/problems/add-two-numbers-ii/) · [GFG](https://www.geeksforgeeks.org/problems/add-two-numbers-represented-by-linked-lists/1) |
| 3 | Next Greater Node in Linked List | LC 1019 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/next-greater-node-in-linked-list/) |
| 4 | Remove Nodes From Linked List | LC 2487 | 🟡 Medium | Amazon, Adobe, Morgan Stanley | [LeetCode](https://leetcode.com/problems/remove-nodes-from-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/delete-nodes-having-greater-value-on-right/1) |
| 5 | Copy List with Random Pointer | LC 138 | 🟡 Medium | Amazon, Microsoft, Adobe | [LeetCode](https://leetcode.com/problems/copy-list-with-random-pointer/) · [GFG](https://www.geeksforgeeks.org/clone-linked-list-next-random-pointer-o1-space/) |

---

## Double Linked List

Linked List with navigation in both forward and backward directions.

### Basic DLL Operations

**Strategy:** Maintain prev and next pointers carefully for insert, delete, traversal; use DLL + HashMap for O(1) cache operations.

**Identify when:** Problem mentions insertion/deletion in DLL, printing forwards/backwards, or caching (LRU/MRU/frequency-based).

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Implement Doubly Linked List | GFG | 🟢 Easy | Amazon, Microsoft, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/insert-a-node-in-doubly-linked-list/1) |
| 2 | Insert a node in a doubly Linkedlist | GFG | 🟢 Easy | Amazon, Microsoft, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/insert-a-node-in-doubly-linked-list/1) |
| 3 | Delete a node from a doubly Linkedlist | GFG | 🟢 Easy | Amazon, Microsoft, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/delete-node-in-doubly-linked-list/1) |
| 4 | Reverse Doubly Linked List | GFG | 🟢 Easy | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/reverse-a-doubly-linked-list/1) |
| 5 | LRU Cache | LC 146 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/lru-cache/) · [GFG](https://www.geeksforgeeks.org/problems/lru-cache/1) |
| 6 | LFU Cache | LC 460 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/lfu-cache/description/) · [GFG](https://www.geeksforgeeks.org/problems/lfu-cache-1665050355/1) |

### Merge / Sort / Reorder

**Strategy:** Use DLL properties (prev/next) to efficiently merge, sort, reorder, flatten, or perform pointer-based checks.

**Identify when:** Problem involves multi-level DLL, sorting, alternating nodes, palindrome check, conversions, or pair sums.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Merge Two Sorted DLLs | GFG | 🟡 Medium | Google, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/merge-two-sorted-linked-lists/1) |
| 2 | Flatten Multilevel DLL | LC 430 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/description/) |
| 3 | Convert DLL to Binary Tree | GFG | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/binary-tree-to-dll/1) |

---

## HashMap

Key-value pair data structure for O(1) average time complexity lookups.

### Frequency Map / Counting

**Strategy:** Count elements to find majority, top-k frequent, or sort by frequency.

**Identify when:** Problem mentions frequency, duplicates, top-k, or counting occurrences.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Majority Element | LC 169 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/majority-element/) · [GFG](https://www.geeksforgeeks.org/problems/majority-element-1587115620/1) |
| 2 | Top K Frequent Elements | LC 347 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) · [GFG](https://www.geeksforgeeks.org/problems/top-k-frequent-elements-in-array/1) |
| 3 | Sort Characters By Frequency | LC 451 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/sort-characters-by-frequency/) · [GFG](https://www.geeksforgeeks.org/problems/sort-string-according-to-increasing-frequency/1) |
| 4 | Task Scheduler (frequency-based greedy) | LC 621 | 🟡 Medium | Amazon, Microsoft, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/task-scheduler/1) |

### Prefix-Sum with Map

**Strategy:** Track cumulative sums; map stores first occurrence → solve subarray sum problems.

**Identify when:** Problem involves subarray sums, cumulative sums, or “sum equals K”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Subarray Sum Equals K | LC 560 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/subarray-sum-equals-k/) · [GFG](https://www.geeksforgeeks.org/problems/subarrays-with-sum-k/1) · [YouTube](https://www.youtube.com/watch?v=d2wUDNz_6iA&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=5) |
| 2 | Continuous Subarray Sum | LC 523 | 🟡 Medium | Google, Zomato, Morgan Stanley | [LeetCode](https://leetcode.com/problems/continuous-subarray-sum/) · [GFG](https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1) · [YouTube](https://www.youtube.com/watch?v=1EToqmJBNjY&list=PLvNVexrplJJzc0FYDK1M7feNLJVSCV-cL&index=2) |
| 3 | Subarray Sums Divisible by K | LC 974 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/subarray-sums-divisible-by-k/) · [GFG](https://www.geeksforgeeks.org/problems/sub-array-sum-divisible-by-k2617/1) · [YouTube](https://youtu.be/7IJdLmNJaSA?si=C0kzObuVWbuQvV4J) |
| 4 | Count Subarrays with Sum K | GFG | 🟡 Medium | Amazon, Microsoft, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/subarrays-with-sum-k/1) |

### Sliding Window + HashMap

**Strategy:** Maintain counts in a moving window → expand/shrink → track longest/shortest satisfying condition.

**Identify when:** Problem mentions substring/window with constraints on counts or distinct elements.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Longest Substring Without Repeating Characters | LC 3 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/longest-substring-without-repeating-characters/) · [GFG](https://www.geeksforgeeks.org/problems/longest-distinct-characters-in-string5848/1) · [YouTube](https://youtu.be/92dMI4paQY4) |
| 2 | Find All Anagrams in a String | LC 438 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/find-all-anagrams-in-a-string/) · [GFG](https://www.geeksforgeeks.org/problems/count-occurences-of-anagrams5839/1) · [YouTube](https://youtu.be/bK1z7nWoIwE) |
| 3 | Minimum Window Substring | LC 76 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/minimum-window-substring/) · [GFG](https://www.geeksforgeeks.org/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string-1587115621/1) · [YouTube](https://youtu.be/9w9xip122n8) |
| 4 | Fruit Into Baskets | LC 904 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/fruit-into-baskets/) · [GFG](https://www.geeksforgeeks.org/problems/fruit-into-baskets-1663137462/1) |
| 5 | Longest Substring with At Most K Distinct Characters | LC 340 | 🟡 Medium | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/longest-k-unique-characters-substring0853/1) · [YouTube](https://youtu.be/Gsz_bGhI6v4) |

---

## Tree

Hierarchical data structure with a root value and subtrees of children.

### DFS Traversals

**Strategy:** Standard DFS → used for max depth, path sums, subtree calculations.

**Identify when:** Problem mentions “visit all nodes recursively, max depth/path/subtree sum.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Inorder Traversal | LC 94 | 🟢 Easy | Amazon, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/binary-tree-inorder-traversal/description/) · [GFG](https://www.geeksforgeeks.org/problems/inorder-traversal/1) |
| 2 | Preorder Traversal | LC 144 | 🟢 Easy | Flipkart, Paytm, Zomato | [LeetCode](https://leetcode.com/problems/binary-tree-preorder-traversal/description/) · [GFG](https://www.geeksforgeeks.org/problems/preorder-traversal/1) |
| 3 | Postorder Traversal | LC 145 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/binary-tree-postorder-traversal/description/) · [GFG](https://www.geeksforgeeks.org/problems/postorder-traversal/1) |
| 4 | Same Tree Check (DFS variant) | LC 100 | 🟢 Easy | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/same-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/determine-if-two-trees-are-identical/1) |
| 5 | Diameter of Binary Tree | LC 543 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/diameter-of-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/diameter-of-binary-tree/1) |
| 6 | Maximum Depth of Binary Tree | LC 104 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/maximum-depth-of-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/height-of-binary-tree/1) |
| 7 | Path Sum | LC 112 | 🟢 Easy | Flipkart, PhonePe | [LeetCode](https://leetcode.com/problems/path-sum/) · [GFG](https://www.geeksforgeeks.org/problems/root-to-leaf-path-sum/1) |
| 8 | Binary Tree Maximum Path Sum | LC 124 | 🔴 Hard | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/binary-tree-maximum-path-sum/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-path-sum-from-any-node/1) |
| 9 | Check if Nodes are Cousins | LC 993 | 🟡 Medium | Amazon, Google | [LeetCode](https://leetcode.com/problems/cousins-in-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/check-if-two-nodes-are-cousins/1) |
| 10 | Minimum Height of a Binary Tree | LC 111 | 🟢 Easy | Microsoft, Flipkart | [LeetCode](https://leetcode.com/problems/minimum-depth-of-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-depth-of-a-binary-tree/1) |
| 11 | Print All Nodes at Distance K | LC 863 | 🟡 Medium | Amazon, Google | [LeetCode](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/nodes-at-given-distance-in-binary-tree/1) |
| 12 | Boundary Traversal of a Binary Tree | GFG | 🟡 Medium | Microsoft, Amazon | [GFG](https://www.geeksforgeeks.org/problems/boundary-traversal-of-binary-tree/1) |
| 13 | Vertical Order Traversal | LC 314 | 🟡 Medium | Google, Microsoft | [LeetCode](https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/print-a-binary-tree-in-vertical-order/1) |
| 14 | Top View of a Binary Tree | GFG | 🟡 Medium | Microsoft, Amazon | [GFG](https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1) |
| 15 | Binary Tree Cameras | LC 968 | 🔴 Hard | Google, Facebook | [LeetCode](https://leetcode.com/problems/binary-tree-cameras/description/) |

### BFS / Level-Order

**Strategy:** Use queue → traverse level by level → calculate sums, averages, or side views.

**Identify when:** Problem mentions “level-order, breadth-first, zigzag, right-side view, or level sum/average.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Binary Tree Level Order Traversal | LC 102 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/binary-tree-level-order-traversal/) · [GFG](https://www.geeksforgeeks.org/problems/level-order-traversal/1) |
| 2 | Binary Tree Zigzag Level Order Traversal | LC 103 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/) · [GFG](https://www.geeksforgeeks.org/problems/zigzag-tree-traversal/1) |
| 3 | Binary Tree Right Side View | LC 199 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/binary-tree-right-side-view/) · [GFG](https://www.geeksforgeeks.org/problems/right-view-of-binary-tree/1) |
| 4 | Minimum Depth of Binary Tree | LC 111 | 🟢 Easy | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/minimum-depth-of-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-depth-of-a-binary-tree/1) |
| 5 | Average of Levels in Binary Tree | LC 637 | 🟢 Easy | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/average-of-levels-in-binary-tree/) |
| 6 | Populating Next Right Pointers in Each Node | LC 116 | 🟡 Medium | Amazon, Microsoft, Flipkart | [LeetCode](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/) · [GFG](https://www.geeksforgeeks.org/connect-nodes-at-same-level/) |
| 7 | Cousins in Binary Tree | LC 993 | 🟢 Easy | Amazon, Google, Adobe | [LeetCode](https://leetcode.com/problems/cousins-in-binary-tree/) · [GFG](https://www.geeksforgeeks.org/check-two-nodes-cousins-binary-tree/) |

### Lowest Common Ancestor

**Strategy:** DFS recursion or parent-pointer mapping → find common ancestor efficiently.

**Identify when:** Problem mentions “find common ancestor, distance between nodes, or lowest node covering two nodes.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Lowest Common Ancestor of Binary Tree | LC 236 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/lowest-common-ancestor-in-a-binary-tree/1) |
| 2 | Find Distance Between Nodes | LC 1740 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/min-distance-between-two-given-nodes-of-a-binary-tree/1) |
| 3 | Distance Between Two Nodes in a Tree | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/min-distance-between-two-given-nodes-of-a-binary-tree/1) |
| 4 | Kth Ancestor of a Tree Node | LC 1483 | 🔴 Hard | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/kth-ancestor-of-a-tree-node/) |

### Serialization / Construction

**Strategy:** Preorder / level-order encode-decode → reconstruct tree or flatten.

**Identify when:** Problem mentions “serialize tree, flatten tree to list, next pointers, or reconstruct tree.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Serialize and Deserialize Binary Tree | LC 297 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/serialize-and-deserialize-a-binary-tree/1) |
| 2 | Flatten Binary Tree to Linked List | LC 114 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/) · [GFG](https://www.geeksforgeeks.org/problems/flatten-binary-tree-to-linked-list/1) |
| 3 | Populating Next Right Pointers | LC 116 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/populating-next-right-pointers-in-each-node/description/) · [GFG](https://www.geeksforgeeks.org/problems/connect-nodes-at-same-level/1) |
| 4 | Invert Binary Tree | LC 226 | 🟢 Easy | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/invert-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/mirror-tree/1) |
| 5 | Construct Binary Tree from Preorder & Inorder | LC 105 | 🟡 Medium | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/description/) · [GFG](https://www.geeksforgeeks.org/problems/construct-tree-1/1) |

---

## Binary Search Tree

Tree data structure where left child < root < right child.

### BST Operations

**Strategy:** Leverage BST property (left < root < right) for search, insertion, deletion, and range queries.

**Identify when:** Problem mentions “BST operations, validate BST, insert/delete nodes, or sum/range queries.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Convert Sorted Array to BST | LC 108 | 🟢 Easy | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/) · [GFG](https://www.geeksforgeeks.org/problems/array-to-bst4443/1) |
| 2 | Search in a BST | LC 700 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/search-in-a-binary-search-tree/) · [GFG](https://www.geeksforgeeks.org/problems/search-a-node-in-bst/1) |
| 3 | Insert into a BST | LC 701 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/insert-into-a-binary-search-tree/) · [GFG](https://www.geeksforgeeks.org/problems/insert-a-node-in-a-bst/1) |
| 4 | Validate Binary Search Tree | LC 98 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/validate-binary-search-tree/) · [GFG](https://www.geeksforgeeks.org/problems/check-for-bst/1) |
| 5 | Delete Node in a BST | LC 450 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/delete-node-in-a-bst/description/) · [GFG](https://www.geeksforgeeks.org/problems/delete-a-node-from-bst/1) |
| 6 | Recover BST | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/recover-binary-search-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/fixed-two-nodes-of-a-bst/1) |
| 7 | Merge 2 BST | GFG | 🟡 Medium | Microsoft, Facebook, Amazon | [LeetCode](https://leetcode.com/problems/merge-bsts-to-create-single-bst/description/) · [GFG](https://www.geeksforgeeks.org/problems/merge-two-bst-s/1) |
| 8 | Maximum sum BST in binary Tree | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/description/) |
| 9 | Kth Smallest Element in BST | LC 230 | 🟡 Medium | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) · [GFG](https://www.geeksforgeeks.org/find-k-th-smallest-element-in-bst-order-statistics-in-bst/) |

### LCA & Range Queries

**Strategy:** Use BST property → traverse from root to find split point → LCA.

**Identify when:** Problem mentions “find lowest common ancestor in BST, nodes guaranteed to exist, exploit BST order.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Lowest Common Ancestor of BST | LC 235 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) · [GFG](https://www.geeksforgeeks.org/problems/lowest-common-ancestor-in-a-bst/1) |
| 2 | Closest Binary Search Tree Value | LC 270 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/closest-binary-search-tree-value/) · [GFG](https://www.geeksforgeeks.org/problems/find-the-closest-element-in-bst/1) |
| 3 | Closest Leaf in BST | LC 742 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [GFG](https://www.geeksforgeeks.org/problems/find-the-closest-element-in-bst/1) |

---

## Graph

Non-linear data structure consisting of nodes and edges.

### BFS (Unweighted Path)

**Strategy:** Standard BFS → track distance/levels → queue-based traversal → multi-source if needed.

**Identify when:** Problem mentions “shortest path, level-order traversal, or unweighted distance”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | 01 Matrix | LC 542 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/01-matrix/) · [GFG](https://www.geeksforgeeks.org/problems/distance-of-nearest-cell-having-1-1587115620/1) |
| 2 | Word Ladder | LC 127 | 🔴 Hard | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/word-ladder/) · [GFG](https://www.geeksforgeeks.org/problems/word-ladder/1) |
| 3 | Clone Graph | LC 133 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/clone-graph/) · [GFG](https://www.geeksforgeeks.org/problems/clone-graph/1) |
| 4 | Rotting Oranges | LC 994 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/rotting-oranges/) · [GFG](https://www.geeksforgeeks.org/problems/rotten-oranges2536/1) |
| 5 | Shortest Path in Binary Matrix | LC 1091 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/shortest-path-in-binary-matrix/) · [GFG](https://www.geeksforgeeks.org/problems/shortest-path-in-a-binary-maze-1655453161/1) |
| 6 | Walls and Gates | LC 286 | 🟡 Medium | Amazon, Microsoft, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/reducing-walls4443/1) |

### DFS (Connectivity)

**Strategy:** DFS recursion or stack → track visited → identify connected components or detect cycles.

**Identify when:** Problem mentions “connected components, islands, cycles, safe states, bipartite check, bridges, articulation points, or connectivity check”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Number of Islands | LC 200 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/number-of-islands/) · [GFG](https://www.geeksforgeeks.org/problems/find-the-number-of-islands/1) |
| 2 | All paths from source to target | LC 797 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/all-paths-from-source-to-target/description/) · [GFG](https://www.geeksforgeeks.org/problems/possible-paths-between-2-vertices-1587115620/1) |
| 3 | Flood Fill | LC 733 | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/flood-fill/description/) · [GFG](https://www.geeksforgeeks.org/problems/flood-fill-algorithm1856/1) |
| 4 | Find Eventual Safe States | LC 802 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/find-eventual-safe-states/) · [GFG](https://www.geeksforgeeks.org/problems/eventual-safe-states/1) |
| 5 | Count Components in Graph | LC 323 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/number-of-provinces/description/) · [GFG](https://www.geeksforgeeks.org/problems/connected-components-in-an-undirected-graph/1) |
| 6 | Surrounded Regions | LC 130 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/surrounded-regions/) · [GFG](https://www.geeksforgeeks.org/problems/replace-os-with-xs0052/1) |
| 7 | Is Graph Bipartite | LC 785 | 🟡 Medium | Amazon, Google, Adobe | [LeetCode](https://leetcode.com/problems/is-graph-bipartite/description/) · [GFG](https://www.geeksforgeeks.org/problems/bipartite-graph/1) |
| 8 | Directed Cycle Detection | GFG | 🟡 Medium | Amazon, Microsoft, Paytm | [GFG](https://www.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1) |
| 9 | Undirected Cycle Detection | GFG | 🟡 Medium | Google, Flipkart, Ola | [GFG](https://www.geeksforgeeks.org/problems/detect-cycle-in-an-undirected-graph/1) |
| 10 | Longest Cycle in a Graph | LC 2360 | 🔴 Hard | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/longest-cycle-in-a-graph/description/) · [GFG](https://www.geeksforgeeks.org/problems/length-of-longest-cycle-in-a-graph/1) |
| 11 | Articulation Points | GFG | 🔴 Hard | Amazon, Google | [GFG](https://www.geeksforgeeks.org/problems/articulation-point-1/1) |
| 12 | Bridges in Graph / Critical Connections | LC 1192 | 🔴 Hard | Amazon, Facebook, Google | [LeetCode](https://leetcode.com/problems/critical-connections-in-a-network/description/) · [GFG](https://www.geeksforgeeks.org/problems/bridge-edge-in-graph/1) |

### Topological Sort

**Strategy:** DFS postorder or BFS (Kahn’s algorithm) → order nodes respecting dependencies.

**Identify when:** Problem mentions “ordering tasks, course prerequisites, dependency chains, build order, or cycle in directed graph”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Task Scheduling with Dependencies | LC 2050 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/task-scheduler/description/) · [GFG](https://www.geeksforgeeks.org/problems/prerequisite-tasks/1) |
| 2 | Course Schedule | LC 207 | 🟡 Medium | Amazon, Google, Facebook | [LeetCode](https://leetcode.com/problems/course-schedule/description/) · [GFG](https://www.geeksforgeeks.org/problems/course-schedule-i/1) |
| 3 | Course Schedule II | LC 210 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/course-schedule-ii/) · [GFG](https://www.geeksforgeeks.org/problems/course-schedule/1) |
| 4 | Find Eventual Safe States | LC 802 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/find-eventual-safe-states/description/) · [GFG](https://www.geeksforgeeks.org/problems/eventual-safe-states/1) |
| 5 | Alien Dictionary | LC 269 | 🔴 Hard | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/alien-dictionary/) · [GFG](https://www.geeksforgeeks.org/problems/alien-dictionary/1) |
| 6 | Cycle Detection in Directed Graph | GFG | 🟡 Medium | Amazon, Microsoft, Paytm | [GFG](https://www.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1) |
| 7 | Reconstruct Itinerary | LC 332 | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/reconstruct-itinerary/description/) · [GFG](https://www.geeksforgeeks.org/dsa/find-itinerary-from-a-given-list-of-tickets/) |

### MST / Union-Find

**Strategy:** Use Kruskal’s / Prim’s algorithm or Union-Find → find MST, minimum cost connections, or detect cycles.

**Identify when:** Problem mentions “minimum cost to connect all nodes, redundant connections, union-find required”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Minimum spanning Tree | GFG | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/minimum-spanning-tree/1) |
| 2 | Kruskal’s algorithm | GFG | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/minimum-spanning-tree-kruskals-algorithm/1) |
| 3 | Lexicographically Smallest Equivalent String | LC 1135 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/lexicographically-smallest-equivalent-string/description/) · [GFG](https://www.geeksforgeeks.org/problems/mila-and-strings0435/1) |
| 4 | Number of Connected Components in Graph | LC 323 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/count-the-number-of-complete-components/description/) · [GFG](https://www.geeksforgeeks.org/problems/connected-components-in-an-undirected-graph/1) |
| 5 | Redundant Connection | LC 684 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/redundant-connection/) · [GFG](https://www.geeksforgeeks.org/problems/disjoint-set-union-find/1) |
| 6 | Connecting Cities With Minimum Cost | GFG | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/min-cost-to-connect-all-points/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-to-connect-all-houses-in-a-city/1) |
| 7 | Accounts Merge | GFG | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/accounts-merge/description/) · [GFG](https://www.geeksforgeeks.org/problems/account-merge/1) |

### Dijkstra (Weighted)

**Strategy:** Use priority queue → relax edges → track shortest distances.

**Identify when:** Problem mentions “weighted edges, shortest path, or minimum distance in weighted graph”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Dijkstra Implementation | GFG | 🟡 Medium | Google, Apple, Zomato | [GFG](https://www.geeksforgeeks.org/problems/implementing-dijkstra-set-1-adjacency-matrix/1) |
| 2 | Shortest Path in Weighted Graph | GFG | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/shortest-path-visiting-all-nodes/description/) · [GFG](https://www.geeksforgeeks.org/problems/shortest-path-in-weighted-undirected-graph/1) |
| 3 | Minimum Cost Path in Grid | GFG | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/minimum-path-cost-in-a-grid/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-path3833/1) |
| 4 | Network Delay Time | LC 743 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/network-delay-time/) · [GFG](https://www.geeksforgeeks.org/problems/network-delay-time/1) |
| 5 | Cheapest Flights Within K Stops | LC 787 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/cheapest-flights-within-k-stops/) · [GFG](https://www.geeksforgeeks.org/problems/cheapest-flights-within-k-stops/1) |
| 6 | Swim in Rising Water | LC 778 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/swim-in-rising-water/description/) |
| 7 | Path With Minimum Effort | LC 1631 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/path-with-minimum-effort/) · [GFG](https://www.geeksforgeeks.org/problems/path-with-minimum-effort/1) |

### Bellman-Ford

**Strategy:** Relax all edges V-1 times → detect negative cycles.

**Identify when:** Problem mentions “negative weights, cycles, or cost minimization with negative edges”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Negative Weight Cycle Detection | GFG | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/negative-weight-cycle3504/1) |
| 2 | Cheapest Flights Within K Stops (Bellman-Ford variant) | LC 787 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/cheapest-flights-within-k-stops/description/) · [GFG](https://www.geeksforgeeks.org/problems/cheapest-flights-within-k-stops/1) |
| 3 | Find the City With the Smallest Number of Neighbors at a Threshold Distance | GFG | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/description/) |

### Floyd-Warshall

**Strategy:** DP over adjacency matrix → shortest paths between all pairs of nodes.

**Identify when:** Problem mentions “all-pairs shortest paths, matrix, or city connectivity between any two nodes”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Transitive Closure | LC 553 | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/transitive-closure-of-a-graph/1) |
| 2 | All-Pairs Shortest Path | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/implementing-floyd-warshall2042/1) |
| 3 | Detect Negative Cycle Using Floyd-Warshall | GFG | 🟡 Medium | Amazon, Microsoft, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/negative-weight-cycle3504/1) |

---

## Heap

Priority Queue data structure for efficient retrieval of highest/lowest priority elements.

### Top-K Elements

**Strategy:** Use min-heap for top-k largest, max-heap for top-k smallest → maintain heap of size k.

**Identify when:** Problem mentions top k, kth largest/smallest, median, or maintaining running extremes.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | K Frequent Words | GFG | 🟡 Medium | Google, PayPal, Zomato | [LeetCode](https://leetcode.com/problems/top-k-frequent-words/description/) · [GFG](https://www.geeksforgeeks.org/problems/word-with-maximum-frequency0120/1) |
| 2 | Sort characters by frequency | GFG | 🟡 Medium | Google, PayPal, Zomato | [LeetCode](https://leetcode.com/problems/sort-characters-by-frequency/description/) · [GFG](https://www.geeksforgeeks.org/problems/sort-string-according-to-increasing-frequency/1) |
| 3 | Kth Largest Element in an Array | LC 215 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/kth-largest-element-in-an-array/description/) · [GFG](https://www.geeksforgeeks.org/problems/kth-largest-element5034/1) |
| 4 | Top K Frequent Elements | LC 347 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) · [GFG](https://www.geeksforgeeks.org/problems/top-k-frequent-elements-in-array/1) |
| 5 | Find Median from Data Stream | LC 295 | 🔴 Hard | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/find-median-from-data-stream/) · [GFG](https://www.geeksforgeeks.org/problems/find-median-in-a-stream-1587115620/1) |
| 6 | Minimum Cost to Connect Ropes | LC 1167 | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-of-ropes-1587115620/1) |

### Merge K Sorted

**Strategy:** Use min-heap to merge multiple sorted arrays/lists efficiently.

**Identify when:** Problem mentions merging sorted arrays/lists or finding K smallest/largest pairs across arrays.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Merge K Sorted Lists | LC 23 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/merge-k-sorted-lists/) · [GFG](https://www.geeksforgeeks.org/problems/merge-k-sorted-linked-lists/1) |
| 2 | Find K Pairs with Smallest Sums | LC 373 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/) · [GFG](https://www.geeksforgeeks.org/problems/find-k-smallest-sum-pairs/1) |
| 3 | Smallest Range Covering Elements from K Lists | LC 632 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/) · [GFG](https://www.geeksforgeeks.org/problems/find-smallest-range-containing-elements-from-k-lists/1) |

### Heap with Sliding Window

**Strategy:** Maintain a heap of elements in the window → pop outdated elements → track maximum.

**Identify when:** Problem mentions sliding window maximum/minimum or frequency-based window queries.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Sliding Window Maximum | LC 239 | 🔴 Hard | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/sliding-window-maximum/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-of-all-subarrays-of-size-k3101/1) · [YouTube](https://www.youtube.com/watch?v=e8iJPXS64MY&list=PLvNVexrplJJyQTJ7a6sx3MzZjq1cR2geB&index=9) |
| 2 | Task Scheduler | LC 621 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/task-scheduler/) · [GFG](https://www.geeksforgeeks.org/problems/task-scheduler/1) |
| 3 | Sliding Window Median | LC 480 | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/sliding-window-median/) · [GFG](https://www.geeksforgeeks.org/problems/find-the-median0527/1) |

### Implementation of Heap

**Strategy:** Design heap.

**Identify when:** Design Priority Queue

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Implement priority queue | GFG | 🟢 Easy | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/operations-on-priorityqueue/1) |
| 2 | Implement min heap | GFG | 🟡 Medium | Amazon, Adobe, Sumo Logic | [GFG](https://www.geeksforgeeks.org/problems/min-heap-implementation/1) |
| 3 | Implement max heap | GFG | 🟡 Medium | Myntra, Apple, Zomato | [GFG](https://www.geeksforgeeks.org/problems/max-heap-implementation/1) |

### Huffman pattern

**Strategy:** Repeatedly combine the two smallest elements to minimize the total cost..

**Identify when:** Repeatedly combine the two smallest elements to minimize the total cost.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Minimum Cost to Connect Sticks | LC 1584 | 🟢 Easy | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/min-cost-to-connect-all-points/description/) |
| 2 | Minimum Cost of Ropes | GFG | 🟡 Medium | Amazon, Adobe, Sumo Logic | [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-of-ropes-1587115620/1) |
| 3 | Merge Files with Minimum Cost | GFG | 🟡 Medium | Myntra, Apple, Zomato | [GFG](https://www.geeksforgeeks.org/problems/optimal-file-merge/1) |
| 4 | Combine Cards / Numbers with Minimum Cost | LC 1000 | 🟡 Medium | Myntra, Apple, Zomato | [LeetCode](https://leetcode.com/problems/minimum-cost-to-merge-stones/description/) |
| 5 | Reorganize String | LC 767 | 🟡 Medium | Myntra, Apple, Zomato | [LeetCode](https://leetcode.com/problems/reorganize-string/description/) · [GFG](https://www.geeksforgeeks.org/problems/rearrange-characters4649/1) |

---

## Backtracking

Algorithmic technique for solving problems recursively by trying to build a solution incrementally.

### Choice-Based Backtracking

**Strategy:** It is commonly used in problems that ask to generate all possible combinations, subsets, or permutations.

**Identify when:** This approach forms a recursion tree and is the backbone of backtracking problems.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Subsets | LC 78 | 🟡 Medium | Meta, Microsoft, Amazon | [LeetCode](https://leetcode.com/problems/subsets/description/) · [GFG](https://www.geeksforgeeks.org/problems/subsets-1613027340/1) |
| 2 | Subsets II | LC 90 | 🟡 Medium | Amazon, Adobe | [LeetCode](https://leetcode.com/problems/subsets-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/subsets-1587115621/1) |
| 3 | Combination Sum | LC 39 | 🟡 Medium | Google, Amazon, Facebook | [LeetCode](https://leetcode.com/problems/combination-sum/description/) · [GFG](https://www.geeksforgeeks.org/problems/combination-sum-1587115620/1) |
| 4 | Combination Sum II | LC 40 | 🟡 Medium | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/combination-sum-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/combination-sum-ii-1664263832/1) |
| 5 | Permutations | LC 46 | 🟡 Medium | Google, Uber | [LeetCode](https://leetcode.com/problems/permutations/description/) · [GFG](https://www.geeksforgeeks.org/problems/permutations-of-a-given-string2041/1) |
| 6 | Permutations II | LC 47 | 🟡 Medium | Amazon, Adobe | [LeetCode](https://leetcode.com/problems/permutations-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/all-unique-permutations-of-an-array/1) |
| 7 | Generate Parentheses | LC 22 | 🟡 Medium | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/generate-parentheses/description/) · [GFG](https://www.geeksforgeeks.org/problems/generate-all-possible-parentheses/1) |
| 8 | Palindrome Partitioning | LC 131 | 🟡 Medium | Google, Apple | [LeetCode](https://leetcode.com/problems/palindrome-partitioning/) · [GFG](https://www.geeksforgeeks.org/problems/palindromic-patitioning4845/1) |
| 9 | Restore IP Addresses | LC 93 | 🟡 Medium | Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/restore-ip-addresses/) · [GFG](https://www.geeksforgeeks.org/problems/generate-ip-addresses/1) |

### Constraint-Based Backtracking

**Strategy:** At each step, choose whether to include an element → explore all subsets/choices recursively.

**Identify when:** Problem mentions “generate all subsets, combinations, parentheses, letters from digits, or selection without rearranging order.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | N-Queens | LC 51 | 🔴 Hard | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/n-queens/description/) · [GFG](https://www.geeksforgeeks.org/problems/n-queen-problem0315/1) |
| 2 | N-Queens II | LC 52 | 🔴 Hard | Google, Amazon | [LeetCode](https://leetcode.com/problems/n-queens-ii/description/) |
| 3 | Graph Coloring (M-Coloring Problem) | GFG | 🟡 Medium | Google, Microsoft | [GFG](https://www.geeksforgeeks.org/problems/m-coloring-problem-1587115620/1) |
| 4 | Knight’s Tour | GFG | 🟡 Medium | Amazon, Microsoft | [GFG](https://www.geeksforgeeks.org/problems/knight-walk4521/1) |
| 5 | Partition to K Equal Sum Subsets | LC 698 | 🟡 Medium | LinkedIn, Google | [LeetCode](https://leetcode.com/problems/partition-to-k-equal-sum-subsets/) · [GFG](https://www.geeksforgeeks.org/problems/partition-array-to-k-subsets/1) |
| 6 | Matchsticks to Square | LC 473 | 🟡 Medium | Amazon, Apple, LinkedIn | [LeetCode](https://leetcode.com/problems/matchsticks-to-square/) · [GFG](https://www.geeksforgeeks.org/problems/partition-to-k-equal-sum-subsets/1) |

### Grid / Path Backtracking

**Strategy:** Move in grid recursively → explore all valid paths → backtrack after each move.

**Identify when:** Problem mentions “maze, grid, pathfinding, sudoku, word search in grid, Hamiltonian path, or max path gold.”

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Rat in a Maze | GFG | 🟡 Medium | Amazon, Microsoft | [GFG](https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1) |
| 2 | Sudoku Solver | LC 37 | 🔴 Hard | Uber, Google, Microsoft | [LeetCode](https://leetcode.com/problems/sudoku-solver/) · [GFG](https://www.geeksforgeeks.org/problems/solve-the-sudoku-1587115621/1) |
| 3 | Word Search II | LC 212 | 🔴 Hard | Microsoft, Amazon | [LeetCode](https://leetcode.com/problems/word-search-ii/) · [GFG](https://www.geeksforgeeks.org/problems/word-search-ii/1) |
| 4 | Unique Paths III | LC 980 | 🔴 Hard | Google, Apple | [LeetCode](https://leetcode.com/problems/unique-paths-iii/) |
| 5 | Path with Maximum Gold | LC 1219 | 🟡 Medium | Amazon, Google | [LeetCode](https://leetcode.com/problems/path-with-maximum-gold/) · [GFG](https://www.geeksforgeeks.org/problems/gold-mine-problem/1) |

### Decision Tree / Sequence Generation

**Strategy:** Generate sequences or strings recursively by making a choice at each step.

**Identify when:** Problems where you recursively build sequences, combinations of digits/letters, or expressions.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Letter Combinations of a Phone Number | LC 17 | 🟡 Medium | Google, Amazon | [LeetCode](https://leetcode.com/problems/letter-combinations-of-a-phone-number/description/) · [GFG](https://www.geeksforgeeks.org/problems/possible-words-from-phone-digits-1587115620/1) |
| 2 | Expression Add Operators | LC 282 | 🔴 Hard | Google, Facebook | [LeetCode](https://leetcode.com/problems/expression-add-operators/) · [GFG](https://www.geeksforgeeks.org/problems/expression-add-operators/1) |
| 3 | All possible Full binary Trees | LC 894 | 🟡 Medium | Google, Facebook, Amazon | [LeetCode](https://leetcode.com/problems/all-possible-full-binary-trees/description/) · [GFG](https://www.geeksforgeeks.org/problems/full-binary-tree/1) |
| 4 | Word Break 2 | LC 894 | 🔴 Hard | Google, Facebook, Amazon | [LeetCode](https://leetcode.com/problems/word-break-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/word-break-part-23249/1) |

---

## Greedy

Algorithm paradigm that follows the problem solving heuristic of making the locally optimal choice.

### Intervals & Reach

**Strategy:** Sort intervals or extend reach as far as possible from current position → maximize tasks done / minimize steps.

**Identify when:** Problem mentions “maximum non-overlapping intervals, tasks, meetings, jump to end, minimum steps, or cover intervals”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Merge Intervals | LC 435 | 🟡 Medium | Amazon, PhonePe, Goldman Sachs | [LeetCode](https://leetcode.com/problems/merge-intervals/description/) · [GFG](https://www.geeksforgeeks.org/problems/overlapping-intervals--170633/1) |
| 2 | Insert Interval | LC 435 | 🟡 Medium | Amazon, Adobe, Goldman Sachs | [LeetCode](https://leetcode.com/problems/insert-interval/) · [GFG](https://www.geeksforgeeks.org/problems/insert-interval-1666733333/1) |
| 3 | Non-overlapping Intervals | LC 435 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/non-overlapping-intervals/) · [GFG](https://www.geeksforgeeks.org/problems/non-overlapping-intervals/1) |
| 4 | Meeting Rooms II | LC 253 | 🟡 Medium | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/attend-all-meetings-ii/1) |
| 5 | Minimum Number of Arrows to Burst Balloons | LC 452 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/) · [GFG](https://www.geeksforgeeks.org/problems/hit-most-balloons--170637/1) |
| 6 | Activity Selection Problem | GFG | 🟢 Easy | Microsoft, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/activity-selection-1587115620/1) |
| 7 | Jump Game | LC 55 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/jump-game/) · [GFG](https://www.geeksforgeeks.org/problems/jump-game/1) |
| 8 | Jump Game II | LC 45 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/jump-game-ii/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-number-of-jumps-1587115620/1) |
| 9 | Minimum Number of Taps to Open to Water Garden | LC 1326 | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/minimum-number-of-taps-to-open-to-water-a-garden/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-number-of-sprinkler--170645/1) |
| 10 | Car Pooling / Capacity to Transport | LC 1094 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/car-pooling/) |

### Sorting / Local Choice

**Strategy:** Sort array or select elements → make locally optimal choice → achieve global optimum.

**Identify when:** Problem mentions “maximize/minimize sum, select elements optimally, assign/distribute resources, or custom order”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Largest Number | LC 179 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/largest-number/) · [GFG](https://www.geeksforgeeks.org/problems/largest-number-formed-from-an-array1117/1) |
| 2 | Fractional Knapsack | GFG | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [GFG](https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1) |
| 3 | Partition Labels | LC 763 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/partition-labels/) · [GFG](https://www.geeksforgeeks.org/problems/partition-the-array--170647/1) |
| 4 | Minimum Cost to Connect Sticks | LC 1167 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-of-ropes-1587115620/1) |
| 5 | Candy Distribution | LC 135 | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/candy/) · [GFG](https://www.geeksforgeeks.org/problems/candy/1) |
| 6 | Task Scheduler (frequency-based greedy) | LC 621 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/task-scheduler/) · [GFG](https://www.geeksforgeeks.org/problems/task-scheduler/1) |
| 7 | Minimum Platforms / Resource Allocation | GFG | 🟡 Medium | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1) |
| 8 | Maximum Units on a Truck | LC 1710 | 🟢 Easy | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/maximum-units-on-a-truck/) |
| 9 | Next Permutation | LC 31 | 🟡 Medium | Google, Facebook | [LeetCode](https://leetcode.com/problems/next-permutation/description/) · [GFG](https://www.geeksforgeeks.org/problems/next-permutation5226/1) |

---

## Dynamic Programming

Optimization method involving breaking down problems into simpler subproblems and storing their solutions.

### 1D / Linear DP

**Strategy:** Track optimal solution using a 1D array → sequences, sums, or counts.

**Identify when:** Problem mentions “subarrays, sequences, max/min sum/product, or linear decisions”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Climbing Stairs | LC 70 | 🟢 Easy | Amazon, Adobe, Goldman Sachs | [LeetCode](https://leetcode.com/problems/climbing-stairs/) · [GFG](https://www.geeksforgeeks.org/problems/count-ways-to-reach-the-nth-stair-1587115620/1) · [YouTube](https://youtu.be/Z27GTaBEiMg?si=SMDB8BYTXkZk7G2p) |
| 2 | House Robber | LC 198 | 🟡 Medium | Amazon, Walmart, PayPal | [LeetCode](https://leetcode.com/problems/house-robber/) · [GFG](https://www.geeksforgeeks.org/problems/stickler-theif-1587115621/1) |
| 3 | Maximum Subarray | LC 53 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/maximum-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1) · [YouTube](https://www.youtube.com/watch?v=CU_TwNzuttQ&list=PLvNVexrplJJy-eQ3PNGlfRN2IvC9VE_Zz&index=22) |
| 4 | Maximum Product Subarray | LC 152 | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/maximum-product-subarray/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-product-subarray3604/1) · [YouTube](https://www.youtube.com/watch?v=JjxEFeNdOoE&list=PLvNVexrplJJy-eQ3PNGlfRN2IvC9VE_Zz&index=23) |
| 5 | Decode Ways | LC 91 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/decode-ways/) · [GFG](https://www.geeksforgeeks.org/problems/total-decoding-messages1235/1) |

### 2D / Grid DP

**Strategy:** Use 2D array → track states for row/column → movement or path constraints.

**Identify when:** Problem mentions “grids, movement from start to end, paths, or matrix-based sums”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Unique Paths | LC 62 | 🟡 Medium | Google, Uber, Flipkart | [LeetCode](https://leetcode.com/problems/unique-paths/) · [GFG](https://www.geeksforgeeks.org/problems/number-of-unique-paths5339/1) · [YouTube](https://youtu.be/NA4E0QQdTOk?si=tzUU5ismfzX4CCxn) |
| 2 | Unique Paths 2 | LC 63 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/unique-paths-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/grid-path-2/0) |
| 3 | Minimum Path Sum | LC 64 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/minimum-path-sum/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-path3833/1) |
| 4 | Dungeon Game | LC 174 | 🔴 Hard | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/dungeon-game/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-points-to-reach-destination0540/1) |
| 5 | Cherry Pickup | LC 741 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/cherry-pickup/) · [GFG](https://www.geeksforgeeks.org/problems/chocolates-pickup/1) |
| 6 | Maximum Path Sum in Grid | GFG | 🟡 Medium | Google, Apple, Zomato | [GFG](https://www.geeksforgeeks.org/problems/path-in-matrix3805/1) |
| 7 | Minimum Falling Path Sum | LC 931 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/minimum-falling-path-sum/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-sum-in-a-falling-path/0) |
| 8 | Running Sum 2D Array | GFG | 🟢 Easy | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/range-sum-query-2d-immutable/description/) · [GFG](https://www.geeksforgeeks.org/problems/prefix-sum-of-matrix-or-2d-array/1) |

### DP on Strings

**Strategy:** Use 2D DP → index i,j represent substrings/subsequences → solve LCS, palindrome, or edit distance.

**Identify when:** Problem mentions “subsequence, substring, longest common, palindrome, or string edit operations”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Longest Common Subsequence | LC 1143 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/longest-common-subsequence/) · [GFG](https://www.geeksforgeeks.org/problems/longest-common-subsequence-1587115620/1) |
| 2 | Longest Palindromic Subsequence | LC 516 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/longest-palindromic-subsequence/) · [GFG](https://www.geeksforgeeks.org/problems/longest-palindromic-subsequence-1612327878/1) |
| 3 | Minimum Insertions to Make String Palindrome | LC 1312 | 🟡 Medium | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/minimum-insertion-steps-to-make-a-string-palindrome/description/) · [GFG](https://www.geeksforgeeks.org/problems/form-a-palindrome1455/1) |
| 4 | Minimum Number of Insertions and Deletions | LC 583 | 🟡 Medium | Amazon, Adobe, Flipkart | [LeetCode](https://leetcode.com/problems/delete-operation-for-two-strings/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-number-of-deletions-and-insertions0209/1) |
| 5 | Edit Distance | LC 72 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/edit-distance/) · [GFG](https://www.geeksforgeeks.org/problems/edit-distance3702/1) |
| 6 | Regular Expression Matching | LC 10 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/regular-expression-matching/) · [GFG](https://www.geeksforgeeks.org/problems/wildcard-pattern-matching/1) |
| 7 | Distinct Subsequences | LC 115 | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/distinct-subsequences/) · [GFG](https://www.geeksforgeeks.org/problems/distinct-occurrences/1) |
| 8 | Palindrome Partitioning II | LC 132 | 🔴 Hard | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/palindrome-partitioning-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/palindromic-patitioning4845/1) |
| 9 | Shortest Common Supersequence | LC 1092 | 🟡 Medium | Google, Facebook, Microsoft | [LeetCode](https://leetcode.com/problems/shortest-common-supersequence/description/) · [GFG](https://www.geeksforgeeks.org/problems/shortest-common-supersequence0322/1) |
| 10 | Scramble String | LC 87 | 🔴 Hard | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/scramble-string/description/) · [GFG](https://www.geeksforgeeks.org/problems/scrambled-string/1) |

### DP on Intervals

**Strategy:** Track optimal solutions for subarrays/intervals → matrix chain, merging, or balloon burst patterns.

**Identify when:** Problem mentions “intervals, subarray partitions, merging cost, or burst balloons”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Matrix Chain Multiplication (MCM) | GFG | 🟡 Medium | Microsoft, Amazon, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1) |
| 2 | Burst Balloons | LC 312 | 🔴 Hard | Google, Flipkart, PhonePe | [LeetCode](https://leetcode.com/problems/burst-balloons/) · [GFG](https://www.geeksforgeeks.org/problems/burst-balloons/1) |
| 3 | Minimum Cost to Merge Stones | LC 1000 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/minimum-cost-to-merge-stones/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-to-merge-stones/1) |
| 4 | Min cost to cut a stick | GFG | 🔴 Hard | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/minimum-cost-to-cut-a-stick/description/) · [GFG](https://www.geeksforgeeks.org/problems/minimum-cost-to-cut-a-stick-of-length-n/1) |
| 5 | Merge Intervals with Cost | GFG | 🟡 Medium | Amazon, Microsoft, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1) |
| 6 | Evaluate Expression to True (Boolean Parenthesization) | GFG | 🔴 Hard | Flipkart, Paytm, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/boolean-parenthesization5610/1) |

### DP on Trees / DAGs

**Strategy:** Recursion + memoization → track states along tree paths → post-order traversal.

**Identify when:** Problem mentions “trees, DAGs, path sums, node coverage, or ways to traverse dependent nodes”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Diameter of Binary Tree | GFG | 🟡 Medium | Google, Apple, Zomato | [LeetCode](https://leetcode.com/problems/diameter-of-binary-tree/description/) · [GFG](https://www.geeksforgeeks.org/problems/diameter-of-binary-tree/1) |
| 2 | House Robber III | LC 337 | 🟡 Medium | Amazon, Google, Goldman Sachs | [LeetCode](https://leetcode.com/problems/house-robber-iii/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-sum-of-non-adjacent-nodes/1) |
| 3 | Binary Tree Maximum Path Sum | LC 124 | 🔴 Hard | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/binary-tree-maximum-path-sum/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-path-sum-from-any-node/1) |
| 4 | Maximum Sum BST in Binary Tree | LC 1373 | 🔴 Hard | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/) · [GFG](https://www.geeksforgeeks.org/problems/largest-bst/1) |
| 5 | Binary Tree Cameras | LC 968 | 🔴 Hard | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/binary-tree-cameras/) · [GFG](https://www.geeksforgeeks.org/dsa/minimum-number-of-cameras-required-to-monitor-all-nodes-of-a-binary-tree/) |
| 6 | Path Sum III | LC 437 | 🟡 Medium | Amazon, Microsoft, PhonePe | [LeetCode](https://leetcode.com/problems/path-sum-iii/description/) · [GFG](https://www.geeksforgeeks.org/problems/k-sum-paths/1) |

### Knapsack / Subset Sum

**Strategy:** Track states based on weight/value → classic 0-1 / bounded / unbounded variants.

**Identify when:** Problem mentions “choose subset under constraints, maximize value, target sum, or weight limit”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | 0-1 Knapsack | GFG | 🟡 Medium | Amazon, Google, Goldman Sachs | [GFG](https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/) |
| 2 | Partition Equal Subset Sum | LC 416 | 🟡 Medium | Adobe, Flipkart, Paytm | [LeetCode](https://leetcode.com/problems/partition-equal-subset-sum/) · [GFG](https://www.geeksforgeeks.org/problems/subset-sum-problem2014/1) |
| 3 | Partition with given difference | LC 2035 | 🟡 Medium | Microsoft, Facebook, Morgan Stanley | [LeetCode](https://leetcode.com/problems/partition-array-into-two-arrays-to-minimize-sum-difference/description/) · [GFG](https://www.geeksforgeeks.org/problems/partitions-with-given-difference/1) |
| 4 | Coin Change | LC 322 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/coin-change/) · [GFG](https://www.geeksforgeeks.org/problems/number-of-coins1824/1) |
| 5 | Coin Change II | LC 322 | 🟡 Medium | Flipkart, Paytm, PhonePe | [LeetCode](https://leetcode.com/problems/coin-change-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/coin-change2448/1) |
| 6 | Target Sum | LC 494 | 🟡 Medium | Amazon, Adobe, Sumo Logic | [LeetCode](https://leetcode.com/problems/target-sum/) · [GFG](https://www.geeksforgeeks.org/problems/target-sum-1626326450/1) |
| 7 | Subset Sum | GFG | 🟡 Medium | Adobe, Flipkart, Paytm | [GFG](https://www.geeksforgeeks.org/problems/subset-sum-problem-1611555638/1) |
| 8 | Combination Sum IV | LC 377 | 🟡 Medium | Amazon, Microsoft, PhonePe | [GFG](https://www.geeksforgeeks.org/problems/4-combination-sum/1) |

### DP on Stocks

**Strategy:** State machine DP to track whether you are holding a stock or not.

**Identify when:** Problems involving buying and selling stocks to maximize profit with varying constraints.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Best Time to Buy and Sell Stock | LC 121 | 🟢 Easy | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) · [GFG](https://www.geeksforgeeks.org/problems/buy-maximum-stocks-if-i-stocks-can-be-bought-on-i-th-day/1) |
| 2 | Best Time to Buy and Sell Stock II | LC 122 | 🟡 Medium | Adobe, Amazon, Meta | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) |
| 3 | Best Time to Buy and Sell Stock III | LC 123 | 🔴 Hard | Google, Microsoft, Adobe | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/) |
| 4 | Best Time to Buy and Sell Stock IV | LC 188 | 🔴 Hard | Google, Amazon, Uber | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/) |
| 5 | Best Time to Buy and Sell Stock with Cooldown | LC 309 | 🟡 Medium | Google, Uber, Atlassian | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) |
| 6 | Best Time to Buy and Sell Stock with Transaction Fee | LC 714 | 🟡 Medium | Amazon, Goldman Sachs, PayPal | [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/) |

---

## Trie

Tree-based data structure used for efficiently storing and retrieving keys in a dataset of strings.

### Basic Trie Operations

**Strategy:** Build Trie → insert words → search full word or prefix efficiently → collect suggestions in lexicographic order.

**Identify when:** Problem mentions “dictionary, prefix search, word lookup, autocomplete, or predictive text”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Implement Trie (Prefix Tree) | LC 208 | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/implement-trie-prefix-tree/) · [GFG](https://www.geeksforgeeks.org/problems/trie-insert-and-search0651/1) |
| 2 | Add and Search Word | LC 211 | 🟡 Medium | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/add-and-search-word-data-structure-design/) · [GFG](https://www.geeksforgeeks.org/problems/design-add-and-search-words-data-structure--154618/1) |
| 3 | Longest common prefix  | LC 14 | 🟡 Medium | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/longest-common-prefix/description/) · [GFG](https://www.geeksforgeeks.org/problems/longest-common-prefix-in-an-array5129/1) |
| 4 | Longest word in dictionary | LC 720 | 🟡 Medium | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/longest-word-in-dictionary/description/) · [GFG](https://www.geeksforgeeks.org/problems/find-largest-word-in-dictionary2430/1) |
| 5 | Search Suggestions System | LC 1268 | 🟡 Medium | Amazon, Microsoft, Google | [LeetCode](https://leetcode.com/problems/search-suggestions-system/) · [GFG](https://www.geeksforgeeks.org/problems/phone-directory4628/1) |

### Word Break / Segmentation

**Strategy:** Use Trie for fast lookup → combine with DP or backtracking for word segmentation and concatenation.

**Identify when:** Problem mentions “word segmentation, dictionary words, concatenated words, or string break”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Word Break | LC 139 | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/word-break/) · [GFG](https://www.geeksforgeeks.org/problems/word-break1352/1) |
| 2 | Word Break 2 | LC 140 | 🔴 Hard | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/word-break-ii/description/) · [GFG](https://www.geeksforgeeks.org/problems/word-break-part-23249/1) |
| 3 | Concatenated Words | LC 472 | 🔴 Hard | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/concatenated-words/) · [GFG](https://www.geeksforgeeks.org/dsa/find-all-concatenations-of-words-in-array/?utm_source=chatgpt.com) |
| 4 | Replace Words | LC 648 | 🟡 Medium | Goldman Sachs, Apple, Adobe | [LeetCode](https://leetcode.com/problems/replace-words/) · [GFG](https://www.geeksforgeeks.org/problems/replace-a-word5553/1) |

### Bitwise Trie / XOR

**Strategy:** Use Trie for binary representation of numbers → efficiently find maximum/minimum XOR or subset XOR.

**Identify when:** Problem mentions “maximize XOR, XOR queries, bit-level optimization, or subsets”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Maximum XOR of Two Numbers in Array | LC 421 | 🟡 Medium | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/description/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-xor-of-two-numbers-in-an-array/1) |
| 2 | Maximum XOR With an Element From Array | LC 1707 | 🔴 Hard | Flipkart, PhonePe, Paytm | [LeetCode](https://leetcode.com/problems/maximum-xor-with-an-element-from-array/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-xor-with-an-element-from-array/1) |
| 3 | Bit Manipulation / Subset XOR Problems | LC 1863 | 🟡 Medium | Amazon, Apple, Zomato | [LeetCode](https://leetcode.com/problems/sum-of-all-subset-xor-totals/) · [GFG](https://www.geeksforgeeks.org/problems/subset-xor--175953/1) |

---

## Bit Manipulation

Techniques that perform operations on data at the bit level.

### Basic Bit Operations

**Strategy:** Use XOR / AND / OR / shift operations → detect single/missing numbers or count bits efficiently.

**Identify when:** Problem mentions “unique element, missing number, or bit counting”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Missing Number | LC 268 | 🟢 Easy | Goldman Sachs, Apple, Adobe | [LeetCode](https://leetcode.com/problems/missing-number/) · [GFG](https://www.geeksforgeeks.org/problems/missing-number-in-array1416/1) |
| 2 | Number of 1 Bits / Hamming Weight | LC 191 | 🟢 Easy | Amazon, Sumo Logic, Paytm | [LeetCode](https://leetcode.com/problems/number-of-1-bits/description/) · [GFG](https://www.geeksforgeeks.org/problems/count-total-set-bits-1587115620/1) |
| 3 | Alternating Bits | LC 693 | 🟢 Easy | Amazon, Paypal, Paytm | [LeetCode](https://leetcode.com/problems/binary-number-with-alternating-bits/description/) · [GFG](https://www.geeksforgeeks.org/problems/product-of-digits4348/1) |
| 4 | Check kth bit is set or not |  | 🟢 Easy | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/find-kth-bit-in-nth-binary-string/description/) · [GFG](https://www.geeksforgeeks.org/problems/check-whether-k-th-bit-is-set-or-not-1587115620/1) |
| 5 | Power of Two |  | 🟢 Easy | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/power-of-two/description/) · [GFG](https://www.geeksforgeeks.org/problems/power-of-2-1587115620/1) |
| 6 | Unique Numbers 2 |  | 🟡 Medium | Amazon, Google, Microsoft | [GFG](https://www.geeksforgeeks.org/problems/finding-the-numbers0215/1) |
| 7 | Single Number | LC 136 | 🟢 Easy | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/single-number/) · [GFG](https://www.geeksforgeeks.org/problems/element-appearing-once2552/1) |
| 8 | Single Number II | LC 137 | 🟡 Medium | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/single-number-ii/) |
| 9 | Single Number III |  | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/single-number-iii/description/) |

### Subsets / Bitmask

**Strategy:** Iterate through all subsets using bits → solve combinatorial or DP counting problems.

**Identify when:** Problem mentions “generate subsets, combinations, or mask enumeration”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Subsets | LC 78 | 🟡 Medium | Meta, Microsoft, Amazon | [LeetCode](https://leetcode.com/problems/subsets/) · [GFG](https://www.geeksforgeeks.org/problems/subsets-1613027340/1) |
| 2 | Subsets II | LC 90 | 🟡 Medium | Flipkart, PhonePe, Zomato | [LeetCode](https://leetcode.com/problems/subsets-ii/) · [GFG](https://www.geeksforgeeks.org/problems/subset-sum-ii/1) |
| 3 | Partition to K Equal Sum Subsets | LC 698 | 🟡 Medium | Goldman Sachs, Adobe, Apple | [LeetCode](https://leetcode.com/problems/partition-to-k-equal-sum-subsets/) · [GFG](https://www.geeksforgeeks.org/problems/partition-array-to-k-subsets/1) |

### Advanced XOR

**Strategy:** Use XOR properties → maximize/minimize XOR over array/subarray or ranges.

**Identify when:** Problem mentions “maximize XOR, XOR queries, pairs, or range XOR”.

| # | Problem | Ref | Difficulty | Companies | Links |
|---|---------|-----|------------|-----------|-------|
| 1 | Maximum XOR of Two Numbers in Array | LC 421 | 🟡 Medium | Google, Amazon, Microsoft | [LeetCode](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/description/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-xor-of-two-numbers-in-an-array/1) |
| 2 | Maximum XOR With an Element From Array | LC 1707 | 🔴 Hard | Flipkart, PhonePe, Paytm | [LeetCode](https://leetcode.com/problems/maximum-xor-with-an-element-from-array/) · [GFG](https://www.geeksforgeeks.org/problems/maximum-xor-with-an-element-from-array/1) |
| 3 | Subarray XOR Queries / K-th XOR | LC 1310 | 🟡 Medium | Amazon, Google, Microsoft | [LeetCode](https://leetcode.com/problems/xor-queries-of-a-subarray/description/) · [GFG](https://www.geeksforgeeks.org/problems/subsets-with-xor-value2023/1) |
| 4 | Sum of Subset XOR Totals | LC 1863 | 🟢 Easy | Facebook, Apple, Adobe | [LeetCode](https://leetcode.com/problems/sum-of-all-subset-xor-totals/) · [GFG](https://www.geeksforgeeks.org/problems/sum-of-xor-of-all-possible-subsets/11) |

---
