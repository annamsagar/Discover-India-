@ECHO OFF
SETLOCAL

SET MAVEN_VERSION=3.9.6
SET MAVEN_HOME=%~dp0.mvn\wrapper\maven-home\apache-maven-%MAVEN_VERSION%
SET MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip
SET MAVEN_ZIP=%~dp0.mvn\wrapper\maven-%MAVEN_VERSION%.zip

IF EXIST "%MAVEN_HOME%\bin\mvn.cmd" GOTO RUN_MAVEN

ECHO Downloading Apache Maven %MAVEN_VERSION%...
IF NOT EXIST "%~dp0.mvn\wrapper\maven-home" MKDIR "%~dp0.mvn\wrapper\maven-home"
powershell -Command "Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%' -UseBasicParsing"
IF ERRORLEVEL 1 (
    ECHO Failed to download Maven. Please install Maven manually and add to PATH.
    EXIT /B 1
)

ECHO Extracting Maven...
powershell -Command "Expand-Archive -LiteralPath '%MAVEN_ZIP%' -DestinationPath '%~dp0.mvn\wrapper\maven-home' -Force"
IF ERRORLEVEL 1 (
    ECHO Failed to extract Maven.
    EXIT /B 1
)
DEL "%MAVEN_ZIP%"

:RUN_MAVEN
SET "PATH=%MAVEN_HOME%\bin;%PATH%"
CALL mvn.cmd %*
