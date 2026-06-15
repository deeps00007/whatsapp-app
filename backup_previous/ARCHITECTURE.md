# Growbychat — Full Architecture & API Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend API Reference](#4-backend-api-reference)
5. [Authentication Flow](#5-authentication-flow)
6. [Database Layer](#6-database-layer)
7. [Encryption](#7-encryption)
8. [Meta/WhatsApp Integration](#8-metawhatsapp-integration)
9. [Environment Variables](#9-environment-variables)
10. [Build & Deploy](#10-build--deploy)
11. [Security Model](#11-security-model)

---

## 1. Overview

**Growbychat** is a WhatsApp Business automation SaaS platform operated by **Aashdeep Industrial Engineering**. It enables businesses to connect their WhatsApp Business accounts, send marketing campaigns, automate messaging workflows, and track delivery analytics — all through the official Meta Cloud API.

| Layer | Technology | Host |
|-------|-----------|------|
| Frontend | React 19 + Vite 8 | `https://growbychat.app` |
| Backend | PHP (raw curl, no framework) | `https://api.growbychat.app` (Railway) |
| Database | Google Cloud Firestore + local JSON fallback | `whatsapp-betasaas` project |
| Auth | Facebook OAuth 2.0 (Embedded Signup) | Meta App `3371677636326324` |

---

## 2. Project Structure

```
whatsapp-app/
├── backend/
│   ├── index.php                    # API gateway health check
│   ├── composer.json                # Empty (no PHP dependencies)
│   └── api/
│       ├── oauth_init.php           # Meta OAuth redirect
│       ├── oauth_callback.php       # Token exchange + user provisioning
│       ├── send_message.php         # WhatsApp message dispatch
│       ├── webhook.php              # Webhook verification + status callbacks
│       ├── review_ping.php          # App Review diagnostic (9 tests)
│       ├── get_templates.php        # Fetch WhatsApp templates
│       ├── get_profile.php          # Fetch user profile (no token)
│       ├── get_messages.php         # Fetch message history
│       ├── create_template.php      # Create new template
│       ├── disconnect.php           # Revoke user connection
│       ├── firestore_helper.php     # Firestore REST API + local JSON fallback
│       ├── encryption_helper.php    # AES-256-CBC token encryption
│       ├── firebase-service-account.json  # (gitignored)
│       └── database.json            # Local JSON DB fallback (gitignored)
├── src/
│   ├── main.jsx                     # React entry point
│   ├── App.jsx                      # Root: landing ↔ dashboard toggle + OAuth handler
│   ├── index.css                    # Full design system (1213 lines)
│   └── components/
│       ├── Navbar.jsx               # Sticky nav with scroll detection
│       ├── Hero.jsx                 # Hero + mock dashboard + virtual phone
│       ├── Features.jsx             # 6-feature grid
│       ├── Workflow.jsx             # 3-step "How It Works"
│       ├── DemoPlayground.jsx       # Interactive WhatsApp message simulator
│       ├── Pricing.jsx              # 3-tier pricing with monthly/annual toggle
│       ├── FAQ.jsx                  # Accordion FAQ
│       ├── Footer.jsx               # 4-column footer
│       └── DashboardWorkspace.jsx   # Full business dashboard (1833 lines)
├── public/
│   ├── favicon.svg                  # WhatsApp chat bubble icon
│   ├── whatsapp-saas.png           # OG/social sharing image
│   ├── app-ads.txt                  # Google AdSense: pub-6936930679389372
│   ├── vk-join.html                # VoiceKhaata deep-link landing page
│   └── .well-known/assetlinks.json # Android App Links for com.voicekhaata.app
├── dist/                            # Vite build output (deployed)
├── index.html                       # SPA entry (SEO + OG tags)
├── privacy.html                     # Standalone legal page
├── terms.html                       # Standalone legal page
├── vite.config.js                   # Multi-page Vite config
└── package.json
```

---

## 3. Frontend Architecture

### 3.1 No Router Library

Navigation is **hash-based** (`#features`, `#workflow`, etc.) with smooth scrolling. The only "route change" is the landing-to-dashboard toggle based on whether `profileData` exists in state.

### 3.2 App.jsx — The Brain

**Two modes:**

| Condition | Renders |
|-----------|---------|
| No `profileData` | Landing page: Navbar → Hero → Features → Workflow → DemoPlayground → Pricing → FAQ → Footer |
| Has `profileData` | Dashboard: `<DashboardWorkspace>` |

**State (persisted in localStorage):**

| Key | Purpose |
|-----|---------|
| `growbychat_user_id` | Connected user identifier |
| `growbychat_profile` | Full WABA profile JSON (without access token) |

**Backend URL auto-detection:**

```
localhost/127.0.0.1 → http://localhost:8080
otherwise           → https://api.growbychat.app
```

**Key functions:**

| Function | What it does |
|----------|-------------|
| `scrollToSection(id)` | Smooth scroll to element by ID |
| `handleDisconnect(userId)` | POST `/api/disconnect.php`, clear localStorage |
| `fetchProfile(userId)` | GET `/api/get_profile.php?user_id=X`, store to localStorage; auto-disconnect on 404 |

**OAuth callback handler (useEffect):**
1. Detects `#oauth=success&user_id=X` in URL hash
2. Sets `connectedUser` state + localStorage
3. Calls `fetchProfile(userId)`
4. Shows success modal (green checkmark, connection status table)
5. Clears hash via `replaceState`

### 3.3 Navbar.jsx

- Sticky with glassmorphism on scroll > 20px
- If connected: "Session Active" badge + "Revoke Session" button
- If not connected: "Login" + "Get Started" → redirects to `/api/oauth_init.php`

**OAuth init URL:**
```
{backendUrl}/api/oauth_init.php?user_id=growbychat_user&frontend_host={window.location.origin}
```

### 3.4 DashboardWorkspace.jsx (1833 lines)

**3 sidebar tabs:**

#### Tab: Overview
- 4 KPI cards: API Connection, Campaign Sends, Workspace Security, Database Sync
- Warning banner if `phone_number_id` is missing
- Test mode messaging console (when no phone_number_id):
  - Uses Meta test number `+1 555 629 8392`
  - Default template: `hello_world`
- Broadcast Dispatch Center (template tabs, phone input, "Launch Campaign")
- Real-time Events terminal (color-coded logs, "Sync Delivery Status")
- Campaign History table (message_id, recipient, template, status, timestamp)

#### Tab: Webhooks
- Callback URL (copyable): `{backendUrl}/api/webhook.php`
- Verify Token (copyable): `growbychat_waba_webhook_verify_token_5124efbb`
- Security note about X-Hub-Signature-256

#### Tab: Cloud Templates
- Create form: name, category (MARKETING/UTILITY/AUTHENTICATION), language, body text
- Active templates table with Preview button
- Template Preview Modal (WhatsApp-style chat bubble)

**API calls from dashboard:**

| Action | Endpoint | Method | Params |
|--------|----------|--------|--------|
| Fetch messages | `/api/get_messages.php` | GET | `user_id` |
| Fetch templates | `/api/get_templates.php` | GET | `user_id` |
| Send campaign | `/api/send_message.php` | POST | `user_id, phone, template` |
| Test send | `/api/send_message.php` | POST | `user_id, phone, template, test_mode=true` |
| Create template | `/api/create_template.php` | POST | `user_id, name, category, language, body_text` |
| Simulate webhook | `/api/webhook.php` | POST | Full webhook payload + sync token header |

---

## 4. Backend API Reference

### 4.1 `GET /` — Health Check

```
Response: {"service":"Growbychat API Gateway","status":"online","version":"1.0.0"}
```

---

### 4.2 `GET /api/oauth_init.php` — Start OAuth

Redirects browser to Facebook OAuth dialog with Embedded Signup.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `user_id` | `growbychat_user` | User identifier |
| `frontend_host` | `https://growbychat.app` | React app URL to redirect back to |

| Env Var | Default | Purpose |
|---------|---------|---------|
| `FACEBOOK_CLIENT_ID` | `3371677636326324` | Meta App ID |
| `FACEBOOK_CONFIG_ID` | `1489785399464192` | Embedded Signup config |
| `META_REVIEW_MODE` | (false) | `true` = standard signup, `false` = coexistence onboarding |

**Flow:**
1. Build `state` = base64(`{user_id, nonce, frontend_host}`)
2. If `META_REVIEW_MODE=true`: Standard Embedded Signup URL (no featureType)
3. If `META_REVIEW_MODE=false`: Add `featureType=whatsapp_business_app_onboarding`
4. Redirect to `https://www.facebook.com/v23.0/dialog/oauth?...`

---

### 4.3 `GET /api/oauth_callback.php` — OAuth Callback

Called by Facebook after user authorizes. Exchanges code for tokens and provisions user.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `code` | Yes | Facebook authorization code |
| `state` | Yes | Base64 JSON with user_id, nonce, frontend_host |

| Env Var | Purpose |
|---------|---------|
| `FACEBOOK_CLIENT_ID` | App ID |
| `FACEBOOK_CLIENT_SECRET` | App Secret (required for production) |

**Flow:**
1. Decode `state` → extract `user_id`, `frontend_host`
2. **Token exchange step 1**: POST `v23.0/oauth/access_token` with code → get short-lived token
3. **Token exchange step 2**: GET `v23.0/oauth/access_token` with `grant_type=fb_exchange_token` → get 60-day long-lived token
4. **WABA discovery**: GET `v23.0/me/whatsapp_business_accounts` → extract `waba_id`, `business_name`
5. **Phone discovery**: GET `v23.0/{waba_id}/phone_numbers` → extract `phone_number_id`, `display_phone_number`
6. Encrypt token with AES-256-CBC
7. Save to Firestore: `{user_id, waba_id, phone_number_id, phone_number, business_name, fb_access_token (encrypted), connected_at}`
8. Redirect to `{frontend_host}/#oauth=success&user_id={user_id}`

**Localhost fallback** (no client_secret): Generates mock token/WABA/phone values.

---

### 4.4 `POST /api/send_message.php` — Send WhatsApp Message

| Body Param | Required | Default | Description |
|------------|----------|---------|-------------|
| `user_id` | Yes | - | User identifier |
| `phone` | Yes | - | Destination phone (E.164) |
| `template` | Yes | - | WhatsApp template name |
| `test_mode` | No | false | Use Meta test credentials |

| Env Var | Purpose |
|---------|---------|
| `META_TEST_ACCESS_TOKEN` | Required when `test_mode=true` |

**Flow:**
1. If `test_mode=true`: Use hardcoded test WABA `26533673862921106` + test phone `1146682351850264` + `META_TEST_ACCESS_TOKEN`
2. If normal mode: Decrypt user's OAuth token from Firestore
3. Build WhatsApp Cloud API payload:
   ```json
   {"messaging_product":"whatsapp","to":"{phone}","type":"template",
    "template":{"name":"{template}","language":{"code":"en_US"}}}
   ```
4. POST to `v18.0/{phone_number_id}/messages` with `Authorization: Bearer {token}`
5. Extract `wamid` from response, save to Firestore with status "sent"
6. Return `{"status":"sent","message_id":"wamid.xxx"}` or error with diagnostic info

---

### 4.5 `GET/POST /api/webhook.php` — Webhook Endpoint

**GET (Meta verification):**
- Verify token: `growbychat_waba_webhook_verify_token_5124efbb`
- If `hub_mode` + `hub_verify_token` match → return `hub_challenge`
- Otherwise → 403

**POST (Status callbacks):**

| Header | Purpose |
|--------|---------|
| `X-Hub-Signature-256` | HMAC-SHA256 signature (verified with `FACEBOOK_APP_SECRET`) |
| `X-Workspace-Sync-Token` | Override: `growbychat_sync_secret_5124efbb` (direct sync from dashboard) |

**Status weight system (anti-downgrade):**

| Status | Weight |
|--------|--------|
| sent | 1 |
| delivered | 2 |
| read | 3 |

Only updates if new weight > current weight. Prevents out-of-order callbacks from corrupting state.

---

### 4.6 `GET /api/review_ping.php` — App Review Diagnostic

Runs 9 tests against both OAuth token and test token, checking WABA access, templates, and phone numbers.

| Parameter | Default |
|-----------|---------|
| `user_id` | `growbychat_user` |

Returns `working_calls` list and `recommendation` string.

---

### 4.7 `GET /api/get_templates.php` — Fetch Templates

| Parameter | Default |
|-----------|---------|
| `user_id` | `growbychat_user` |

**Sources (merged, later overrides earlier by name):**
1. 4 hardcoded defaults: `hello_world`, `customer_welcome_alert`, `order_shipping_notification`, `appointment_reminder_alert`
2. Firestore custom templates
3. Live Meta API templates (via OAuth token, or test token fallback)

Also calls `/{waba_id}/phone_numbers` for Meta detection during App Review.

---

### 4.8 `GET /api/get_profile.php` — Fetch User Profile

| Parameter | Required |
|-----------|----------|
| `user_id` | Yes |

Returns user profile **with `fb_access_token` removed** (security). 404 if not found.

---

### 4.9 `GET /api/get_messages.php` — Fetch Message History

| Parameter | Required |
|-----------|----------|
| `user_id` | Yes |

Returns max 50 messages sorted by timestamp DESC. Includes fallback demo message if empty.

---

### 4.10 `POST /api/create_template.php` — Create Template

| Body Param | Required | Default |
|------------|----------|---------|
| `user_id` | No | `growbychat_user` |
| `name` | Yes | - |
| `category` | No | `MARKETING` |
| `language` | No | `en_US` |
| `body_text` | Yes | - |

If user has live OAuth token + WABA: submits to Meta API `v23.0/{waba_id}/message_templates`. Saves to Firestore with status "pending" (live) or "approved" (local-only).

---

### 4.11 `POST /api/disconnect.php` — Disconnect User

| Body Param | Required |
|------------|----------|
| `user_id` | Yes |

Deletes user from Firestore. Returns success message.

---

## 5. Authentication Flow

```
User clicks "Get Started" / "Login"
  │
  ▼
Browser → GET /api/oauth_init.php?user_id=growbychat_user&frontend_host=https://growbychat.app
  │
  ▼
oauth_init.php → 302 Redirect to Facebook OAuth v23.0
  │  (scope: whatsapp_business_management, whatsapp_business_messaging)
  │  (Embedded Signup with config_id: 1489785399464192)
  │
  ▼
User authorizes on Facebook
  │
  ▼
Facebook → GET /api/oauth_callback.php?code={auth_code}&state={base64}
  │
  ▼
oauth_callback.php:
  1. Exchange code → short-lived token
  2. Exchange short-lived → long-lived token (60 days)
  3. Discover WABA ID + business name
  4. Discover phone number ID + display number
  5. Encrypt token (AES-256-CBC)
  6. Save to Firestore
  │
  ▼
302 Redirect → https://growbychat.app/#oauth=success&user_id=growbychat_user
  │
  ▼
App.jsx detects hash → fetchProfile() → show dashboard
```

---

## 6. Database Layer

### Dual-mode: Firestore (primary) + Local JSON (fallback)

| Collection | Document ID | Fields |
|------------|-------------|--------|
| `users` | `{user_id}` | user_id, waba_id, phone_number_id, phone_number, business_name, fb_access_token (AES-256 encrypted), connected_at |
| `messages` | `{wamid}` | message_id, user_id, phone, template, status (sent/delivered/read), timestamp, updated_at |
| `templates` | `{template_id}` | template_id, user_id, name, category, language, status, body_text, timestamp |

**Firestore auth:** JWT (RS256) signed with Google service account → exchanged for OAuth2 access token → cached until 60s before expiry.

**Local fallback files:** `database.json`, `messages.json`, `templates.json` in `backend/api/`.

---

## 7. Encryption

**Algorithm:** AES-256-CBC

| Step | Operation |
|------|-----------|
| Encrypt | Generate random IV → `openssl_encrypt(data, 'aes-256-cbc', KEY, 0, IV)` → concatenate `encrypted::iv` → base64 |
| Decrypt | Base64 decode → split on `::` → `openssl_decrypt(data, 'aes-256-cbc', KEY, 0, IV)` |

**Key source:** `ENCRYPTION_KEY` env var (fallback: `your-secure-32-byte-env-secret-key-here!`)

---

## 8. Meta/WhatsApp Integration

### App Configuration

| Setting | Value |
|---------|-------|
| App ID | 3371677636326324 |
| App Name | appbyaashdeep-saas |
| Config ID | 1489785399464192 |
| API Version | v23.0 (OAuth, discovery, templates) / v18.0 (message sending) |
| Scopes | `whatsapp_business_management`, `whatsapp_business_messaging` |

### Test Environment

| Resource | Value |
|----------|-------|
| Test WABA ID | `26533673862921106` |
| Test Phone Number ID | `1146682351850264` |
| Test Sender | +1 555 629 8392 |
| Test Token | `META_TEST_ACCESS_TOKEN` env var |

### Review Mode vs Production

| Mode | META_REVIEW_MODE | featureType | Purpose |
|------|-----------------|-------------|---------|
| Review | `true` | (none) | Standard signup for Meta reviewers |
| Production | `false` | `whatsapp_business_app_onboarding` | Coexistence: mobile WA Business app stays active |

### Meta API Endpoints Used

| Purpose | Method | Endpoint |
|---------|--------|----------|
| Token exchange | GET | `v23.0/oauth/access_token` |
| Long-lived token | GET | `v23.0/oauth/access_token` (fb_exchange_token) |
| WABA discovery | GET | `v23.0/me/whatsapp_business_accounts` |
| Phone numbers | GET | `v23.0/{waba_id}/phone_numbers` |
| Templates list | GET | `v23.0/{waba_id}/message_templates` |
| Create template | POST | `v23.0/{waba_id}/message_templates` |
| Send message | POST | `v18.0/{phone_number_id}/messages` |
| Token debug | GET | `debug_token` |

---

## 9. Environment Variables

| Variable | Default | Used By | Purpose |
|----------|---------|---------|---------|
| `FACEBOOK_CLIENT_ID` | `3371677636326324` | oauth_init, oauth_callback | Meta App ID |
| `FACEBOOK_CLIENT_SECRET` | (empty) | oauth_callback | Token exchange (required in production) |
| `FACEBOOK_CONFIG_ID` | `1489785399464192` | oauth_init | Embedded Signup config |
| `FACEBOOK_APP_SECRET` | `YOUR_META_APP_SECRET` | webhook | HMAC signature verification |
| `META_REVIEW_MODE` | (false) | oauth_init | Standard vs coexistence onboarding |
| `META_TEST_ACCESS_TOKEN` | (empty) | send_message, get_templates, review_ping | Test environment token |
| `ENCRYPTION_KEY` | `your-secure-32-byte-env-secret-key-here!` | encryption_helper | AES-256-CBC key |
| `FIREBASE_PROJECT_ID` | `whatsapp-betasaas` | firestore_helper | Google Cloud project |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | (path) | firestore_helper | Service account JSON |

All set via Railway environment — **no `.env` file in repo.**

---

## 10. Build & Deploy

### Vite Config (multi-page)

```js
build: {
  rollupOptions: {
    input: {
      main: 'index.html',
      privacy: 'privacy.html',
      terms: 'terms.html',
    }
  }
}
```

### Build Output

| dist/ file | Source | Purpose |
|------------|--------|---------|
| `index.html` | React SPA | Main app |
| `privacy.html` | Standalone | Privacy policy |
| `terms.html` | Standalone | Terms of service |
| `vk-join.html` | public/ | VoiceKhaata deep link |
| `whatsapp-saas.png` | public/ | OG sharing image |
| `assets/main-*.js` | All React | Bundled JS |
| `assets/main-*.css` | index.css | Bundled CSS |

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → dist/ |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build |

### Hosting

| Layer | Platform | Domain |
|-------|----------|--------|
| Frontend | Vercel | `growbychat.app` |
| Backend | Railway | `api.growbychat.app` |

---

## 11. Security Model

1. **Token encryption** — AES-256-CBC before Firestore storage
2. **Profile API** — `fb_access_token` stripped from `get_profile.php` response
3. **CSRF protection** — OAuth `state` contains nonce + user_id validation
4. **Webhook verification** — HMAC-SHA256 with `FACEBOOK_APP_SECRET`
5. **Status anti-downgrade** — Weight-based filtering (sent=1, delivered=2, read=3)
6. **Mock rejection** — `MOCK_LONG_LIVED_TOKEN_*` only works on localhost
7. **Redirect URI matching** — Dynamically constructed per host
