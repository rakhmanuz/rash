@echo off
echo ====================================
echo Windows Firewall Sozlash
echo ====================================
echo.

echo Port 3000 uchun firewall qoidasi qo'shilmoqda...
netsh advfirewall firewall add rule name="RASH Server HTTP" dir=in action=allow protocol=TCP localport=3000

echo.
echo Port 80 uchun firewall qoidasi qo'shilmoqda (HTTP)...
netsh advfirewall firewall add rule name="RASH Server HTTP Port 80" dir=in action=allow protocol=TCP localport=80

echo.
echo Port 443 uchun firewall qoidasi qo'shilmoqda (HTTPS)...
netsh advfirewall firewall add rule name="RASH Server HTTPS Port 443" dir=in action=allow protocol=TCP localport=443

echo.
echo ====================================
echo Firewall qoidalari muvaffaqiyatli qo'shildi!
echo ====================================
echo.
pause
