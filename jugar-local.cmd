@echo off
rem Obri el joc amb un servidor local (http://localhost:8765). Fa falta Python.
rem Aixi funciona tot com publicat, tambe el video de la tele de la DGT.
cd /d "%~dp0"
start "" http://localhost:8765/index.html
python -m http.server 8765
