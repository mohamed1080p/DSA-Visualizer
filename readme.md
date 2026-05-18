<div align="center">

<br/>

```
██████╗ ███████╗ █████╗     ██╗   ██╗██╗███████╗██╗   ██╗ █████╗ ██╗     ██╗███████╗███████╗██████╗
██╔══██╗██╔════╝██╔══██╗    ██║   ██║██║██╔════╝██║   ██║██╔══██╗██║     ██║╚══███╔╝██╔════╝██╔══██╗
██║  ██║███████╗███████║    ██║   ██║██║███████╗██║   ██║███████║██║     ██║  ███╔╝ █████╗  ██████╔╝
██║  ██║╚════██║██╔══██║    ╚██╗ ██╔╝██║╚════██║██║   ██║██╔══██║██║     ██║ ███╔╝  ██╔══╝  ██╔══██╗
██████╔╝███████║██║  ██║     ╚████╔╝ ██║███████║╚██████╔╝██║  ██║███████╗██║███████╗███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝      ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
```

<br/>

**An interactive platform for learning and mastering Data Structures & Algorithms**  
*Step-by-step visualizations · Multi-language code · AI-powered hints · Coding challenges*

<br/>

[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE.txt)

<br/>

</div>

---

## What is DSA Visualizer?

DSA Visualizer is a full-stack web application that turns abstract data structures and algorithms into living, interactive experiences. Inspired by platforms like LeetCode, it goes beyond plain problem solving — every topic comes with annotated step-by-step animations, multi-language code implementations, time/space complexity breakdowns, and a built-in AI tutor that gives contextual hints and reviews your code.

Whether you're a student cracking your first linked list or an engineer refreshing your sorting knowledge before an interview, DSA Visualizer gives you the full picture.

<br/>

## Feature Highlights

| Feature | Description |
|---|---|
|  **Step-by-Step Visualizations** | Every algorithm and data structure has annotated animation steps stored as structured JSON |
|  **Multi-Language Code** | Browse implementations in **C#**, **C++**, **Java**, and **JavaScript** side-by-side |
|  **Complexity Analysis** | Time and space complexity entries per operation, per topic |
|  **Coding Challenges** | Curated problems per topic with hidden + visible test cases |
|  **Secure Code Execution** | Submissions run in isolated **Docker sandboxes** — no host exposure |
|  **AI Hints & Code Review** | Powered by **Ollama** (local LLM) for private, low-latency AI assistance |
|  **JWT Authentication** | Secure register/login with **30-min access tokens** + **7-day refresh tokens** |
|  **Progress Tracking** | Mark topics as completed; track your learning journey per user |
|  **Async Job Queue** | Submission processing via **Hangfire** — non-blocking, scalable |
|  **Rate Limiting** | Submit endpoint is rate-limited per user to prevent abuse and sandbox exhaustion |

<br/>

## 🗂️ Topics Covered

### Data Structures
| Topic | Problems |
|---|---|
| Array | Sum of Elements, Reverse Array, Second Largest, Count Even Numbers |
| Singly Linked List | Reverse, Find Middle, Nth from End, Remove Duplicates, Length |
| Stack | Valid Parentheses, Asteroid Collision, Simulate Stack Ops |
| Queue | Reverse a Queue, Generate Binary Numbers, Simulate Queue Ops |
| Binary Tree | Inorder Traversal, Height, Count Leaves, Level Order Traversal |
| Binary Search Tree | Search in BST, Validate BST, LCA in BST |

### Algorithms
| Topic | Problems |
|---|---|
| Binary Search | *(topic + multiple problems)* |
| Bubble Sort | Sort Ascending/Descending, Count Swaps |
| Insertion Sort | Sort Array, Count Shifts, Insert into Sorted Array |
| Selection Sort | Sort Array, Count Swaps |
| Quick Sort | Sort Array, Kth Smallest Element |
| DFS | DFS Traversal Order, Detect Cycle, Count Components |
| BFS | BFS Traversal Order, Level of Each Node, Shortest Path |

<br/>

##  Architecture

DSA Visualizer follows a strict **Onion / Clean Architecture** pattern, ensuring total separation of concerns and zero leakage between layers.

```
┌─────────────────────────────────────────────────────────┐
│                    DSA-Visualizer                        │  ← Startup / Host
│                   (Program.cs, DI)                       │
├─────────────────────────────────────────────────────────┤
│              Infrastructure / Presentation               │  ← Controllers (API surface)
├──────────────────────────┬──────────────────────────────┤
│   Infrastructure /       │         Shared               │  ← EF Core, Repos, Seeding
│   Persistence            │         (DTOs)               │
├──────────────────────────┴──────────────────────────────┤
│                    Core / Services                       │  ← Business Logic
├─────────────────────────────────────────────────────────┤
│               Core / ServicesAbstraction                 │  ← Service Interfaces
├─────────────────────────────────────────────────────────┤
│                    Core / Domain                         │  ← Entities, Repo Contracts
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

```
Core/
├── Domain/
│   ├── Models/           → ApplicationUser, Topic, Problem, Submission, TestCase, ...
│   ├── Contracts/        → IGenericRepository<T,TKey>, IUnitOfWork, IProblemRepository, ...
│   └── Exceptions/       → NotFoundException, InvalidCredentialsException, GlobalExceptionHandler
│
├── Services/             → AuthService, TopicService, ProblemService, SubmissionService,
│                           CodeExecutionService, UserProgressService, ServiceManager
│
└── ServicesAbstraction/  → IAuthService, ITopicService, IProblemService, ISubmissionService,
                            ICodeExecutionService, IUserProgressService, IServiceManager

Infrastructure/
├── Persistence/
│   ├── Data/             → ApplicationDbContext, EF Configurations
│   ├── Migrations/       → Full EF migration history
│   ├── Repositories/     → GenericRepository, ProblemRepository, SubmissionRepository, ...
│   └── Seeds/            → DataSeeding.cs + JSON seed files (Topics & Problems)
│
└── Presentation/
    └── Controllers/      → AuthController, TopicsController, ProblemsController,
                            SubmissionsController, UserProgressController

Shared/
└── DTOs/
    ├── IdentityDTOs/     → LoginDTO, RegisterDTO, UserDTO, TokenRequestDTO
    ├── TopicsDTOs/       → TopicDTO, TopicDetailDTO, TopicCodeImplementationDTO, ...
    ├── ProblemDTOs/      → ProblemDTO, ProblemDetailDTO, ProblemQueryParametersDTO, ...
    ├── SubmissionDTOs/   → SubmitProblemDTO, SubmissionResultDTO, CodeExecutionRequest, ...
    └── UserProgressDTOs/ → UserProgressDTO
```

<br/>

##  API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login and receive JWT + refresh token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |
| `POST` | `/api/auth/refresh-token` | Exchange refresh token for new access token |

### Topics — `/api/topics`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/topics` | List all topics |
| `GET` | `/api/topics/filter` | Filter by `searchTerm`, `difficulty`, `categoryId` |
| `GET` | `/api/topics/{slug}` | Get topic detail by slug (with code, complexity, steps) |
| `POST` | `/api/topics/{id}/complete` | Mark a topic as completed for the current user |

### Problems — `/api/problems`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems` | List problems (filterable by topic, difficulty, search) |
| `GET` | `/api/problems/{id}` | Get problem detail with visible test cases |

### Submissions — `/api/submissions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/submissions` | Submit code for a problem (queued via Hangfire) |
| `GET` | `/api/submissions/{id}` | Get submission result with per-test-case verdicts |
| `GET` | `/api/submissions/history` | Get submission history for the current user |

### User Progress — `/api/progress`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress` | Get all completed topics for the current user |

<br/>

## ⚙️ Domain Models

```
ApplicationUser (IdentityUser)
  └── RefreshTokens[]

Category
  └── Topics[]
        ├── TopicCodeImplementations[]   (CSharp, CPP, Java, JavaScript)
        ├── TopicComplexities[]          (operation, time, space)
        ├── StepsJson                    (annotated animation steps)
        └── Problems[]
              ├── TestCases[]            (Input, ExpectedOutput, IsHidden)
              └── Submissions[]
                    ├── SubmissionTestResults[]
                    └── Verdict          (Accepted | WrongAnswer | TimeLimitExceeded | ...)
```

**Key design decisions:**
- `Submission.Id` is typed as `long` to support high-volume submissions without overflow
- `Problem.Description` is stored as `nvarchar(max)` Markdown — flexible for rich rendering
- Hidden test cases are filtered at the **service layer**, never at the repository level
- Seed data uses **no explicit IDs** — SQL Server auto-generates PKs to avoid `IDENTITY_INSERT` conflicts
- `SaveChangesAsync` is split across dependency boundaries (topics → problems) to respect FK ordering

<br/>

## 🐳 Code Execution Engine

Submissions are executed in fully isolated **Docker containers** — one per language — ensuring security and reproducibility.

```
DockerSandbox/
├── csharp/    → Dockerfile + run.sh
├── cpp/       → Dockerfile + run.sh
├── java/      → Dockerfile + run.sh
└── python/    → Dockerfile + run.sh
```

Each sandbox:
- Receives the user's code and test inputs via stdin / volume mount
- Runs with strict time and memory constraints
- Returns stdout, stderr, and exit code
- Is torn down immediately after execution


---

## Rate Limiting

The `POST /api/submissions` endpoint is protected using ASP.NET Core’s built-in rate limiting middleware to prevent abuse and ensure stable execution of sandboxed workloads.

### Behavior

- Requests exceeding the configured limit return **`429 Too Many Requests`**
- Limits are enforced **per authenticated user**
- Prevents a single user from exhausting Docker execution resources
- Ensures fair usage under concurrent system load

---

This mechanism helps protect the code execution pipeline and maintains system stability during peak traffic.

## 🤖 AI Features (Ollama)

AI assistance runs entirely locally via **Ollama**, keeping user code and progress data private.

- **Hint generation** — contextual hints based on the problem, topic, and user's code
- **Code review** — line-level feedback on correctness, style, and complexity
- No external API calls; no data leaves your infrastructure

<br/>

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/sql-server) (local or Docker)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for code execution sandboxes)
- [Ollama](https://ollama.com/) (for AI features)
- [Node.js 20+](https://nodejs.org/) (for the React frontend)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/DSA-Visualizer.git
cd DSA-Visualizer
```

### 2. Configure the backend

Edit `DSA-Visualizer/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=DSAVisualizer;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-min-32-chars",
    "Issuer": "DSAVisualizer",
    "Audience": "DSAVisualizerClient",
    "AccessTokenExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 7
  },
  "OllamaSettings": {
    "BaseUrl": "http://localhost:11434",
    "Model": "llama3"
  }
}
```

### 3. Apply migrations & seed data

```bash
cd DSA-Visualizer
dotnet ef database update
dotnet run
```

> The application auto-seeds 13 topics (with code implementations, complexity entries, and step annotations) and all problems on first startup via `SeedDataLoader`.

### 4. Start the frontend

```bash
cd frontend   # (React app directory)
npm install
npm run dev
```

### 5. Pull an Ollama model (for AI features)

```bash
ollama pull llama3
```

<br/>

## 🗃️ Data Seeding

All seed data lives in `Infrastructure/Persistence/Data/Seeds/DataSeedFiles/` as plain JSON files — no hardcoded IDs, no migration-embedded data.

```
DataSeedFiles/
├── Topics/
│   ├── array.json
│   ├── linked-list.json
│   ├── stack.json
│   ├── queue.json
│   ├── binary-tree.json
│   ├── binary-search-tree.json
│   ├── binary-search.json
│   ├── bubble-sort.json
│   ├── insertion-sort.json
│   ├── selection-sort.json
│   ├── quick-sort.json
│   ├── dfs.json
│   ├── bfs.json
│   └── categories.json
│
└── Problems/
    ├── Array/        (4 problems)
    ├── LinkedList/   (5 problems)
    ├── Stack/        (3 problems)
    ├── Queue/        (3 problems)
    ├── BinaryTree/   (4 problems)
    ├── BST/          (3 problems)
    ├── Sorting/      (10 problems)
    └── Graph/        (6 problems)
```

Each topic JSON follows this structure:

```json
{
  "name": "Array",
  "slug": "array",
  "description": "...",
  "difficulty": 1,
  "categoryName": "Data Structures",
  "stepsJson": "[{ \"step\": 1, \"description\": \"...\" }]",
  "codeImplementations": [
    { "language": 1, "code": "// C# implementation..." },
    { "language": 2, "code": "// C++ implementation..." }
  ],
  "complexities": [
    { "operation": "Access", "timeComplexity": "O(1)", "spaceComplexity": "O(1)" }
  ]
}
```

<br/>

## 🔒 Authentication Flow

```
Register ──→ Hash password (ASP.NET Identity) ──→ Store user
Login    ──→ Validate credentials
              └──→ Issue JWT (30 min) + Refresh Token (7 days, hashed in DB)
                    └──→ Client stores tokens

API Request ──→ Bearer JWT in Authorization header
                └──→ Token expires? POST /refresh-token → new JWT pair

Logout ──→ Invalidate refresh token in DB
```

- `ApplicationUser` extends `IdentityUser` with custom fields
- Passwords managed entirely by ASP.NET Core Identity (bcrypt)
- Refresh tokens are stored **hashed** in the database

<br/>

##  Enums Reference

```csharp
// DifficultyLevel
Easy   = 1
Medium = 2
Hard   = 3

// ProgrammingLanguage
CSharp     = 1
CPP        = 2
Java       = 3
JavaScript = 4

// SubmissionVerdict
Accepted            = 1
WrongAnswer         = 2
TimeLimitExceeded   = 3
RuntimeError        = 4
CompilationError    = 5
```

<br/>

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing architectural conventions — new services belong in `Core/Services`, new DTOs in `Shared/DTOs/<FeatureDTOs>/`, and new controllers in `Infrastructure/Presentation/Controllers/`.

<br/>

## 📄 License

This project is licensed under the MIT License — see the [LICENSE.txt](./LICENSE.txt) file for details.

<br/>

---

<div align="center">

Built with 🧠 and ☕ using **ASP.NET Core** · **React** · **SQL Server** · **Docker** · **Ollama**

</div>
