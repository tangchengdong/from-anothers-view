@echo off
echo ====================================
echo   换个视角看世界 - 启动脚本
echo ====================================
echo.

echo [1/2] 启动后端服务...
start "Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] 启动前端服务...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo 启动完成！
echo 前端地址: http://localhost:3000
echo 后端API:  http://localhost:8000
echo API文档:  http://localhost:8000/docs
echo.
echo 演示账号: test / test123456
echo.
pause
