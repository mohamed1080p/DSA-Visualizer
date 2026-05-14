# Architecture Overview

## Top-Level Architecture
This project follows a modern Clean Architecture style with Domain-Driven Design (DDD) principles. It is broken down into modular layered boundaries.

### Layers
1. **Core/Domain**: Contains enterprise logic, entities (e.g., `Problem`, `Submission`, `Topic`), enumerations, and repository interfaces. Domain models enforce invariants.
2. **Core/Services**: Application use-case layer. Contains implementations of application logic (e.g., `SubmissionService`, `BattleMatchmakingService`). Interfaces are defined in `Core/ServicesAbstraction`.
3. **Infrastructure/Persistence**: Contains EF Core `ApplicationDbContext`, Data Seeding, and Repository implementations (e.g., `UnitOfWork`).
4. **Infrastructure/Presentation**: Controllers exposing REST endpoints, and SignalR Hubs for real-time multiplayer features.
5. **DSA-Visualizer (Host)**: The ASP.NET Core API host project. Wires up dependency injection, authentication, observability, and serves as the entry point.

### Key Components
- **Code Execution Engine**: Leverages Docker Engine API to isolate untrusted user code execution in ephemeral containers (`python`, `csharp`, `cpp`, `java`).
- **Real-Time Multiplayer (SignalR)**: Real-time multiplayer matchmaking and session state synchronization.
- **Background Processing**: Uses Hangfire for offline/async processing like code execution queueing and score aggregation.
- **Observability**: OpenTelemetry configured for distributed tracing and metrics.
- **Frontend**: A React/TypeScript application utilizing Vite, featuring Framer Motion for high-quality animations and Monaco Editor for code input.

## Resilience
- HTTP Clients use Polly for circuit-breaking and retries (e.g., Ollama integration).
- EF Core configured with `EnableRetryOnFailure`.
- Docker containers have hard resource and time constraints to prevent fork bombs and DOS.
