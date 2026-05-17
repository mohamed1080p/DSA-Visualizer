# DSA Visualizer & Battle Arena - Comprehensive Technical Documentation

This document serves as the complete technical documentation for the DSA Visualizer graduation project. It provides an extreme technical overview of the architecture, stack, database, and implementation details across both the frontend and backend.

---

## 1. PROJECT OVERVIEW & WHAT CHANGED
### Project Overview
The DSA Visualizer is an advanced, full-stack educational platform designed to help computer science students master Data Structures and Algorithms. The platform combines interactive algorithm visualization, a fully isolated cloud code-execution engine, an AI-powered code reviewer, and a real-time multiplayer competitive programming arena.

### Major Changes & Evolution
Compared to earlier iterations of the project, the platform has evolved from a simple visualizer to a full-fledged competitive learning environment:
* **Real-time Multiplayer Battle Arena:** Introduced a websocket-based (SignalR) matchmaking queue where users can compete in "first-to-solve" coding battles against friends or random opponents.
* **Friend & Community System:** Users can now search for other learners, add them as friends, track their online status, and send direct real-time chat messages with toast notifications.
* **AI Integration:** Integrated a cloud-based LLM via Google Generative Language API (Gemini) to provide context-aware hints and comprehensive code reviews without leaking exact answers.
* **Architecture Overhaul:** The backend was strictly refactored into a Domain-Driven Onion Architecture to decouple business logic from infrastructure, ensuring long-term maintainability.
* **Secure Authentication:** Migrated from `localStorage` JWTs to secure `HttpOnly` cookies to prevent XSS vulnerabilities, alongside robust Refresh Token rotation.

---

## 2. TECHNOLOGY STACK
The project leverages a bleeding-edge technology stack across all tiers.

### Backend
* **Framework:** ASP.NET Core / .NET 10.0
* **ORM:** Entity Framework Core (v10.0.3)
* **Real-time Communication:** SignalR (v10.0)
* **Background Jobs:** Hangfire (v1.8.23) with Hangfire.SqlServer
* **Authentication:** ASP.NET Core Identity, JWT Bearer (v10.0.3), Google/GitHub OAuth
* **API Documentation:** Swashbuckle.AspNetCore (v10.1.4)
* **Observability:** OpenTelemetry (v1.15.3)

### Frontend
* **Framework:** React v19.2.0 (bootstrapped with Vite v8.0.10)
* **Routing:** React Router v7.14.2
* **Styling:** Tailwind CSS v4.3.0, `tw-animate-css`, `clsx`, `tailwind-merge`
* **Icons:** `lucide-react`
* **Animations:** Framer Motion v12.38.0
* **Language/Typing:** TypeScript v6.0.2

### Infrastructure & Database
* **Database:** Microsoft SQL Server (latest)
* **Containerization:** Docker Desktop / Docker Engine (used both for hosting the app and spinning up ephemeral code execution containers via `Docker.DotNet`)
* **AI Model Engine:** Google Gemini (via Generative Language API, using gemini-1.5-flash model)

### Development Tools
* **IDE:** Visual Studio 2022 / VS Code
* **Version Control:** Git / GitHub
* **API Testing:** Postman, Swagger UI

---

## 3. BACKEND ARCHITECTURE
The backend strictly follows the **Onion Architecture** (also known as Clean Architecture), ensuring a unidirectional dependency flow where the `Core` has no dependencies on external frameworks.

### Layer Definitions
1. **Core.Domain:** Contains all database entities, enumerations, and custom exceptions. No dependencies.
2. **Core.ServicesAbstraction:** Contains interfaces for all business logic services (e.g., `IProblemService`, `IBattleSessionService`).
3. **Core.Services:** Implements the business logic interfaces defined in `ServicesAbstraction`. Handles validation, business rules, and mapping.
4. **Infrastructure.Persistence:** Contains the `ApplicationDbContext`, Entity Framework Core configurations, and implementations of the Repository and Unit of Work patterns.
5. **Infrastructure.External:** Contains adapters for 3rd-party services (e.g., Docker Execution Engine, Redis Matchmaking, Gemini HTTP client).
6. **Infrastructure.Presentation:** Contains the ASP.NET Core Web API Controllers and SignalR Hubs.
7. **DSA-Visualizer (API/Host):** The composition root. Handles dependency injection registration, middleware configuration, and application bootstrapping.

### Design Patterns
* **Repository & Unit of Work:** Abstracts database operations and ensures atomic transactions across multiple repositories.
* **Dependency Injection:** Centralized in the API layer. Scoped services for business logic, Singleton for Docker Engine clients, and Transient for lightweight helpers.
* **Observer/PubSub:** Used via SignalR for real-time notifications (MatchFound, BattleStarted, PlayerJoined).

### Error Handling & Logging
* **Global Exception Handling:** A centralized middleware catches all unhandled exceptions, logs them, and formats a standardized JSON response (`ApiError`) preventing stack trace leaks.
* **Logging:** OpenTelemetry instrumentation captures HTTP requests, runtime metrics, and SQL queries, exporting them to centralized observability dashboards.

---

## 4. DATABASE DESIGN
*Database: SQL Server via EF Core Code-First.*

### Core Entities
1. **ApplicationUser**
   * *Columns:* Id (PK), UserName, Email, PasswordHash, RefreshToken, RefreshTokenExpiry, ExperiencePoints, Level.
   * *Relationships:* 1-to-Many with Submissions, 1-to-1 with PlayerStats.
2. **PlayerStats**
   * *Columns:* UserId (PK/FK), RankPoints, WinCount, LossCount, CurrentStreak.
3. **Topic**
   * *Columns:* Id (PK), Title, Slug, Category (Algorithm/DataStructure), Difficulty, Description.
4. **Problem**
   * *Columns:* Id (PK), TopicId (FK), Title, Slug, Difficulty, Description, TimeLimitMs, MemoryLimitKb.
5. **TestCase**
   * *Columns:* Id (PK), ProblemId (FK), Input, ExpectedOutput, IsHidden.
6. **Submission**
   * *Columns:* Id (PK), UserId (FK), ProblemId (FK), Code, Language, Verdict (enum), ExecutionTimeMs, MemoryUsedKb, SubmittedAt.
7. **BattleSession**
   * *Columns:* Id (PK), Mode (enum), Status (enum), TimeLimitSeconds, StartedAt, FinishedAt.
8. **BattleParticipant**
   * *Columns:* Id (PK), BattleId (FK), UserId (FK), SolvedCount, RatingDelta.
9. **Friendship**
   * *Columns:* RequesterId (FK), TargetId (FK), Status (Pending/Accepted).

*Seeding is handled manually via EF Core `HasData` in `ModelBuilder` extensions or via JSON configuration injection on startup.*

---

## 5. ALL API ENDPOINTS
Endpoints are grouped by feature modules and secured via JWT.

### AuthController (`/api/Auth`)
* `POST /login`: Accepts credentials, returns user context. Sets `jwt` and `refreshToken` in HttpOnly cookies.
* `POST /register`: Creates a new ApplicationUser.
* `POST /refresh-token`: Reads `refreshToken` cookie, issues a new JWT cookie.
* `POST /logout`: Clears HttpOnly cookies.

### TopicsController (`/api/Topics`)
* `GET /`: Returns a list of all topics with brief metadata.
* `GET /{slug}`: Returns full topic details, complexities, and visualizer `StepsJson`.

### ProblemsController (`/api/Problems`)
* `GET /`: List of all problems (filterable by difficulty/topic).
* `GET /{id}`: Full problem description and visible test cases.

### SubmissionsController (`/api/Submissions`)
* `POST /`: Submits code for execution. Requires `problemId`, `code`, `language`. Enqueues a Hangfire job and returns a `submissionId`.
* `GET /{id}`: Polls the status of a specific submission. Returns execution time, memory, and verdict.

### BattleController (`/api/Battle`)
* `POST /queue`: Standard matchmaking. Joins the queue for a specified mode.
* `GET /queue/status`: Polls queue status to see if a match was found.
* `GET /{id}`: Fetches active battle data.
* `POST /{id}/submissions`: Submits code exclusively during a live battle.

### ChatbotController (`/api/Chatbot`)
* `POST /hint`: Requests a Gemini-generated hint based on current code.
* `POST /review`: Requests a comprehensive code review.

---

## 6. AUTHENTICATION & AUTHORIZATION
The platform uses highly secure, cookie-based JWT authentication.
* **Login Flow:** User provides email/password. Server hashes the password, compares it, and generates a short-lived JWT (15 mins) and a long-lived Refresh Token (7 days). Both are placed in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
* **Refresh Rotation:** When the frontend detects a 401 Unauthorized, an interceptor automatically hits `/api/Auth/refresh-token`. The server validates the old refresh token, revokes it, and issues a fresh pair, allowing seamless extended sessions without compromising security.
* **Logout:** Hits `/api/Auth/logout` which simply tells the browser to expire and delete the auth cookies.

---

## 7. TOPICS MODULE
Topics represent the educational backbone of the platform.
* **Categories:** Data Structures (Hash Tables, Tries, Heaps, Graphs) & Algorithms (Sorting, Graph Traversal, Dynamic Programming).
* **Topic Data:** Each topic includes a comprehensive description, Time/Space Complexity tables, and supported language implementations (C++, Java, Python, C#).
* **StepsJson (Visualizer Backbone):** A serialized JSON string defining discrete animation states. Example structure:
  ```json
  [
    { "step": 1, "description": "Initialize pointers", "activeNodes": [0], "arrayState": [5, 2, 9, 1] },
    { "step": 2, "description": "Swap elements", "activeNodes": [0, 1], "arrayState": [2, 5, 9, 1] }
  ]
  ```

---

## 8. PROBLEMS & SUBMISSIONS MODULE
* **Data:** Problems contain Markdown descriptions, difficulty tiers (Easy/Medium/Hard), constraints (e.g., "Time Limit: 1000ms"), and a suite of TestCases.
* **Hidden vs Visible:** 2-3 basic test cases are returned to the frontend. 10+ edge-case test cases are kept strictly on the backend to prevent hardcoding.
* **Submission Lifecycle:**
  1. Frontend sends code string to `/api/Submissions`.
  2. Backend saves `Submission` to DB with status `Pending`.
  3. Hangfire enqueues a background job (`SubmissionProcessor`).
  4. Hangfire worker picks up the job, fetches the problem's hidden test cases, and invokes the `DockerService`.
  5. The Docker engine runs the code, captures `stdout`, compares it to `ExpectedOutput`.
  6. DB is updated with the final verdict (e.g., `Accepted`, `Wrong Answer`).
* **Verdicts:** `Accepted (AC)`, `Wrong Answer (WA)`, `Time Limit Exceeded (TLE)`, `Memory Limit Exceeded (MLE)`, `Compilation Error (CE)`, `Runtime Error (RE)`.

---

## 9. CODE EXECUTION ENGINE
The core innovation of the backend is the secure, remote code execution environment using `Docker.DotNet`.
* **Process:** For every submission, a highly restricted, ephemeral Docker container is spun up. 
* **Images:** Uses alpine-based language runtimes (e.g., `gcc:alpine` for C++, `python:3.11-alpine` for Python, `mcr.microsoft.com/dotnet/sdk` for C#).
* **Limits:** Strict memory limits (e.g., `HostConfig.Memory = 256MB`) and CPU quotas are applied to the container. A hard timeout (e.g., 2000ms) is enforced via C# `CancellationToken`. If the container does not exit in time, it is forcefully killed and marked as `TLE`.
* **Security:** Containers run without network access (`NetworkDisabled = true`) to prevent malicious outbound requests.

---

## 10. AI FEATURES (Gemini Integration)
The platform features an embedded AI assistant powered by Google Generative Language API (Gemini).
* **Model:** Uses `gemini-1.5-flash` for fast, cost-effective responses.
* **Hint System:** Sends the user's current code, problem description, and current language to the model with a strict system prompt: *"Provide a conceptual hint. Do NOT provide code solutions."*
* **Code Review:** Triggered after a user successfully solves a problem. Evaluates Time/Space complexity, readability, and alternative optimal approaches.

---

## 11. FRONTEND ARCHITECTURE
* **Structure:** `src/pages` (Routable views), `src/components` (Reusable UI), `src/context` (Global state via React Context), `src/lib` (API clients, utilities).
* **State Management:** React Context API is heavily used for `AuthContext` (managing user sessions) and `SignalRContext` (managing global websocket connections).
* **Routing:** `React Router`. Protected routes are wrapped in a `<ProtectedRoute>` component that verifies `isAuthenticated` before rendering.
* **UI Components:** Completely custom components built with Tailwind CSS, leveraging dynamic classes via `clsx` and `tailwind-merge`.
* **Code Editor:** Integration with a customized web-based code editor (Monaco or equivalent) supporting syntax highlighting and indentation.

---

## 12. FRONTEND PAGES & COMPONENTS
* **Landing Page:** Showcases platform features with hero animations (Framer Motion).
* **Login/Register:** Authentication forms with validation.
* **Community Page:** Displays global leaderboard, friends list, search users, and incoming battle challenge popups.
* **Topics & Learning Path:** "Duolingo-style" map layout tracking visual progression through DSA concepts.
* **Topic Detail / Visualizer:** Splitscreen. Left side contains description/code. Right side contains the interactive canvas rendering the `StepsJson` animation.
* **Playground / Arena Queue:** Interface to select battle mode (Timed/Survival/First to Solve) and join the matchmaking queue.
* **Battle Arena:** Live real-time interface. Shows opponent's progress, a live countdown timer, and a code editor.

---

## 13. ALGORITHM VISUALIZER
The visualizer translates abstract data structures into visual state machines.
* **Mechanism:** Driven entirely by `StepsJson` arrays. The frontend maintains a `currentStepIndex` state.
* **Controls:** Provides a timeline scrubber, Play/Pause toggle, Step Forward, Step Backward, and animation speed multipliers (0.5x, 1x, 2x).
* **Examples:**
  * *Sorting Grids:* Bars of varying heights swapping positions with highlighted colors indicating comparisons (yellow) and swaps (red).
  * *Dynamic Programming (Knapsack):* A 2D grid matrix where cells animate as they are populated, drawing lines from previous dependent sub-problem cells.

---

## 14. USER PROGRESS TRACKING
* **Progression:** When a user achieves an `Accepted` verdict on a problem, the system marks the problem as solved. Completing all problems in a topic unlocks the next topic in the Learning Path.
* **Elo Rating System:** Multiplayer battles calculate Elo rating exchanges based on win/loss, solve time, and accuracy. Rankings dictate global leaderboard positions.
* **Dashboard:** Displays visual heatmaps of activity, win rates, and current level progression.

---

## 15. DEPLOYMENT & INFRASTRUCTURE
* **Docker Compose:** The entire infrastructure is orchestratable via `docker-compose.yml`. It defines services for the SQL Server, Redis (if configured for distributed SignalR), and the .NET API.
* **Configuration:** Managed strictly via `appsettings.json` and environment variables.
* **Ports:** The backend runs on `1574` (HTTP) or `7058` (HTTPS). The Vite frontend runs on `5174`.

---

## 16. TESTING
* **Backend:** Comprehensive unit testing using `xUnit`, `Moq`, and `FluentAssertions`.
* **Focus Areas:** Matchmaking logic, Elo rating algorithms, and Docker code execution sandboxing were heavily unit-tested to ensure thread safety and competitive integrity.
* **Bug Fixes:** 
  * *Issue:* EF Core `GetByIdAsync` caching caused navigation properties (Problems/Users) to be missing in SignalR Friend Battles.
  * *Fix:* Populated entities directly during the battle creation loop and switched query approaches to ensure database roundtrips for correct tracking.

---

## 17. IMPLEMENTATION METHODOLOGY
* **Agile/Scrum:** The project was built using an iterative approach. Sprints were divided into modules (Auth -> Visualization -> Code Execution -> Multiplayer -> AI).
* **Version Control:** Managed via Git with branch protection. Feature branches (`feature/docker-engine`, `feature/battle-arena`) were used and merged into `main` after stabilization.

---

## 18. NOTABLE CHALLENGES & ARCHITECTURAL DECISIONS
* **Docker Security vs Performance:** Striking a balance between secure isolation and fast execution was difficult. Initializing a new Docker container per submission introduces overhead. To solve this, lightweight alpine base images are used, and the container lifecycle is strictly managed to ensure it destroys itself immediately after stdout is read.
* **SignalR State Sync:** Synchronizing battle state (timer, active problem) across two separate clients seamlessly required a robust ping/pong architecture and careful handling of disconnection/reconnection logic in the React `useEffect` hooks.
* **Gemini API Integration:** The integration was built asynchronously, with loading skeletons on the frontend to ensure the user interface never blocks while waiting for the model's response.
