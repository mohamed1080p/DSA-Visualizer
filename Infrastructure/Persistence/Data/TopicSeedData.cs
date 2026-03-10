using Domain.Models.TopicModule;
using System.Text.Json;

namespace Persistence.Data
{
    public static class TopicSeedData
    {
        public static IReadOnlyList<Topic> GetTopics()
        {
            return
            [
                Create("stack", "Stack", "linear", "Layers", "Linear structure that follows Last In First Out order", "Beginner", 10,
                    ["Push adds element at top", "Pop removes top element", "Used in recursion and undo operations"],
                    ["Function call stacks", "Expression evaluation", "Backtracking"]),
                Create("queue", "Queue", "linear", "List", "Linear structure that follows First In First Out order", "Beginner", 10,
                    ["Enqueue inserts at rear", "Dequeue removes from front", "Useful for scheduling"],
                    ["Task scheduling", "Breadth-first search", "Request processing"]),
                Create("linked-list", "Linked List", "linear", "Link", "Sequence of nodes connected by pointers", "Beginner", 10,
                    ["Dynamic size structure", "Efficient insertion/deletion at known node", "Sequential access"],
                    ["Implementing stacks and queues", "Memory-efficient insertions", "Graph adjacency lists"]),
                Create("array", "Array", "linear", "Table", "Contiguous memory structure for fast indexed access", "Beginner", 10,
                    ["Constant-time index access", "Insertion/deletion can be costly", "Best for random access"],
                    ["Lookup tables", "Caching values", "Matrix representation"]),
                Create("binary-tree", "Binary Tree", "nonlinear", "GitBranch", "Hierarchical structure with up to two children per node", "Intermediate", 10,
                    ["Recursive structure", "Supports DFS/BFS traversals", "Tree shape affects performance"],
                    ["Expression trees", "Hierarchy modeling", "Decision processes"]),
                Create("graph", "Graph", "nonlinear", "Share2", "Collection of vertices connected with edges", "Intermediate", 10,
                    ["Represents relationships", "Traversal via BFS/DFS", "Can be directed or undirected"],
                    ["Social networks", "Route planning", "Dependency graphs"]),
                Create("heap", "Heap", "nonlinear", "Package", "Binary heap structure optimized for priority operations", "Intermediate", 10,
                    ["Complete binary tree", "Fast root access", "Insert and extract in O(log n)"],
                    ["Priority queues", "Scheduling", "Top-k problems"]),
                Create("sorting", "Sorting", "algorithms", "ArrowUpDown", "Algorithms for ordering data efficiently", "Intermediate", 10,
                    ["Many trade-offs exist", "Stable vs unstable sorting", "Complexity depends on algorithm"],
                    ["Data preprocessing", "Search optimization", "Ranking systems"]),
                Create("searching", "Searching", "algorithms", "Search", "Algorithms for finding elements in collections", "Beginner", 10,
                    ["Linear and binary search", "Binary search needs sorted input", "Bounds handling is critical"],
                    ["Fast lookups", "Validation checks", "Data retrieval"]),
                Create("hash-table", "Hash Table", "linear", "Hash", "Key-value data structure using hashing for fast access", "Intermediate", 5,
                    ["Maps keys to indices using a hash function", "Average O(1) insert, lookup, and delete", "Collisions handled by chaining or open addressing"],
                    ["Caching and memoization", "Frequency counting", "Fast dictionary lookups"]),
                Create("binary-search-tree", "Binary Search Tree", "nonlinear", "TreePine", "Ordered binary tree enabling efficient search and updates", "Intermediate", 5,
                    ["Left subtree smaller, right subtree larger", "Inorder traversal gives sorted order", "Average O(log n) operations"],
                    ["In-memory indexing", "Sorted dynamic datasets", "Range queries"]),
                Create("trie", "Trie", "nonlinear", "Network", "Tree-like structure for storing strings by prefix", "Advanced", 5,
                    ["Edges represent character transitions", "Fast prefix matching", "Common in autocomplete"],
                    ["Autocomplete", "Dictionary lookup", "Prefix filtering"]),
                Create("dynamic-programming", "Dynamic Programming", "algorithms", "Binary", "Optimization technique using overlapping subproblems", "Advanced", 5,
                    ["Break problems into subproblems", "Memoize or tabulate results", "Top-down and bottom-up approaches"],
                    ["Knapsack variations", "Edit distance", "Path counting"]),
                Create("greedy", "Greedy Algorithms", "algorithms", "SortAsc", "Builds solution by choosing the best local option", "Intermediate", 5,
                    ["Local optimum at each step", "Works when greedy-choice property holds", "Usually simple and efficient"],
                    ["Interval scheduling", "Minimum spanning trees", "Resource allocation"]),
                Create("two-pointers", "Two Pointers", "algorithms", "Binary", "Technique that uses two indices to scan data efficiently", "Beginner", 5,
                    ["Pointers move inward or together", "Reduces nested loops", "Often used on sorted data"],
                    ["Pair sum problems", "Palindrome checks", "Sliding window patterns"])
            ];
        }

        private static Topic Create(string id, string name, string category, string icon, string description, string difficulty, int problemsCount,
            IEnumerable<string> keyPoints, IEnumerable<string> useCases)
        {
            return new Topic
            {
                Id = id,
                Name = name,
                Category = category,
                Icon = icon,
                Description = description,
                Difficulty = difficulty,
                ProblemsCount = problemsCount,
                KeyPointsJson = JsonSerializer.Serialize(keyPoints),
                UseCasesJson = JsonSerializer.Serialize(useCases)
            };
        }
    }
}
