# Serverga yuklash (Deploy)

Loyiha serverda **www ichida**: `/var/www/rash`

---

## Serverda deploy (www ichida)

SSH orqali serverga kiring, keyin:

```bash
cd /var/www/rash
git pull origin main
```

**Monitor login/parol .env da yo'q bo'lsa** — avtomatik qo'shish (nano bilan kiritish shart emas):

```bash
bash scripts/setup-monitor-env.sh
```

Keyin deploy:

```bash
bash scripts/server-deploy.sh
```

**Hammasi bitta qatorda:**

```bash
cd /var/www/rash && git pull origin main && bash scripts/setup-monitor-env.sh && bash scripts/server-deploy.sh
```

---

## .env (www ichida: /var/www/rash/.env)

- `DATABASE_URL` — Prisma uchun
- `NEXTAUTH_SECRET` — NextAuth uchun
- `NEXTAUTH_URL` — masalan: `https://rash.uz`
- **Monitor panel** uchun: `MONITOR_LOGIN=monitor`, `MONITOR_PASSWORD=...` (parolni o'zgartiring)

---

## Tekshirish

- https://rash.uz — bosh sahifa
- https://rash.uz/login — tizimga kirish
- https://rash.uz/monitor — monitor panel (login/parol: .env dagi MONITOR_LOGIN / MONITOR_PASSWORD)

---

## Lokal: Git push

```bash
git add .
git commit -m "O'zgarishlar"
git push origin main
```

Keyin serverda yuqoridagi `cd /var/www/rash && git pull ...` ni ishlating.
