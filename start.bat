@echo off
setlocal

echo close node execution
call taskkill /IM node.exe /F

echo Installing root dependencies...
call npm install
if errorlevel 1 goto error

cd chatbot-api || goto error

echo Installing chatbot-api dependencies...
call npm install
if errorlevel 1 goto error

echo Starting chatbot-api in new terminal...
start "chatbot-api" cmd /k "npm run dev"

cd ..

echo Starting index.js in new terminal...
start "main server" cmd /k "node index.js"

echo Both servers started in separate terminals.
start http://localhost:3000
exit /b

:error
echo ❌ An error occurred. Press any key to exit.
pause
exit /b
