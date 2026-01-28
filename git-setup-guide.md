# Git va GitHub - IQMax uchun qo'llanma

## 1. Git o'rnatish (Windows)

1. https://git-scm.com/download/win dan Git'ni yuklab oling
2. O'rnatish jarayonida barcha default sozlamalarni tanlang
3. PowerShell'da tekshiring:
   ```powershell
   git --version
   ```

## 2. GitHub hisob yaratish

1. https://github.com ga kiring
2. "Sign up" tugmasini bosing
3. Email, parol va username kiriting
4. Email'ni tasdiqlang

## 3. IQMax proyektini GitHub'ga yuklash

### Kompyuteringizda (PowerShell):

```powershell
# 1. Proyekt papkasiga kiring
cd C:\IQMax

# 2. Git'ni ishga tushiring (bir marta)
git init

# 3. Barcha fayllarni qo'shing
git add .

# 4. Birinchi saqlash (commit)
git commit -m "IQMax proyektining birinchi versiyasi"

# 5. GitHub'da repo yaratgandan keyin, quyidagilarni bajaring:
# (GitHub'dan berilgan komandalarni o'z repo URL'ingizga o'zgartiring)

git remote add origin https://github.com/YOUR_USERNAME/iqmax.git
git branch -M main
git push -u origin main
```

**Muhim:** `YOUR_USERNAME` o'rniga o'z GitHub username'ingizni yozing!

## 4. VPS'da GitHub'dan olish

### VPS'da (SSH terminalda):

```bash
cd /var/www/iqmax
git clone https://github.com/YOUR_USERNAME/iqmax.git .
```

## 5. Keyingi o'zgarishlarni yuborish

### Kompyuteringizda o'zgartirganingizdan keyin:

```powershell
cd C:\IQMax
git add .
git commit -m "Yangi o'zgarishlar"
git push
```

### VPS'da yangilash:

```bash
cd /var/www/iqmax
git pull
npm ci
npm run build
pm2 restart iqmax
```

## 6. Asosiy Git komandalar

| Komanda | Nima qiladi |
|---------|-------------|
| `git status` | Qaysi fayllar o'zgarganini ko'rsatadi |
| `git add .` | Barcha o'zgarishlarni qo'shadi |
| `git commit -m "xabar"` | O'zgarishlarni saqlaydi |
| `git push` | GitHub'ga yuboradi |
| `git pull` | GitHub'dan yangilashlarni oladi |
| `git log` | Barcha saqlangan versiyalarni ko'rsatadi |

## 7. .env fayl haqida

`.env` fayl `.gitignore` da, shuning uchun GitHub'ga yuklanmaydi.
Har bir joyda (kompyuter va VPS) `.env` ni alohida yaratish kerak.
