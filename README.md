# 🔗 Snip v3 — URL Shortener

> **Short links with a little magic** ✨

A full-stack URL shortener built with Node.js + Express + MongoDB + React + Vite. Create, track, and organize short links with a beautiful UI, click analytics, password protection, and more.

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

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) URI

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/snip.git
cd snip
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Fill in your environment variables:

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
npm run dev        # development (nodemon)
npm start          # production
```

Backend starts at → **http://localhost:5000**

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at → **http://localhost:5173**

---

## 📁 Project Structure

```
snip/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT auth middleware
│   ├── models/
│   │   ├── User.js              # User model (auth, OAuth, preferences)
│   │   └── Link.js              # Link model (clicks, tags, folders, password, expiry)
│   ├── routes/
│   │   ├── auth.js              # /api/auth/* (signup, login, GitHub OAuth, reset)
│   │   ├── links.js             # /api/links/* (CRUD, bulk)
│   │   └── redirect.js          # /:code redirect + /r/verify /r/preview /r/info/:code
│   ├── services/
│   │   └── email.js             # Nodemailer HTML email templates
│   ├── utils/
│   │   ├── passport.js          # GitHub OAuth strategy
│   │   └── digestCron.js        # Hourly click digest cron job
│   └── server.js                # App entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui.jsx            # Toast, Modal, MiniBar, Spinner, global CSS
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
    │   ├── api.js               # Centralized API calls
    │   └── App.jsx
    └── vite.config.js
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

---

### Links — `/api/links` (all require Bearer token)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List links (`?search=` `?folder=` `?tag=`) |
| `POST` | `/` | Create a single link |
| `POST` | `/bulk` | Bulk create up to 50 links |
| `GET` | `/:id` | Get link details |
| `PATCH` | `/:id` | Update link |
| `DELETE` | `/:id` | Delete link |

---

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
User visits:  http://localhost:5000/abc123
                        ↓
          Backend looks up code in MongoDB
                        ↓
  ┌─────────────────────────────────────────────┐
  │  Normal link       → 302 redirect to        │
  │                      https://original-url.com│
  │                                             │
  │  Password protected → redirect to           │
  │                       /preview/:code?protected=1 │
  │                                             │
  │  Preview required  → redirect to            │
  │                       /preview/:code         │
  └─────────────────────────────────────────────┘
```

---

## 🚢 Deployment

### Backend (e.g. Render)

1. Set all environment variables in your host's dashboard
2. Set `CLIENT_URL` to your deployed frontend URL
3. Set `GITHUB_CALLBACK_URL` to `https://your-backend.com/api/auth/github/callback`
4. Start command: `npm start`

### Frontend (e.g. Vercel)

1. Set `VITE_API_URL` to your deployed backend URL (e.g. `https://your-backend.onrender.com`)
2. The `vercel.json` included handles client-side routing rewrites automatically

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT, bcryptjs, Passport.js (GitHub OAuth) |
| **Email** | Nodemailer |
| **ID generation** | nanoid |
| **Cron** | node-cron |
| **Frontend** | React 18, Vite |
| **Styling** | CSS-in-JS (inline + global CSS vars) |

---

## 📄 License

MIT — free to use, modify, and distribute.
