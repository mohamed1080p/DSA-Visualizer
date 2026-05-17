FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DSA-Visualizer.slnx ./
COPY DSA-Visualizer/DSA-Visualizer.csproj DSA-Visualizer/
COPY Core/Domain/Domain.csproj Core/Domain/
COPY Core/ServicesAbstraction/ServicesAbstraction.csproj Core/ServicesAbstraction/
COPY Core/Services/Services.csproj Core/Services/
COPY Infrastructure/Persistence/Persistence.csproj Infrastructure/Persistence/
COPY Infrastructure/Presentation/Presentation.csproj Infrastructure/Presentation/
COPY Infrastructure/External/Infrastructure.External.csproj Infrastructure/External/
COPY Shared/Shared.csproj Shared/

RUN dotnet restore DSA-Visualizer/DSA-Visualizer.csproj

COPY . .
RUN dotnet publish DSA-Visualizer/DSA-Visualizer.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "DSA-Visualizer.dll"]