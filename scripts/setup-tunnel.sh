#!/bin/bash

# ============================================
# Cloudflare Tunnel Kurulum Scripti
# ============================================
# Bu script Cloudflare Tunnel'ı ilk kez kurar
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║      🔧 Cloudflare Tunnel Kurulum Sihirbazı       ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. cloudflared kurulu mu?
echo -e "${YELLOW}1️⃣  cloudflared kontrol ediliyor...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}   cloudflared kuruluyor...${NC}"
    brew install cloudflared
fi
echo -e "${GREEN}   ✅ cloudflared hazır${NC}"

# 2. Cloudflare'a giriş
echo ""
echo -e "${YELLOW}2️⃣  Cloudflare hesabına giriş yapılıyor...${NC}"
echo -e "${BLUE}   Tarayıcıda Cloudflare'a giriş yapın...${NC}"
cloudflared tunnel login

# 3. Tunnel oluştur
echo ""
echo -e "${YELLOW}3️⃣  'notebookpro' tunnel'ı oluşturuluyor...${NC}"
cloudflared tunnel create notebookpro

# 4. Credentials dosyasını bul ve kopyala
echo ""
echo -e "${YELLOW}4️⃣  Credentials dosyası kontrol ediliyor...${NC}"
CRED_FILE=$(ls -t ~/.cloudflared/*.json 2>/dev/null | head -1)
if [ -n "$CRED_FILE" ]; then
    TUNNEL_ID=$(basename "$CRED_FILE" .json)
    echo -e "${GREEN}   ✅ Tunnel ID: ${TUNNEL_ID}${NC}"

    CONFIG_FILE="$(dirname "$0")/../cloudflare/config.yml"
    if [ -f "$CONFIG_FILE" ]; then
        sed -i.bak "s|^tunnel: .*|tunnel: ${TUNNEL_ID}|" "$CONFIG_FILE"
        sed -i.bak "s|^credentials-file: .*|credentials-file: ${HOME}/.cloudflared/${TUNNEL_ID}.json|" "$CONFIG_FILE"
        rm -f "${CONFIG_FILE}.bak"
        echo -e "${GREEN}   ✅ cloudflare/config.yml güncellendi${NC}"
    fi

    cp "$CRED_FILE" ~/.cloudflared/notebookpro.json 2>/dev/null || true
else
    echo -e "${RED}   ❌ Credentials dosyası bulunamadı${NC}"
    exit 1
fi

# 5. DNS kaydı oluştur
echo ""
echo -e "${YELLOW}5️⃣  DNS kaydı oluşturuluyor...${NC}"
echo -e "${BLUE}   notebookpro.siyahkare.com -> tunnel${NC}"
cloudflared tunnel route dns notebookpro notebookpro.siyahkare.com
echo -e "${BLUE}   api-notebookpro.siyahkare.com -> tunnel${NC}"
cloudflared tunnel route dns notebookpro api-notebookpro.siyahkare.com

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✅ Kurulum Tamamlandı!                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Sonraki adımlar:${NC}"
echo -e "  1. ${BLUE}./scripts/start-production.sh${NC} ile sunucuyu başlatın"
echo -e "  2. ${BLUE}https://notebookpro.siyahkare.com${NC} adresini ziyaret edin"
echo ""
