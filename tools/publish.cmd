@echo off
set GITHUB_USERNAME=Bluscream
set DOCKER_USERNAME=Bluscream1

powershell -ExecutionPolicy Bypass -Command "build.ps1 -Git -Github -Docker -Ghcr -Repo \"youtube-music-api-proxy\""
