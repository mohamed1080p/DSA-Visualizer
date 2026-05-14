# Testing Guide

## Philosophy
This project values high-quality, reliable, and deterministic tests. We aim for:
- **Behavior-Driven Tests**: Test the behavior, not the internal implementation.
- **Edge Cases**: Always write tests for nulls, boundaries, empty inputs, and invalid states.
- **No Flakiness**: Avoid thread.sleep or unpredictable asynchronous assertions. Use abstractions for time (`TimeProvider`) and explicit polling.

## Test Projects
- `DSA.Visualizer.Tests`: The primary xUnit test project containing Domain and Service level unit tests.
- `LoadTests`: NBomber load test project to validate performance SLAs.

## Running Tests
Run all unit tests using the standard .NET CLI:
```bash
dotnet test
```

## Adding Tests
When writing tests:
1. **Arrange, Act, Assert**: Follow the AAA pattern strictly.
2. **Mocking**: Use `Moq` or `NSubstitute` to mock external dependencies (e.g., `ICodeExecutionService`, `IUnitOfWork`).
3. **Factories**: Use builder patterns or object mothers for complex test data setup to avoid duplicated test setups.

## Assertions
Ensure assertions are strong. Do not just assert that an object is not null. Assert its state, verify invariants, and verify side effects on mocks where appropriate.
