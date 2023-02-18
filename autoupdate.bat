@echo off

SET branche="main"
ECHO Verification de la presence de mises a jour pour la version %branche%
CALL git fetch 
CALL git checkout %branche%
CALL git status | FIND /i "Your branch is up to date"
if not errorlevel 1 (
  echo Pas de mise a jour en attente
) else (
  CHOICE /M "Voulez-vous telecharger la mise a jour ?"
  if errorlevel 2 GOTO END
  CALL git pull
  CALL initialisation.bat
)
:END