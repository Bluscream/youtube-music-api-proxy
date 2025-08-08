@echo off
powershell -ExecutionPolicy Bypass -Command "cd src/;build.ps1 -Production"
powershell -ExecutionPolicy Bypass -Command "build.ps1 -Git -Docker -Repo \"youtube-music-api-proxy\""
