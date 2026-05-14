# API Documentation

## Base URL
`/api`

## Common Patterns
- **Authentication**: JWT Bearer Tokens.
- **Pagination**: Endpoints use `?page=1&pageSize=50`.
- **Standard Responses**: Endpoints aim to return unified `DTOs` from `Shared.DTOs`.

## Core Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login, returns JWT token.

### Problems
- `GET /api/problems`: Get paginated problem list.
- `GET /api/problems/{slug}`: Get full problem details.
- `POST /api/problems`: (Admin) Create a new problem.

### Submissions
- `POST /api/submissions`: Submit code for a problem. Queues execution and returns `SubmissionQueuedDTO`.
- `GET /api/submissions/{id}`: Poll for submission execution result.
- `GET /api/submissions/problem/{slug}`: Get history of submissions for a problem.

### Leaderboard
- `GET /api/leaderboard/global`: Global ranking.
- `GET /api/leaderboard/weekly`: Weekly ranking.
- `GET /api/leaderboard/friends`: Friends ranking.

### Multiplayer (SignalR)
- **Hub Endpoint**: `/hubs/battle`
- **Methods**: `JoinBattle`, `SubmitCode`, `SendTypingStatus`
- **Events**: `BattleState`, `SubmissionResult`, `OpponentResult`, `BattleFinished`
