# Hostinger Deployment Guide

## Files

```
hostinger/
  .htaccess            ← URL rewriting (API routing + SPA fallback)
  api/
    chat/
      index.php        ← PHP proxy that forwards to your Python backend
```

## How to deploy

### 1. Upload the built frontend

Copy everything from `project/dist/` into Hostinger's `public_html/`:

```
public_html/
  index.html
  assets/
    index-*.css
    index-*.js
```

### 2. Upload the PHP proxy

Copy the `hostinger/` contents into `public_html/`:

```
public_html/
  .htaccess
  api/
    chat/
      index.php
```

### 3. Configure the backend URL

Edit `public_html/api/chat/index.php` line 12 and set `$BACKEND_URL` to
wherever your Python FastAPI server (ollama-proxy) is running:

```php
$BACKEND_URL = 'http://YOUR_SERVER_IP:PORT/api/chat';
```

For example:
- VPS: `http://187.77.210.230:8000/api/chat`
- Render: `https://fulton-care-chat-api.onrender.com/api/chat`

### 4. Test

```bash
curl -X POST https://pink-camel-978137.hostingersite.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"hello"}]}'
```

You should get back `{ "reply": "..." }`.

## How it works

1. Frontend POSTs to `/api/chat`
2. `.htaccess` routes that to `api/chat/index.php`
3. PHP proxy forwards the request body to `$BACKEND_URL` via cURL
4. Backend response is returned as-is to the frontend
