@echo off
echo ====================================
echo Kompyuteringizning Local IP Manzili
echo ====================================
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ====================================
echo Yuqoridagi IP manzilni yozib oling!
echo Bu IP manzilni Router sozlamalarida ishlatamiz.
echo ====================================
echo.
pause
