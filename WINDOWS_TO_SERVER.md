# 🖥️ Windows'dan Serverga Ulanish va Yangilash

## ⚠️ MUHIM: Bu buyruqlar SERVERDA ishlatiladi, Windows'da emas!

Windows terminalida buyruqlarni bajarmang. Avval serverga SSH orqali ulaning.

## 🔧 Qadam 1: Serverga SSH orqali Ulanish

Windows'da quyidagi usullardan birini ishlating:

### Variant 1: PowerShell yoki CMD

```powershell
ssh root@rash.uz
# yoki
ssh username@rash.uz
```

### Variant 2: PuTTY (Agar SSH o'rnatilmagan bo'lsa)

1. PuTTY'ni yuklab oling: https://www.putty.org/
2. Host Name: `rash.uz`
3. Port: `22`
4. Connection type: `SSH`
5. Open tugmasini bosing
6. Login va parolni kiriting

### Variant 3: Windows Terminal

Windows Terminal'da yangi tab ochib:
```powershell
ssh root@rash.uz
```

## 🔧 Qadam 2: Serverga Ulangandan Keyin

Serverga ulangandan keyin (Linux terminalida) quyidagi buyruqlarni bajaring:

```bash
# 1. Papkaga kirish
cd /var/www/rash

# 2. PM2'ni to'xtatish
pm2 stop rash

# 3. Git yangilash
git fetch origin
git reset --hard origin/main
git pull origin main

# 4. Dependencies
npm install

# 5. Prisma
npx prisma generate
npx prisma db push

# 6. Build
rm -rf .next
npm run build

# 7. PM2 restart
pm2 restart rash
pm2 save

# 8. Tekshirish
pm2 status
pm2 logs rash --lines 50
```

## ⚡ Tezkor Komanda (Serverda):

```bash
cd /var/www/rash && \
pm2 stop rash && \
git fetch origin && \
git reset --hard origin/main && \
git pull origin main && \
npm install && \
npx prisma generate && \
npx prisma db push && \
rm -rf .next && \
npm run build && \
pm2 restart rash && \
pm2 save && \
pm2 status
```

## 📝 Eslatmalar:

1. **Windows'da emas, Serverda** - Barcha buyruqlar serverda (Linux) ishlatiladi
2. **SSH kerak** - Avval serverga SSH orqali ulanish kerak
3. **Papka** - Serverda `/var/www/rash` papkasida bo'lishingiz kerak
4. **Git repository** - Serverda git repository bo'lishi kerak

## 🐛 Agar SSH ishlamasa:

### Windows 10/11'da SSH o'rnatish:

```powershell
# PowerShell'da (Administrator sifatida):
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### Yoki PuTTY ishlating:

1. PuTTY'ni yuklab oling
2. Host: `rash.uz`
3. Port: `22`
4. Open

## ✅ Tekshirish:

Serverga ulangandan keyin:

```bash
# Papkani tekshirish
pwd
# Natija: /var/www/rash bo'lishi kerak

# Git holatini tekshirish
git status

# PM2 status
pm2 status
```
