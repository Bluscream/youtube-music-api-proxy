@echo off
set GITHUB_USERNAME=Bluscream
set DOCKER_USERNAME=Bluscream1
@REM tools\build.cmd
powershell -ExecutionPolicy Bypass -Command "build.ps1 -Build -Publish -Git -Github -Docker -Ghcr -Repo \"youtube-music-api-proxy\""
