# Router Port Forwarding Sozlash (WiFi)

Endi WiFi'ga ulangan bo'lganingiz uchun router orqali Port Forwarding qilish mumkin.

## 1. Kompyuteringizning Local IP Manzilini Topish

Yuqoridagi buyruq natijasida ko'rsatilgan IP manzilni yozib oling.

## 2. Router Admin Paneliga Kirish

1. Browser'da quyidagi manzillarni urinib ko'ring:
   - `http://192.168.1.1`
   - `http://192.168.0.1`
   - `http://10.0.0.1`
   - `http://172.16.0.1`

2. Yoki router'ingizning qo'llanmasidagi manzilni ishlating.

3. Login qiling (odatda):
   - Username: `admin`
   - Password: `admin` yoki router'ingizning default paroli

## 3. Port Forwarding Bo'limini Topish

Quyidagi bo'limlardan birini toping:
- Port Forwarding
- Virtual Server
- NAT Forwarding
- Advanced → Port Forwarding
- Firewall → Port Forwarding

## 4. Yangi Qoida Qo'shish

Quyidagi ma'lumotlarni kiriting:

### HTTP (Port 80) uchun:
- **Service Name:** `RASH HTTP`
- **External Port:** `80`
- **Internal IP:** `YOUR_LOCAL_IP` (yuqoridagi IP manzil)
- **Internal Port:** `3000`
- **Protocol:** `TCP`
- **Status:** `Enabled`

### HTTPS (Port 443) uchun (ixtiyoriy):
- **Service Name:** `RASH HTTPS`
- **External Port:** `443`
- **Internal IP:** `YOUR_LOCAL_IP`
- **Internal Port:** `3000`
- **Protocol:** `TCP`
- **Status:** `Enabled`

## 5. Saqlash

"Save" yoki "Apply" tugmasini bosing.

## 6. Public IP Manzilni Topish

Kompyuteringizning public IP manzilini topish:

```bash
# get-ip.bat faylini ishga tushiring
```

Yoki browser'da: https://whatismyip.com

## 7. DNS Sozlash

Domain provayderingizda:
1. DNS menejerga kiring
2. A Record'ni yangilang:
   - **Name:** `@`
   - **Type:** `A`
   - **Value:** Public IP manzil (whatismyip.com dan)
   - **TTL:** `3600`

## 8. Tekshirish

1. Server ishga tushirilganligini tekshiring:
   ```bash
   pm2 status
   ```

2. Browser'da tekshiring:
   - `http://rash.uz`
   - Yoki `http://YOUR_PUBLIC_IP:3000`

## Router Brendlariga Qarab Qo'llanma

### TP-Link:
1. Advanced → NAT Forwarding → Port Forwarding
2. "Add" tugmasini bosing
3. Ma'lumotlarni kiriting va saqlang

### D-Link:
1. Advanced → Port Forwarding
2. "Add Rule" tugmasini bosing
3. Ma'lumotlarni kiriting va saqlang

### ASUS:
1. WAN → Virtual Server / Port Forwarding
2. "Add Profile" tugmasini bosing
3. Ma'lumotlarni kiriting va saqlang

### ZTE/Huawei:
1. Advanced → NAT → Port Mapping
2. "Add" tugmasini bosing
3. Ma'lumotlarni kiriting va saqlang
