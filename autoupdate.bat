@echo off

SET branche="test"
ECHO "Verification de la presence de mises a jour pour la version %branche%"
CALL git checkout %test%
CALL git fetch
