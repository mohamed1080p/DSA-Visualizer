# Contributing Guidelines

We welcome contributions to DSA Visualizer! To maintain the high senior-engineering standards of this repository, please adhere to the following guidelines.

## Development Setup
1. Install .NET 10 SDK, Node.js v20+, Docker Desktop, and SQL Server.
2. Clone the repository.
3. Start external dependencies (Redis, Database) via docker-compose (if available) or locally.
4. Set up the Database: `dotnet ef database update --project Infrastructure/Persistence --startup-project DSA-Visualizer`.
5. Run the API: `dotnet run --project DSA-Visualizer`.
6. Run the Frontend: `cd client && npm run dev`.

## Code Guidelines
- **Clean Architecture**: Adhere strictly to the layer boundaries. Dependencies point inwards.
- **Domain-Driven Design**: Domain models should be rich (not anemic). Use private setters and encapsulate business logic within the entities.
- **Naming Conventions**: Use PascalCase for C# classes/methods, camelCase for variables/TypeScript. Suffix Async methods with `Async`.
- **Cyclomatic Complexity**: Keep methods short and readable. Break down long methods. Avoid deep nesting.
- **No Magic Numbers**: Extract magic numbers to constants or enums.

## Pull Request Process
1. Create a feature branch (`feat/your-feature` or `fix/your-fix`).
2. Include comprehensive unit tests for all domain and service logic.
3. Ensure `dotnet test` and `npm run lint` pass.
4. Keep PRs focused and small.
5. Get at least one approval from a senior engineer before merging.
