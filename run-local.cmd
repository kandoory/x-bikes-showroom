@echo off
rem Starts the local server and opens the showroom in the browser.
start "" http://localhost:5173/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
