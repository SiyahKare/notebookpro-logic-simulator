# 🚀 NotebookPro Deployment Rehberi

## Cloudflare Tunnel ile Local Deployment

Bu döküman, NotebookPro'yu `notebookpro.siyahkare.com` adresinden Cloudflare Tunnel üzerinden nasıl yayınlayacağınızı açıklar.

---

## 📋 Gereksinimler

- Node.js 18+
- Cloudflare hesabı (siyahkare.com domain'i bağlı)
- `cloudflared` CLI aracı

---

## 🔧 Kurulum

### 1. cloudflared Kurulumu (macOS)

```bash
brew install cloudflared
```

### 2. Cloudflare Tunnel Kurulumu (İlk Kez)

```bash
# Kurulum scriptini çalıştır
chmod +x scripts/setup-tunnel.sh
./scripts/setup-tunnel.sh
```

**Manuel kurulum:**

```bash
# 1. Cloudflare'a giriş
cloudflared tunnel login

# 2. Tunnel oluştur
cloudflared tunnel create notebookpro

# 3. DNS kaydı ekle
cloudflared tunnel route dns notebookpro notebookpro.siyahkare.com
```

---

## 🚀 Production'da Çalıştırma

### Otomatik (Önerilen)

```bash
chmod +x scripts/start-production.sh
./scripts/start-production.sh
```

### Manuel

**Terminal 1 - Vite Preview:**
```bash
npm run build
npm run preview
```

**Terminal 2 - Cloudflare Tunnel:**
```bash
cloudflared tunnel --config cloudflare/config.yml run notebookpro
```

---

## 📁 Dosya Yapısı

```
notebookpro-logic-simulator/
├── cloudflare/
│   └── config.yml          # Tunnel yapılandırması
├── scripts/
│   ├── setup-tunnel.sh     # İlk kurulum scripti
│   └── start-production.sh # Production başlatma
└── dist/                   # Build çıktısı
```

---

## ⚙️ Yapılandırma

### cloudflare/config.yml

```yaml
tunnel: notebookpro
credentials-file: /Users/onur/.cloudflared/notebookpro.json

ingress:
  - hostname: notebookpro.siyahkare.com
    service: http://localhost:4173
  - service: http_status:404
```

### Önemli Portlar

| Servis | Port | Açıklama |
|--------|------|----------|
| Vite Dev | 5173 | Geliştirme sunucusu |
| Vite Preview | 4173 | Production preview |

---

## 🔄 Sistem Servisi (Opsiyonel)

macOS'da otomatik başlatma için LaunchAgent:

### ~/Library/LaunchAgents/com.notebookpro.tunnel.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.notebookpro.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/onur/code/notebookpro-logic-simulator/scripts/start-production.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/notebookpro.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/notebookpro.error.log</string>
</dict>
</plist>
```

**Servisi Etkinleştir:**
```bash
launchctl load ~/Library/LaunchAgents/com.notebookpro.tunnel.plist
```

**Servisi Devre Dışı Bırak:**
```bash
launchctl unload ~/Library/LaunchAgents/com.notebookpro.tunnel.plist
```

---

## 🔍 Sorun Giderme

### Tunnel Bağlanmıyor

```bash
# Tunnel durumunu kontrol et
cloudflared tunnel info notebookpro

# Tunnel listesini görüntüle
cloudflared tunnel list
```

### Port Kullanımda

```bash
# 4173 portunu kullanan işlemi bul
lsof -i :4173

# İşlemi sonlandır
kill -9 <PID>
```

### DNS Propagasyonu

DNS değişiklikleri 5 dakika kadar sürebilir. Kontrol için:

```bash
dig notebookpro.siyahkare.com
```

### Log Görüntüleme

```bash
# Tunnel loglarını görüntüle
cloudflared tunnel --config cloudflare/config.yml run notebookpro --loglevel debug
```

---

## 🛡️ Güvenlik

- Tunnel credentials dosyası (`~/.cloudflared/`) gizli tutulmalıdır
- `.gitignore`'a eklenen hassas dosyalar:
  - `*.json` (credentials)
  - `.cloudflared/`

---

## 📊 Mimari

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Kullanıcı     │────▶│   Cloudflare     │────▶│  Local Server   │
│   (Browser)     │     │   Edge Network   │     │  (localhost)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               │ Tunnel
                               ▼
                        ┌──────────────────┐
                        │   cloudflared    │
                        │   (daemon)       │
                        └──────────────────┘
```

**Akış:**
1. Kullanıcı `notebookpro.siyahkare.com` adresine gider
2. Cloudflare DNS isteği tunnel'a yönlendirir
3. `cloudflared` daemon isteği local sunucuya iletir
4. Vite preview sunucusu yanıtı döner

---

## 📞 Destek

Sorunlar için GitHub Issues kullanın:
https://github.com/SiyahKare/notebookpro-logic-simulator/issues

---

<div align="center">

**[← README](README.md)** • **[Roadmap →](ROADMAP.md)**

</div>

