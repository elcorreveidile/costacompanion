#!/bin/bash
cd /Users/blablaele/Desktop/AI/Costa-companion

echo "=== Verificando estado de git ==="
git status

echo ""
echo "=== Añadiendo cambios ==="
git add -A

echo ""
echo "=== Haciendo commit ==="
git commit -m "fix: type assertions for TypeScript build errors"

echo ""
echo "=== Haciendo push a GitHub ==="
git push origin main

echo ""
echo "=== Proceso completado ==="
