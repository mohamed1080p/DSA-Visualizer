# Deployment

To keep the site online after your PC is off, run it on a VPS or cloud VM with Docker installed. The repository now includes a server-ready compose stack that keeps the app and SQL Server running with restart policies.

## Recommended server setup

1. Provision a Linux VM with Docker and Docker Compose.
2. Copy this repository onto the server.
3. Create a production `.env` file from [`.env.example`](.env.example) and fill in real values.
4. Start the stack with `docker compose -f docker-compose.server.yml up -d --build` from the repository root.
5. Open port `8080` on the VM or place a reverse proxy/load balancer in front of it.

Docker Compose automatically reads `.env` from the repository root, so that file is the easiest place to store the server values.

## Production environment values

Set these in the server `.env` file before starting the stack:

- `MSSQL_SA_PASSWORD`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `HANGFIRE_LOGIN`
- `HANGFIRE_PASSWORD`
- `APP_ORIGIN`
- `ALLOWED_HOSTS`
- `GEMINI__APIKEY`

## What the server stack includes

- The ASP.NET backend built from [DSA-Visualizer/Dockerfile](DSA-Visualizer/Dockerfile)
- A persistent SQL Server container
- Automatic restart policies for all long-running services
- Mounted Docker socket access so C# submissions can still run in isolated sandbox containers

## Example `.env`

```env
MSSQL_SA_PASSWORD=Use-a-long-random-password-123!
JWT_SECRET=Use-a-different-long-random-secret-123!
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me
GITHUB_CLIENT_ID=replace-me
GITHUB_CLIENT_SECRET=replace-me
HANGFIRE_LOGIN=admin
HANGFIRE_PASSWORD=admin123!
APP_ORIGIN=https://your-domain.example
ALLOWED_HOSTS=your-domain.example
GEMINI__APIKEY=your-gemini-api-key-here
```

## Important notes

- The chat bot only works when a valid Gemini API key is configured in the `GEMINI__APIKEY` environment variable.
- The C# submission runner still requires Docker on the server host because the sandbox containers are launched from the backend.
- If you want HTTPS and a public domain, put the stack behind a reverse proxy or cloud tunnel.