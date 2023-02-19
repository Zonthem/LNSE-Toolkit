# Installation via git

[Télécharger git](https://git-scm.com/download/win) -> option Standalone Installer 64-bit.

Cloner le repository git à l'endroit souhaité

```powershell
cd \path\to\app
git clone https://github.com/Zonthem/LNSE-Toolkit.git
```

Exécuter ensuite `autoupdate.bat`, ce script s'assurera que la dernière version est installée, exécutera ensuite lui-même `initialisation.bat`.

Git utilise un système de branche pour gérer les différentes versions de l'application. Dans le fichier `autoupdate.bat`, ça correspond à :
```
SET branche="test"
```
Dans l'exemple, la branche est "test".

3 branches sont disponibles :
- **dev** : branche de travail sur laquelle sont poussées toutes les modifications à la volée.
- **test** : branche destinée à tester la validité des derniers développements.
- **prod** : branche gradant en mémoire la dernière version validée et fonctionnelle de l'application.

> le fichier n'est pas versionné pour permettre plus de flexibilité. Il faut le créer

```batch
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
```



# Installation via zip à la con

Suffit de télécharger les sources et gérer les dossiers soi-même.

Exécuter la commande `initialisation.bat` avant tout, permet d'installer les fichiers nécessaires à l'application pour fonctionner.

Le fichier `start.bat` lancera l'application automatiquement.
