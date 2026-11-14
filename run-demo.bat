@echo off
setlocal enabledelayedexpansion

title PayFence Demo Launcher

echo ========================================================
echo PayFence: Autonomous Payment Security Gateway Demo
echo B.Tech CSE Cybersecurity Summer Training Project
echo ========================================================
echo.

:: 1. Check Python installation
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not installed or not in PATH.
    echo Please install Python 3.9+ from https://python.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('python --version') do set PYTHON_VERSION=%%v
echo [OK] Detected Python: %PYTHON_VERSION%

:: 2. Check Node.js installation (for frontend)
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js (v18 or higher) from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Detected Node.js: %NODE_VERSION%

:: 3. Setup Python Backend dependencies
echo.
echo [1/4] Checking Python backend dependencies (flask, flask-cors)...
python -c "import flask, flask_cors" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing backend dependencies with pip...
    python -m pip install -r "%~dp0backend\requirements.txt"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Python dependencies.
        pause
        exit /b 1
    )
) else (
    echo [OK] Python dependencies verified.
)

:: 4. Setup Frontend dependencies
echo.
echo [2/4] Checking Frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend npm install failed.
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo [OK] Frontend dependencies found.
)

:: 5. Launch Python Backend (Port 5000)
echo.
echo [3/4] Starting PayFence Python Backend on http://localhost:5000 ...
start "PayFence Python Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

:: 6. Launch React Frontend (Port 5173)
echo.
echo [4/4] Starting PayFence React Frontend on http://localhost:5173 ...
start "PayFence React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: 7. Wait and Open Browser
echo.
echo Waiting 4 seconds for services to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo PayFence is now running:
echo  - Frontend Dashboard: http://localhost:5173
echo  - Python Backend API: http://localhost:5000
echo.
echo Demo Credentials:
echo  - Email: admin@college.edu
echo  - Password: admin123
echo  (Or click 'Quick Demo Login' on the login screen)
echo.
echo Keep the backend and frontend terminal windows open.
echo Close those windows to stop the services.
echo ========================================================
