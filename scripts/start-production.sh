#!/bin/bash

# ============================================
# NotebookPro Production Start Script
# ============================================
# Bu script projeyi build edip Cloudflare Tunnel
# üzerinden notebookpro.siyahkare.com'da yayınlar
# ============================================

set -e

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║           🚀 NotebookPro Production               ║"
echo "║       notebookpro.siyahkare.com                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Proje dizinine git
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)

echo -e "${YELLOW}📁 Proje dizini: ${PROJECT_DIR}${NC}"

# Cloudflared kurulu mu kontrol et
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared bulunamadı!${NC}"
    echo -e "${YELLOW}Kurulum için: brew install cloudflared${NC}"
    exit 1
fi

echo -e "${GREEN}✅ cloudflared bulundu${NC}"

# Node modules kontrol
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Bağımlılıklar yükleniyor...${NC}"
    npm install
fi

# Build
echo -e "${YELLOW}🔨 Production build oluşturuluyor...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build başarısız!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build tamamlandı${NC}"

# Eski işlemleri temizle
echo -e "${YELLOW}🧹 Eski işlemler temizleniyor...${NC}"
pkill -f "vite preview" 2>/dev/null || true
sleep 1

# Vite preview başlat (arka planda)
echo -e "${YELLOW}🌐 Sunucu başlatılıyor (port 4173)...${NC}"
npm run preview &
PREVIEW_PID=$!

# Sunucunun başlamasını bekle
sleep 3

# Sunucu çalışıyor mu kontrol et
if ! curl -s http://localhost:4173 > /dev/null; then
    echo -e "${RED}❌ Sunucu başlatılamadı!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sunucu çalışıyor (PID: ${PREVIEW_PID})${NC}"

# Cloudflare Tunnel başlat
echo -e "${YELLOW}🔗 Cloudflare Tunnel başlatılıyor...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌍 Site aktif: https://notebookpro.siyahkare.com${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Durdurmak için: Ctrl+C${NC}"
echo ""

# Tunnel'ı config dosyası ile başlat
cloudflared tunnel --config "${PROJECT_DIR}/cloudflare/config.yml" run notebookpro

# Script sonlandığında preview'ı da kapat
trap "kill $PREVIEW_PID 2>/dev/null" EXIT

