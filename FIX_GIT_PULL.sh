#!/bin/bash

# Git pull xatolikni tuzatish

echo "🔧 Git pull xatolikni tuzatish..."
echo ""

cd /var/www/rash || exit 1

# Local o'zgarishlarni saqlash
if [ -n "$(git status --porcelain)" ]; then
    echo "Local o'zgarishlar mavjud, stash qilinmoqda..."
    git stash
    echo "✅ Local o'zgarishlar stash qilindi"
fi

# Git pull
echo ""
echo "Git pull qilinmoqda..."
git pull origin main

echo ""
echo "✅ Git pull yakunlandi!"
