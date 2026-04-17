@echo off
echo Iniciando todos los microservicios...

:: Moverse a la carpeta donde está este script (.bat)
cd /d "%~dp0"

:: Usamos cmd /k para que la ventana NO se cierre si hay un error y puedas leerlo
start "Users Service (3001)" cmd /k "cd users-service && node server.js"
start "Groups Service (3003)" cmd /k "cd groups-service && node server.js"
start "Tickets Service (3002)" cmd /k "cd tickets-service && node server.js"
start "API Gateway (4000)" cmd /k "cd api-gateway && node gateway.js"

echo Todos los servicios de Backend iniciados.
