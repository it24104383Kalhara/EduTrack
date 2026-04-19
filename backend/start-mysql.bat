@echo off
echo Starting MySQL Server with your credentials...
echo.

set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=navodya@2004
set DB_NAME=edutrack_hostel
set EMAIL_HOST=smtp.gmail.com
set EMAIL_PORT=587
set EMAIL_SECURE=false
set EMAIL_USER=your_email@gmail.com
set EMAIL_PASS=your_app_password
set EMAIL_FROM=noreply@edutrack.com
set PORT=5005

echo Database Configuration:
echo DB_HOST=%DB_HOST%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_NAME=%DB_NAME%
echo.

echo Starting MySQL server...
node mysql-server.js

pause
