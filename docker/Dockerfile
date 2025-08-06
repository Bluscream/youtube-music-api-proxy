# Multi-stage build for YouTube Music API Proxy
# Supports: Linux (amd64, arm64), Windows (with Docker Desktop), macOS (with Docker Desktop)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Build arguments
ARG BUILD_CONFIGURATION=Release

# Copy csproj and restore dependencies
COPY ["YoutubeMusicAPIProxy.csproj", "./"]
# RUN dotnet clean
RUN dotnet restore "YoutubeMusicAPIProxy.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "YoutubeMusicAPIProxy.csproj" -c ${BUILD_CONFIGURATION} -o /app/build

# Generate HTTPS development certificate in build stage
RUN dotnet dev-certs https --clean && \
    dotnet dev-certs https

# Publish
FROM build AS publish
RUN dotnet publish "YoutubeMusicAPIProxy.csproj" -c ${BUILD_CONFIGURATION} -o /app/publish \
    /p:UseAppHost=true \
    /p:OptimizeImplicitlyTriggeredBuild=true \
    /p:EnableCompressionInSingleFile=true \
    /p:DebugType=None \
    /p:DebugSymbols=false \
    /p:PublishTrimmed=false \
    /p:EnableUnsafeBinaryFormatterSerialization=false \
    /p:EnableUnsafeUTF7Encoding=false \
    /p:EventSourceSupport=false \
    /p:HttpActivityPropagationSupport=false \
    /p:InvariantGlobalization=true \
    /p:MetadataUpdaterSupport=false \
    /p:TrimMode=None

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
LABEL org.opencontainers.image.source=https://github.com/bluscream/youtube-music-api-proxy
WORKDIR /app

# Build arguments
ARG BUILD_CONFIGURATION=Release

# Install Node.js for YouTubeSessionGenerator
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy HTTPS certificates from build stage
COPY --from=build /root/.dotnet/corefx/cryptography/x509stores/my /root/.dotnet/corefx/cryptography/x509stores/my

# Copy published app
COPY --from=publish /app/publish .

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 80 443

# Set environment variables for container deployment
ENV ASPNETCORE_URLS=http://+:80;https://+:443
ENV ASPNETCORE_ENVIRONMENT=${BUILD_CONFIGURATION}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

ENTRYPOINT ["dotnet", "YoutubeMusicAPIProxy.dll"] 
