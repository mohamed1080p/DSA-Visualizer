# Production Runbooks

## 1. Service Startup
1. **Dependencies**: Ensure Docker is running. Ensure Redis is reachable (optional but recommended). Ensure SQL Server is online. Ensure Ollama is running.
2. **Database Migration**: Run `dotnet ef database update --project Infrastructure/Persistence --startup-project DSA-Visualizer`.
3. **Start Application**: Run `dotnet run --project DSA-Visualizer`.

## 2. Deployment
1. Build the frontend using `npm run build` in `/client`.
2. Move `/client/dist` to the static files directory of the backend or serve separately via NGINX.
3. Build the backend using `dotnet publish -c Release`.
4. Deploy the backend binaries to the server.
5. Apply database migrations.
6. Restart the backend service.

## 3. Rollback
1. Revert to the previous backend binaries.
2. Revert to the previous frontend build.
3. If database changes are breaking, run `dotnet ef database update <PreviousMigration>`.

## 4. Incident Response
1. **Acknowledge Alert**: Check Grafana/Kibana for the active alert.
2. **Identify Scope**: Determine if the outage is partial or full.
3. **Mitigate**: If a bad deployment caused the issue, rollback immediately.
4. **Investigate**: Analyze metrics and logs for root cause.
5. **Resolve & Document**: Apply fix and document in a post-mortem.

## 5. Redis Failure Recovery
1. **Symptom**: Matchmaking queues stall, leaderboard updates fail.
2. **Action**: The system degrades gracefully to in-memory mode if Redis goes offline on startup, but during runtime, `ConnectionMultiplexer` will attempt to reconnect.
3. **Resolution**: Check Redis service status. Restart Redis if OOM or crashed. The application will reconnect automatically.

## 6. Database Migration Rollback
1. **Symptom**: Application fails to start after deployment due to DB schema mismatch.
2. **Action**: Execute `dotnet ef database update <PreviousMigrationName>`.
3. **If Data Loss is Acceptable**: Drop the problematic tables and re-apply migrations. Otherwise, restore from backup.

## 7. High CPU Response
1. **Symptom**: CPU usage > 90% consistently.
2. **Action**: Check `dotnet-counters` and `dotnet-dump` to identify hot paths.
3. **Resolution**: Often caused by infinite loops, regex DOS, or GC thrashing. Scale horizontally while investigating the specific process. Check CodeExecutionService containers.

## 8. Memory Leak Response
1. **Symptom**: Memory usage steadily increases over time without dropping after GC.
2. **Action**: Capture a memory dump using `dotnet-dump collect -p <pid>`.
3. **Resolution**: Analyze the dump with `dotnet-dump analyze` to find rooted objects. Typical culprits are static dictionaries, undisposed HttpClient/DockerClient, or event handlers.
