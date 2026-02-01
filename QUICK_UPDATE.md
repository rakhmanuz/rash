# Tezkor Yangilash - Serverda

## Muammo:
Siz `/root` folder'da ekansiz, lekin project `/var/www/rash` folder'da.

## Yechim:

```bash
# 1. To'g'ri folder'ga o'tish (MUHIM!)
cd /var/www/rash

# 2. Git'dan yangi kodlarni olish
git pull origin main

# 3. Build qilish
npm run build

# 4. PM2'ni restart qilish
pm2 restart rash

# 5. Statusni tekshirish
pm2 status

# 6. Loglarni tekshirish
pm2 logs rash --lines 20
```

## To'liq Buyruqlar:

```bash
# Barcha buyruqlarni bir vaqtda
cd /var/www/rash && git pull origin main && npm run build && pm2 restart rash && pm2 status
```

## Tekshirish:

1. **Folder to'g'ri ekanligini tekshirish:**
   ```bash
   pwd
   # Natija: /var/www/rash bo'lishi kerak
   ```

2. **Git repository mavjudligini tekshirish:**
   ```bash
   ls -la .git
   # .git folder ko'rinishi kerak
   ```

3. **Package.json mavjudligini tekshirish:**
   ```bash
   ls -la package.json
   # package.json fayli ko'rinishi kerak
   ```

## Agar Muammo Bo'lsa:

1. **Folder mavjudligini tekshirish:**
   ```bash
   ls -la /var/www/rash
   ```

2. **Agar folder yo'q bo'lsa:**
   ```bash
   mkdir -p /var/www/rash
   cd /var/www/rash
   git clone https://github.com/rakhmanuz/rash.git .
   ```
