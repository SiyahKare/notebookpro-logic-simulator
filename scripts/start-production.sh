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
CONFIG_FILE="${PROJECT_DIR}/cloudflare/config.yml"
TUNNEL_REF=$(awk -F': ' '/^tunnel:/ {print $2}' "${CONFIG_FILE}" 2>/dev/null)
CREDENTIALS_FILE=$(awk -F': ' '/^credentials-file:/ {print $2}' "${CONFIG_FILE}" 2>/dev/null)

echo -e "${YELLOW}📁 Proje dizini: ${PROJECT_DIR}${NC}"

# Cloudflared kurulu mu kontrol et
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared bulunamadı!${NC}"
    echo -e "${YELLOW}Kurulum için: brew install cloudflared${NC}"
    exit 1
fi

echo -e "${GREEN}✅ cloudflared bulundu${NC}"

if [ ! -f "${CONFIG_FILE}" ]; then
    echo -e "${RED}❌ Cloudflare config bulunamadı: ${CONFIG_FILE}${NC}"
    exit 1
fi

if [ -z "${TUNNEL_REF}" ]; then
    echo -e "${RED}❌ cloudflare/config.yml içindeki tunnel değeri okunamadı${NC}"
    exit 1
fi

if [ -z "${CREDENTIALS_FILE}" ] || [ ! -f "${CREDENTIALS_FILE}" ]; then
    echo -e "${RED}❌ Tunnel credentials bulunamadı: ${CREDENTIALS_FILE}${NC}"
    echo -e "${YELLOW}Kurulum için: ./scripts/setup-tunnel.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tunnel hazır: ${TUNNEL_REF}${NC}"

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
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "tsx watch src/index.ts" 2>/dev/null || true
sleep 1

# Backend'i başlat (arka planda)
echo -e "${YELLOW}⚙️ Backend sunucusu başlatılıyor (port 5001)...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
npm run start > "${PROJECT_DIR}/server.log" 2>&1 &
BACKEND_PID=$!
cd ..

# Vite preview başlat (arka planda)
echo -e "${YELLOW}🌐 Frontend sunucusu başlatılıyor (port 4173)...${NC}"
npm run preview > "${PROJECT_DIR}/serve.log" 2>&1 &
PREVIEW_PID=$!

# Sunucuların başlamasını bekle
for _ in {1..20}; do
    if curl -sf http://127.0.0.1:4173 > /dev/null && curl -sf http://127.0.0.1:5001/api/health > /dev/null; then
        break
    fi
    sleep 1
done

# Sunucu çalışıyor mu kontrol et
if ! curl -sf http://127.0.0.1:4173 > /dev/null; then
    echo -e "${RED}❌ Frontend başlatılamadı!${NC}"
    echo -e "${YELLOW}Detaylar: ${PROJECT_DIR}/serve.log${NC}"
    exit 1
fi
if ! curl -sf http://127.0.0.1:5001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend /api/health yanıt vermiyor!${NC}"
    echo -e "${YELLOW}Detaylar: ${PROJECT_DIR}/server.log${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sunucular çalışıyor (Frontend PID: ${PREVIEW_PID}, Backend PID: ${BACKEND_PID})${NC}"

# Cloudflare Tunnel başlat
echo -e "${YELLOW}🔗 Cloudflare Tunnel başlatılıyor...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌍 Site aktif: https://notebookpro.siyahkare.com${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Durdurmak için: Ctrl+C${NC}"
echo ""

# Script sonlandığında sunucuları kapat
trap "echo -e '${YELLOW}🛑 Durduruluyor...${NC}'; kill $PREVIEW_PID $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

# Tunnel'ı config dosyası ile başlat
cloudflared tunnel --config "${CONFIG_FILE}" --logfile "${PROJECT_DIR}/tunnel.log" --loglevel info run "${TUNNEL_REF}"
