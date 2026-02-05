# Talablar - APK Yaratish uchun

APK yaratishdan oldin quyidagi dasturlar o'rnatilgan bo'lishi kerak:

## ✅ Majburiy Talablar

### 1. Node.js (v18 yoki yuqori)
- Yuklab olish: https://nodejs.org/
- Tekshirish: `node --version`

### 2. Java JDK (17 yoki yuqori)
- Yuklab olish: https://adoptium.net/ (Temurin JDK tavsiya etiladi)
- Yoki: https://www.oracle.com/java/technologies/downloads/
- Tekshirish: `java -version`

**Muhim:** JDK o'rnatilgandan keyin `JAVA_HOME` environment variable o'rnatishingiz kerak:
- Windows: System Properties → Environment Variables → JAVA_HOME = `C:\Program Files\Java\jdk-17`
- Yoki PowerShell: `$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"`

### 3. Android SDK (ixtiyoriy, lekin tavsiya etiladi)
- Android Studio o'rnatish: https://developer.android.com/studio
- Yoki faqat Command Line Tools: https://developer.android.com/studio#command-tools

## 📦 O'rnatish Qadamlar

### 1. Node.js o'rnatish
```powershell
# Tekshirish
node --version
npm --version
```

### 2. Java JDK o'rnatish
```powershell
# Tekshirish
java -version
javac -version

# JAVA_HOME o'rnatish (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $env:JAVA_HOME, 'User')
```

### 3. Android SDK (ixtiyoriy)
Agar Android Studio o'rnatilsa, avtomatik sozlanadi.

## ✅ Tekshirish

Barcha talablar o'rnatilganini tekshirish:

```powershell
# Node.js
node --version

# Java
java -version

# JAVA_HOME
echo $env:JAVA_HOME

# Gradle (agar o'rnatilgan bo'lsa)
gradle --version
```

## 🚀 Keyingi Qadam

Talablar o'rnatilgandan keyin:

```powershell
cd mobile-app
.\build-apk.ps1
```

Yoki Google Play uchun:

```powershell
.\build-aab.ps1
```

## 🐛 Muammolar

### Java topilmayapti?
- Java JDK o'rnatilganini tekshiring
- `JAVA_HOME` environment variable o'rnatilganini tekshiring
- PowerShell'ni qayta oching

### Gradle xatosi?
- Java JDK o'rnatilganini tekshiring
- `gradlew.bat` fayli mavjudligini tekshiring

### Build xatosi?
- Barcha dependencies o'rnatilganini tekshiring: `npm install`
- Capacitor sync qiling: `npx cap sync`

---

**Eslatma:** Agar Java o'rnatilmagan bo'lsa, build skriptlari xato ko'rsatadi va yordam beradi.
