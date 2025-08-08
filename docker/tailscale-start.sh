#!/bin/bash
set -e

# Function to start Tailscale
start_tailscale() {
    echo "Starting Tailscale..."
    
    # Check if Tailscale is enabled
    if [ "${TAILSCALE_ENABLED}" != "true" ]; then
        echo "Tailscale is disabled, starting application directly..."
        exec dotnet YoutubeMusicAPIProxy.dll
        return
    fi
    
    # Check if we have the required environment variables
    if [ -z "${TAILSCALE_AUTHKEY}" ]; then
        echo "Warning: TAILSCALE_AUTHKEY not set. Tailscale will not be started."
        echo "Starting application without Tailscale..."
        exec dotnet YoutubeMusicAPIProxy.dll
        return
    fi
    
    # Set hostname for Tailscale
    HOSTNAME="${TAILSCALE_HOSTNAME:-youtube-music-api-proxy}"
    
    # Start Tailscale in the background
    echo "Starting Tailscale with hostname: ${HOSTNAME}"
    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
    TAILSCALED_PID=$!
    
    # Wait for tailscaled to be ready
    sleep 2
    
    # Authenticate with Tailscale
    echo "Authenticating with Tailscale..."
    tailscale up \
        --authkey="${TAILSCALE_AUTHKEY}" \
        --hostname="${HOSTNAME}" \
        --advertise-tags="${TAILSCALE_TAGS:-tag:youtube-music}" \
        --accept-dns=false \
        --accept-routes=false \
        --shields-up=false \
        --reset
    
    # Wait for Tailscale to be fully connected
    echo "Waiting for Tailscale to connect..."
    for i in {1..30}; do
        if tailscale status --socket=/var/run/tailscale/tailscaled.sock | grep -q "Running"; then
            echo "Tailscale is connected!"
            break
        fi
        echo "Waiting for Tailscale connection... (attempt $i/30)"
        sleep 2
    done
    
    # Show Tailscale status
    echo "Tailscale status:"
    tailscale status --socket=/var/run/tailscale/tailscaled.sock
    
    # Start the main application
    echo "Starting YouTube Music API Proxy..."
    exec dotnet YoutubeMusicAPIProxy.dll
}

# Handle shutdown gracefully
cleanup() {
    echo "Shutting down..."
    if [ ! -z "${TAILSCALED_PID}" ]; then
        echo "Stopping Tailscale..."
        kill ${TAILSCALED_PID} 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start the application
start_tailscale
