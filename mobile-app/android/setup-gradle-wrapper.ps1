# PowerShell script to setup Gradle wrapper
# This downloads the gradle-wrapper.jar if it doesn't exist

$wrapperJar = "gradle\wrapper\gradle-wrapper.jar"
$wrapperProperties = "gradle\wrapper\gradle-wrapper.properties"

if (Test-Path $wrapperJar) {
    Write-Host "Gradle wrapper JAR already exists." -ForegroundColor Green
    exit 0
}

if (!(Test-Path $wrapperProperties)) {
    Write-Host "ERROR: gradle-wrapper.properties not found!" -ForegroundColor Red
    exit 1
}

# Read Gradle version from properties
$properties = Get-Content $wrapperProperties
$distributionUrl = ($properties | Select-String "distributionUrl").ToString()
$versionMatch = [regex]::Match($distributionUrl, "gradle-(\d+\.\d+)-bin\.zip")
if ($versionMatch.Success) {
    $gradleVersion = $versionMatch.Groups[1].Value
    Write-Host "Gradle version: $gradleVersion" -ForegroundColor Yellow
    
    # Download gradle-wrapper.jar from Gradle repository
    $wrapperJarUrl = "https://raw.githubusercontent.com/gradle/gradle/v$gradleVersion/gradle/wrapper/gradle-wrapper.jar"
    Write-Host "Downloading gradle-wrapper.jar..." -ForegroundColor Yellow
    
    try {
        $wrapperDir = Split-Path $wrapperJar -Parent
        if (!(Test-Path $wrapperDir)) {
            New-Item -ItemType Directory -Path $wrapperDir -Force | Out-Null
        }
        
        Invoke-WebRequest -Uri $wrapperJarUrl -OutFile $wrapperJar -UseBasicParsing
        Write-Host "Gradle wrapper JAR downloaded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download wrapper JAR. It will be downloaded automatically on first run." -ForegroundColor Yellow
        Write-Host "You can also download it manually from: $wrapperJarUrl" -ForegroundColor Yellow
    }
} else {
    Write-Host "Could not determine Gradle version. Wrapper JAR will be downloaded on first run." -ForegroundColor Yellow
}
