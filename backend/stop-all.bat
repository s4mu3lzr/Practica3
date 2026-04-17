@echo off
echo Deteniendo todos los procesos en los puertos 3001, 3002, 3003 y 4000...

for %%P in (3001 3002 3003 4000) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":%%P"') do (
        echo Matando PID %%a en el puerto %%P
        taskkill /F /PID %%a 2>nul
    )
)

echo Microservicios detenidos correctamente.
pause
