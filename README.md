# 🔗 Snip v3 — URL Shortener

> **Short links with a little magic** ✨

A production-grade, full-stack URL shortener built with Node.js + Express + MongoDB + React + Vite. Deployed on AWS with a CloudFront CDN, EC2 backend, and a fully automated GitHub Actions CI/CD pipeline.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 **Short Links** | Create short links with custom aliases (3–20 chars) |
| 📊 **Click Analytics** | Track clicks with 7-day trend charts and history |
| 🔒 **Password Protection** | Lock links behind a password |
| 👁️ **Preview Pages** | Show destination before redirecting |
| 📅 **Expiry Dates** | Set links to auto-expire on a date |
| 📋 **Bulk Create** | Shorten up to 50 URLs at once |
| 🏷️ **Tags & Folders** | Organize links with tags and folders |
| ⏸️ **Pause / Activate** | Toggle links on or off without deleting |
| 📧 **Email Digests** | Get notified when links hit click milestones |
| 🐙 **GitHub OAuth** | Sign in with GitHub |
| 🌙 **Dark Mode** | Full light/dark theme support |
| 🎓 **Onboarding** | 4-step onboarding for new users |

---

## 🏗️ AWS Deployment Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │               GitHub Actions CI/CD           │
                        │  push to main → build → deploy → invalidate  │
                        └────────────┬────────────────┬────────────────┘
                                     │                │
                     ┌───────────────▼──┐     ┌───────▼────────────┐
                     │   EC2 (Backend)  │     │   S3 Bucket        │
                     │  Ubuntu 22.04    │     │  (Frontend Static) │
                     │  Node.js + PM2   │     │  React + Vite dist │
                     │  Nginx (reverse  │     └───────┬────────────┘
                     │  proxy :80→5000) │             │
                     └────────┬─────────┘     ┌───────▼────────────┐
                              │               │   CloudFront CDN   │
                              │               │  Global edge cache │
                              │               │  HTTPS + Cache     │
                              │               │  Invalidation      │
                              │               └────────────────────┘
                     ┌────────▼─────────┐
                     │   MongoDB Atlas  │
                     │  (Cloud DB)      │
                     └──────────────────┘
```

### Infrastructure Components

| Component | Service | Purpose |
|---|---|---|
| **Backend** | AWS EC2 (t2.micro / t3.small) | Runs Node.js API, managed by PM2 |
| **Web Server** | Nginx on EC2 | Reverse proxy, SSL termination |
| **Process Manager** | PM2 | Zero-downtime restarts, crash recovery |
| **Frontend Hosting** | AWS S3 | Stores static React build artifacts |
| **CDN** | AWS CloudFront | Global distribution, HTTPS, caching |
| **Database** | MongoDB Atlas | Managed cloud MongoDB |
| **Region** | `ap-south-1` (Mumbai) | Primary AWS region |

### EC2 Setup (Backend)

The backend runs on an EC2 instance with the following setup:

```
EC2 Instance
├── Ubuntu 22.04 LTS
├── Node.js 20 (via nvm)
├── PM2 (process manager)
│   └── snip-backend → server.js
└── Nginx
    └── Reverse proxy: :80 → localhost:5000
```

Nginx configuration (`/etc/nginx/sites-available/snip`):

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### S3 + CloudFront (Frontend)

- The React app is built with Vite and synced to an S3 bucket configured for static website hosting.
- CloudFront sits in front of S3 and serves assets from edge locations globally.
- On every deployment, a wildcard cache invalidation (`/*`) is triggered to serve the latest build immediately.

---

## 🚀 CI/CD Pipeline (GitHub Actions)

The pipeline lives in `.github/workflows/deploy.yml` and triggers automatically on every push to `main`.

### Pipeline Flow

```
Push to main
     │
     ▼
┌─────────────────────────────┐
│  Job 1: deploy-backend      │
│  (runs-on: ubuntu-latest)   │
│                             │
│  1. SSH into EC2            │
│  2. git pull origin main    │
│  3. npm install             │
│  4. pm2 restart snip-backend│
└────────────┬────────────────┘
             │ (on success)
             ▼
┌─────────────────────────────┐
│  Job 2: deploy-frontend     │
│  (needs: deploy-backend)    │
│                             │
│  1. Checkout code           │
│  2. Setup Node.js 20        │
│  3. npm install (frontend)  │
│  4. npm run build           │
│     └─ VITE_API_URL injected│
│  5. aws s3 sync dist/ → S3  │
│     └─ --delete flag        │
│  6. CloudFront invalidation │
│     └─ paths: "/*"          │
└─────────────────────────────┘
```

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `EC2_SSH_KEY` | Private SSH key for EC2 instance access |
| `AWS_ACCESS_KEY_ID` | IAM user access key (S3 + CloudFront permissions) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_BUCKET` | Name of the S3 bucket for frontend assets |
| `CLOUDFRONT_ID` | CloudFront distribution ID |
| `VITE_API_URL` | Backend URL injected at build time (e.g. `http://<EC2-IP>`) |

### IAM Permissions Required

The IAM user used by GitHub Actions needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI

### 1. Clone the repository

```bash
git clone https://github.com/your-username/snip.git
cd snip
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Snip <your@gmail.com>

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# URLs
CLIENT_URL=http://localhost:5173
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

Start the backend:

```bash
npm run dev   # development (nodemon)
npm start     # production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
snip/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── backend/
│   ├── middleware/
│   │   └── auth.js             # JWT auth middleware
│   ├── models/
│   │   ├── User.js             # User model (auth, OAuth, preferences)
│   │   └── Link.js             # Link model (clicks, tags, folders, password, expiry)
│   ├── routes/
│   │   ├── auth.js             # /api/auth/* (signup, login, GitHub OAuth, reset)
│   │   ├── links.js            # /api/links/* (CRUD, bulk)
│   │   └── redirect.js         # /:code redirect + /r/verify /r/preview /r/info/:code
│   ├── services/
│   │   └── email.js            # Nodemailer HTML email templates
│   ├── utils/
│   │   ├── passport.js         # GitHub OAuth strategy
│   │   └── digestCron.js       # Hourly click digest cron job
│   └── server.js               # App entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui.jsx           # Toast, Modal, MiniBar, Spinner, global CSS
    │   │   ├── CreateLinkModal.jsx
    │   │   ├── Onboarding.jsx
    │   │   ├── QRModal.jsx
    │   │   └── Settings.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── AuthPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── PreviewPage.jsx
    │   ├── api.js              # Centralized API calls
    │   └── App.jsx
    ├── vercel.json             # SPA rewrite rules (for Vercel alternative)
    └── vite.config.js          # Dev proxy config
```

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/signup` | Register a new account | — |
| `POST` | `/login` | Login with email & password | — |
| `GET` | `/me` | Get current user | 🔒 |
| `PATCH` | `/me` | Update name / preferences | 🔒 |
| `PATCH` | `/change-password` | Change password | 🔒 |
| `DELETE` | `/me` | Delete account | 🔒 |
| `POST` | `/verify-email` | Verify email with token | — |
| `POST` | `/resend-verification` | Resend verification email | 🔒 |
| `POST` | `/forgot-password` | Send password reset email | — |
| `POST` | `/reset-password` | Reset password with token | — |
| `GET` | `/github` | Start GitHub OAuth | — |
| `GET` | `/github/callback` | GitHub OAuth callback | — |

### Links — `/api/links` (all require Bearer token)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List links (`?search=` `?folder=` `?tag=`) |
| `POST` | `/` | Create a single link |
| `POST` | `/bulk` | Bulk create up to 50 links |
| `GET` | `/:id` | Get link details |
| `PATCH` | `/:id` | Update link |
| `DELETE` | `/:id` | Delete link |

### Redirect — Public (no auth)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:code` | Redirect to original URL (tracks click) |
| `GET` | `/r/info/:code` | Get public link info (for preview page) |
| `POST` | `/r/verify` | Verify password `{code, password}` → `{originalUrl}` |
| `POST` | `/r/preview` | Confirm preview `{code}` → `{originalUrl}` |

---

## 🔗 How Short Links Work

```
User visits /:code
      │
      ▼
 MongoDB lookup
      │
  ┌───▼────┐
  │ Found? │──── No ──→ 404
  └───┬────┘
      │ Yes
      ▼
  Active? ──── No ──→ 410 Inactive
      │
  Expired? ─── Yes ─→ 410 Expired
      │
  Password? ── Yes ─→ Frontend /preview/:code?protected=1
      │                └─ POST /r/verify → originalUrl
  Preview? ─── Yes ─→ Frontend /preview/:code
      │                └─ POST /r/preview → originalUrl
      │
  Record click → 302 redirect → original URL
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT, bcryptjs, Passport.js (GitHub OAuth) |
| **Email** | Nodemailer (Gmail SMTP) |
| **ID generation** | nanoid |
| **Cron** | node-cron |
| **Frontend** | React 18, Vite |
| **Styling** | CSS-in-JS (inline + global CSS vars) |
| **Hosting (FE)** | AWS S3 + CloudFront |
| **Hosting (BE)** | AWS EC2 + Nginx + PM2 |
| **Database Hosting** | MongoDB Atlas |
| **CI/CD** | GitHub Actions |

---

## 🐛 Bug Fixes in v3

- ✅ Short links now correctly redirect to the **original URL** (not the frontend)
- ✅ QR codes now encode the backend redirect URL so scanning actually works
- ✅ Password-protected links correctly return `originalUrl` on success
- ✅ Google OAuth removed — only GitHub OAuth remains
- ✅ Route conflicts fixed — `/api/*` routes registered before `/:code` catch-all

---

## 📄 License

MIT — free to use, modify, and distribute.
