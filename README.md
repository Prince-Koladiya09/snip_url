# 🔗 Snip v3 — URL Shortener

Full-stack URL shortener: Node.js + Express + MongoDB + React + Vite

---

## 📁 Folder Structure

```
snip/
├── backend/
│   ├── middleware/
│   │   └── auth.js              JWT auth middleware
│   ├── models/
│   │   ├── User.js              User (auth, OAuth, preferences)
│   │   └── Link.js              Link (clicks, tags, folders, password, expiry)
│   ├── routes/
│   │   ├── auth.js              /api/auth/* (signup, login, GitHub OAuth, reset)
│   │   ├── links.js             /api/links/* (CRUD, bulk, QR)
│   │   └── redirect.js          /:code redirect + /r/verify /r/preview /r/info/:code
│   ├── services/
│   │   └── email.js             Nodemailer HTML email templates
│   ├── utils/
│   │   ├── passport.js          GitHub OAuth strategy
│   │   └── digestCron.js        Hourly click digest cron job
│   ├── server.js                App entry point
│   ├── .env                     Your environment variables (ready to use)
│   ├── .env.example             Template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui.jsx            Toast, Modal, MiniBar, Spinner, global CSS
    │   │   ├── CreateLinkModal.jsx  Create link (single + bulk, all options)
    │   │   ├── Onboarding.jsx    4-step onboarding for new users
    │   │   ├── QRModal.jsx       QR code viewer + PNG download
    │   │   └── Settings.jsx      Settings panel (5 tabs)
    │   ├── context/
    │   │   ├── AuthContext.jsx   Global user state + auth methods
    │   │   └── ThemeContext.jsx  Dark/light mode via CSS variables
    │   ├── pages/
    │   │   ├── AuthPage.jsx      Login, signup, forgot/reset password, GitHub OAuth
    │   │   ├── Dashboard.jsx     Main app — Home, Links, Folders tabs
    │   │   └── PreviewPage.jsx   Password unlock + preview page (public)
    │   ├── api.js                All API calls centralized
    │   ├── App.jsx               Root router + providers
    │   └── main.jsx              React entry point
    ├── index.html
    ├── package.json
    └── vite.config.js            Dev server + proxy config
```

---

## 🚀 How to Run

### Requirements
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### Step 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Backend starts at → http://localhost:5000
Your .env is already configured and ready.

### Step 2 — Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at → http://localhost:5173

Open http://localhost:5173 in your browser.

---

## ✅ Bug Fixes in v3

1. Short links now correctly redirect to the ORIGINAL URL (e.g. YouTube, GitHub)
   - Short link: http://localhost:5000/<code>
   - Redirects to: https://youtube.com/... (or wherever)

2. QR codes now encode the backend redirect URL (localhost:5000/<code>)
   so scanning the QR actually takes you to the original destination.

3. Password-protected links now work correctly.
   - /r/verify endpoint handles password check and returns originalUrl
   - PreviewPage calls this and redirects to the original URL on success

4. Google OAuth removed. Only GitHub OAuth remains.

5. Route conflicts fixed — /api/* routes are registered before /:code
   so short codes never accidentally match API paths.

---

## 🔗 How Short Links Work

```
User visits:  http://localhost:5000/abc123
                        ↓
Backend finds the link in MongoDB
                        ↓
If normal link → 302 redirect to https://youtube.com/...
If password protected → redirect to http://localhost:5173/preview/abc123?protected=1
If preview required → redirect to http://localhost:5173/preview/abc123
```

---

## 🔌 API Reference

### Auth (/api/auth)
```
POST   /api/auth/signup              Register
POST   /api/auth/login               Login
GET    /api/auth/me                  Get current user (🔒)
PATCH  /api/auth/me                  Update name/preferences (🔒)
PATCH  /api/auth/change-password     Change password (🔒)
DELETE /api/auth/me                  Delete account (🔒)
POST   /api/auth/verify-email        Verify email token
POST   /api/auth/resend-verification Resend verify email (🔒)
POST   /api/auth/forgot-password     Send reset email
POST   /api/auth/reset-password      Reset with token
GET    /api/auth/github              GitHub OAuth start
GET    /api/auth/github/callback     GitHub OAuth callback
```

### Links (/api/links) — all require Bearer token
```
GET    /api/links             List links (?search= ?folder= ?tag=)
POST   /api/links             Create link
POST   /api/links/bulk        Bulk create (up to 50)
GET    /api/links/:id         Get link details
PATCH  /api/links/:id         Update link
DELETE /api/links/:id         Delete link
GET    /api/links/:id/qr      Get QR code (base64 PNG)
```

### Redirect (public — no auth)
```
GET    /:code                 Redirect to original URL (tracks click)
GET    /r/info/:code          Get public link info (for preview page)
POST   /r/verify              Verify password {code, password} → {originalUrl}
POST   /r/preview             Confirm preview {code} → {originalUrl}
```

---

## ✨ All Features

- Email/password signup & login
- GitHub OAuth login
- Email verification on signup
- Forgot & reset password via email
- Change password from settings
- Account deletion
- Create short links with custom aliases
- Link expiration dates
- Password-protected links ✅ (fixed)
- Preview page before redirect
- Bulk URL shortening (up to 50)
- Tags and folders
- Pause/activate links
- Click counter + 7-day trend chart
- QR code generation (downloadable PNG) ✅ (fixed)
- Email click digest notifications
- Dark mode toggle
- 4-step onboarding
- Search and filter by folder/tag
- Settings panel (5 tabs)
