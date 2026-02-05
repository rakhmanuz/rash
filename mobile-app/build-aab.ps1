# PowerShell script for building AAB (Android App Bundle) for Google Play

Write-Host "Building rash Mobile App AAB for Google Play..." -ForegroundColor Green

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Java is installed
if (!(Get-Command java -ErrorAction SilentlyContinue) -and !($env:JAVA_HOME)) {
    Write-Host "ERROR: Java JDK not found. Please install Java JDK 17 or higher." -ForegroundColor Red
    Write-Host "Download from: https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "Or set JAVA_HOME environment variable." -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script from mobile-app directory" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build web app
Write-Host "Building web app..." -ForegroundColor Yellow
Set-Location ..
npm run build
Set-Location mobile-app

# Sync Capacitor
Write-Host "Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync

# Build Android AAB
Write-Host "Building Android App Bundle (AAB)..." -ForegroundColor Yellow
Set-Location android
if (Test-Path "gradlew.bat") {
    .\gradlew.bat bundleRelease
} else {
    Write-Host "ERROR: gradlew.bat not found. Please run 'npx cap sync' first." -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "Build complete!" -ForegroundColor Green
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "AAB location: $aabPath" -ForegroundColor Cyan
Write-Host "This AAB file is ready to upload to Google Play Console!" -ForegroundColor Green
