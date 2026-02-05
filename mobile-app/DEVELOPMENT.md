# Development Mode - Local Testing

Agar local development server bilan ishlash kerak bo'lsa.

## 🔧 Local Development Sozlash

### 1. Capacitor config o'zgartirish

`capacitor.config.ts` faylida:

```typescript
const config: CapacitorConfig = {
  appId: 'uz.rash.app',
  appName: 'rash',
  // Local development
  server: {
    url: 'http://10.0.2.2:3000',  // Android Emulator uchun
    // yoki
    // url: 'http://YOUR_LOCAL_IP:3000',  // Real device uchun
    androidScheme: 'http',
    allowNavigation: ['*'],
    cleartext: true
  },
  // ...
}
```

### 2. Next.js dev server ishga tushirish

```bash
cd ..
npm run dev
```

### 3. Capacitor sync

```bash
cd mobile-app
npx cap sync
```

### 4. Android Studio orqali ishga tushirish

```bash
npm run open:android
```

Android Studio-da Run tugmasini bosing.

## 📱 Real Device bilan Test

1. Telefon va kompyuter bir xil Wi-Fi tarmog'ida bo'lishi kerak
2. Kompyuterning local IP manzilini toping:
   - Windows: `ipconfig`
   - Linux/Mac: `ifconfig` yoki `ip addr`
3. `capacitor.config.ts` da IP manzilni kiriting:
   ```typescript
   url: 'http://192.168.1.100:3000'  // Sizning IP manzilingiz
   ```
4. `npx cap sync` qiling
5. Android Studio-da Run qiling

## ⚠️ Production uchun

Production build uchun `capacitor.config.ts` ni qayta o'zgartiring:

```typescript
server: {
  url: 'https://rash.uz',
  androidScheme: 'https',
}
```

Keyin `npx cap sync` va build qiling.

---

**Eslatma:** Development mode faqat test uchun. Production build har doim production server URL ishlatadi.
