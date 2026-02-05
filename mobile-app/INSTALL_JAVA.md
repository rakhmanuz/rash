# Java JDK O'rnatish - Windows

APK yaratish uchun Java JDK 17 yoki yuqori versiya kerak.

## 🚀 Tezkor O'rnatish

### 1. Java JDK Yuklab Olish

**Tavsiya etilgan:** Eclipse Temurin (OpenJDK)
- Veb-sayt: https://adoptium.net/
- Versiya: **JDK 17 LTS** yoki **JDK 21 LTS**
- Platform: Windows x64
- Format: `.msi` installer (tavsiya etiladi)

**Yoki Oracle JDK:**
- Veb-sayt: https://www.oracle.com/java/technologies/downloads/
- Versiya: Java 17 yoki 21

### 2. O'rnatish

1. Yuklab olgan `.msi` faylni ishga tushiring
2. "Next" tugmalarini bosing
3. **Muhim:** "Set JAVA_HOME variable" ni belgilang (checkbox)
4. O'rnatishni yakunlang

### 3. Tekshirish

PowerShell'ni **qayta oching** (yangi terminal) va quyidagilarni tekshiring:

```powershell
# Java versiyasini tekshirish
java -version

# Java compiler tekshirish
javac -version

# JAVA_HOME tekshirish
echo $env:JAVA_HOME
```

Agar `java -version` ishlamasa, quyidagilarni bajaring:

## 🔧 Manual Sozlash (agar avtomatik ishlamasa)

### JAVA_HOME o'rnatish

1. Java o'rnatilgan joyni toping (odatda):
   - `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - `C:\Program Files\Java\jdk-17`
   - `C:\Program Files\Java\jdk-21`

2. Environment Variable o'rnatish:

**PowerShell (temporary - faqat joriy session uchun):**
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

**Permanent (barcha sessionlar uchun):**
```powershell
# Administrator sifatida ishga tushiring
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot', 'Machine')
[System.Environment]::SetEnvironmentVariable('PATH', "$env:PATH;C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot\bin", 'Machine')
```

**Yoki GUI orqali:**
1. Windows + R → `sysdm.cpl` → Enter
2. "Advanced" tab → "Environment Variables"
3. "System variables" da "New" tugmasini bosing
4. Variable name: `JAVA_HOME`
5. Variable value: Java o'rnatilgan yo'l (masalan: `C:\Program Files\Eclipse Adoptium\jdk-17.0.9+9-hotspot`)
6. "Path" variable ni tanlang → "Edit"
7. "New" tugmasini bosing → `%JAVA_HOME%\bin` qo'shing
8. "OK" tugmalarini bosing
9. **PowerShell'ni qayta oching**

### 3. Tekshirish (qayta)

```powershell
java -version
javac -version
echo $env:JAVA_HOME
```

## ✅ Keyingi Qadam

Java o'rnatilgandan keyin:

```powershell
cd C:\IQMax\mobile-app
.\build-apk.ps1
```

Yoki Google Play uchun:

```powershell
.\build-aab.ps1
```

## 🐛 Muammolar

### "java is not recognized"
- PowerShell'ni qayta oching
- JAVA_HOME to'g'ri o'rnatilganini tekshiring
- Path variable ga `%JAVA_HOME%\bin` qo'shilganini tekshiring

### "JAVA_HOME is not set"
- Environment variable o'rnatilganini tekshiring
- PowerShell'ni qayta oching

### Versiya xatosi
- JDK 17 yoki yuqori o'rnatilganini tekshiring
- `java -version` bilan versiyani ko'ring

---

**Tayyor!** Java o'rnatilgandan keyin APK yaratishingiz mumkin! 🚀
