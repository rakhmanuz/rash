# Cloudflare Tunnel Sozlash

Telefon orqali internet ulanayotgan bo'lsangiz, Cloudflare Tunnel ishlatamiz.

## 1. Cloudflare Tunnel O'rnatish

### Windows uchun:

1. Cloudflare Zero Trust'ga kirish:
   - https://one.dash.cloudflare.com/ ga kiring
   - Bepul account yarating

2. Cloudflared o'rnatish:
   - https://github.com/cloudflare/cloudflared/releases dan yuklab oling
   - Windows x64 uchun: `cloudflared-windows-amd64.exe`
   - `cloudflared.exe` nomiga o'zgartiring
   - `C:\cloudflared\` papkasiga ko'chiring

## 2. Tunnel Yaratish

1. Cloudflare Dashboard'ga kiring
2. Zero Trust > Networks > Tunnels
3. "Create a tunnel" tugmasini bosing
4. "Cloudflared" ni tanlang
5. Tunnel nomini kiriting: `rash-tunnel`
6. "Save tunnel" tugmasini bosing

## 3. Token Olish

Tunnel yaratilgandan keyin, token ko'rsatiladi. Uni nusxalab oling.

## 4. Config Fayl Yaratish

`C:\cloudflared\config.yml` fayl yaratish:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: C:\cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: rash.uz
    service: http://localhost:3000
  - hostname: www.rash.uz
    service: http://localhost:3000
  - service: http_status:404
```

## 5. Tunnel Ishga Tushirish

```bash
cd C:\cloudflared
cloudflared tunnel run rash-tunnel
```

## 6. Windows Service Qilib Sozlash

```bash
cloudflared service install
```
