# ◈ FCRS — Freelancer Credibility & Review System

A full-stack DBMS-based web application where freelancers and clients interact through projects, exchange reviews, and build reputation scores.

---

## 📁 Project Folder Structure

```
fcrs/
├── package.json                  ← root scripts
├── .gitignore
├── vercel.json                   ← Vercel deployment config
├── render.yaml                   ← Render deployment config
│
├── database/
│   ├── schema.sql                ← MySQL schema + sample data + queries
│   └── supabase_schema.sql       ← PostgreSQL version for Supabase
│
├── backend/
│   ├── package.json
│   ├── server.js                 ← Express app entry point
│   ├── .env.example
│   ├── config/
│   │   ├── db.js                 ← MySQL connection pool
│   │   └── db.supabase.js        ← PostgreSQL version (Supabase)
│   ├── middleware/
│   │   └── auth.js               ← JWT authentication middleware
│   ├── controllers/
│   │   ├── authController.js     ← signup / login
│   │   ├── userController.js     ← profile + reputation
│   │   ├── projectController.js  ← CRUD + assign + complete
│   │   ├── reviewController.js   ← submit reviews
│   │   └── disputeController.js  ← raise disputes
│   └── routes/
│       ├── auth.js
│       ├── users.js
│       ├── projects.js
│       ├── reviews.js
│       └── disputes.js
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js                ← routing
        ├── App.css               ← global styles
        ├── context/
        │   └── AuthContext.js    ← global auth state
        ├── utils/
        │   └── api.js            ← axios with JWT injection
        ├── components/
        │   ├── Navbar.js
        │   ├── Navbar.css
        │   └── StarRating.js
        └── pages/
            ├── LoginPage.js
            ├── SignupPage.js
            ├── AuthPages.css
            ├── DashboardPage.js
            ├── DashboardPage.css
            ├── ProjectsPage.js
            ├── ProjectsPage.css
            ├── ReviewPage.js
            ├── ReviewPage.css
            ├── ProfilePage.js
            └── ProfilePage.css
```

---

## 🗄️ Database Schema Overview

| Table     | Key Columns                                                    |
|-----------|----------------------------------------------------------------|
| Users     | id, name, email, password, role, avg_rating, total_completed  |
| Projects  | id, title, budget, client_id, freelancer_id, status           |
| Reviews   | id, project_id, reviewer_id, reviewee_id, rating, comment     |
| Disputes  | id, project_id, raised_by, reason, status                     |

**Constraints:** UNIQUE on (project_id, reviewer_id) in Reviews prevents duplicate reviews. CHECK ensures rating is 1–5.

**Triggers:** Two triggers auto-update `avg_rating`, `total_reviews`, and `total_completed` on the Users table.

---

## 🔌 API Endpoints

| Method | Endpoint                    | Auth | Description               |
|--------|-----------------------------|------|---------------------------|
| POST   | /api/auth/signup            | No   | Create account            |
| POST   | /api/auth/login             | No   | Login, get JWT token      |
| GET    | /api/users                  | Yes  | List users (filter by role)|
| GET    | /api/users/:id              | Yes  | Get profile + stats       |
| POST   | /api/projects               | Yes  | Create project (client)   |
| GET    | /api/projects               | Yes  | List my projects          |
| PATCH  | /api/projects/:id/complete  | Yes  | Mark complete (client)    |
| PATCH  | /api/projects/:id/assign    | Yes  | Assign freelancer         |
| POST   | /api/reviews                | Yes  | Submit review             |
| GET    | /api/reviews/:userId        | Yes  | Get user's reviews        |
| POST   | /api/disputes               | Yes  | Raise dispute             |
| GET    | /api/disputes               | Yes  | List my disputes          |

---

## 🛠️ LOCAL SETUP INSTRUCTIONS

### Prerequisites
- Node.js v18+ (https://nodejs.org)
- MySQL 8.0+ (https://dev.mysql.com/downloads/)
- Git

### Step 1 — Clone / Download the project
```bash
git clone https://github.com/yourusername/fcrs.git
cd fcrs
```

### Step 2 — Set up MySQL database
Open MySQL and run the schema:
```bash
mysql -u root -p < database/schema.sql
```
Or open MySQL Workbench, paste the contents of `database/schema.sql`, and run it.

### Step 3 — Configure backend environment
```bash
cd backend
cp .env.example .env
```
Edit `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fcrs_db
JWT_SECRET=any_long_random_string_here
```

### Step 4 — Install backend dependencies
```bash
# Inside the backend folder:
npm install
```

### Step 5 — Start the backend server
```bash
npm run dev
# Server starts at http://localhost:5000
# Test it: http://localhost:5000/api/health
```

### Step 6 — Configure frontend environment
Open a NEW terminal:
```bash
cd frontend
cp .env.example .env
# The default REACT_APP_API_URL=http://localhost:5000/api is correct for local dev
```

### Step 7 — Install frontend dependencies
```bash
npm install
```

### Step 8 — Start the frontend
```bash
npm start
# React app opens at http://localhost:3000
```

### Step 9 — Login with demo accounts
- **alice@example.com** (client) — password: `password`
- **bob@example.com** (freelancer) — password: `password`
- **carol@example.com** (freelancer) — password: `password`

---

## 🚀 DEPLOYMENT GUIDE

---

### Option A: Vercel (Frontend) + Render (Backend) + Supabase (Database)

This is the recommended free deployment stack.

---

#### STEP 1 — Set up Supabase Database

1. Go to https://supabase.com and create a free account
2. Create a new project (choose a region close to your users)
3. Wait for the project to be ready (~2 minutes)
4. Go to **SQL Editor** in the left sidebar
5. Paste the contents of `database/supabase_schema.sql` and click **Run**
6. Go to **Settings → Database** and copy:
   - **Host** (looks like `db.xxxx.supabase.co`)
   - **Port** (usually `5432`)
   - **User** (`postgres`)
   - **Password** (the one you set when creating the project)
   - **Database name** (`postgres`)

> ⚠️ Supabase uses PostgreSQL, not MySQL.
> The `supabase_schema.sql` file has been converted to PostgreSQL syntax.
> For the backend, you'll also need to install `pg` instead of `mysql2`:
> ```bash
> cd backend && npm install pg && npm uninstall mysql2
> ```
> Then replace `config/db.js` with `config/db.supabase.js` (rename it).

---

#### STEP 2 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to https://render.com and sign up (free)
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Configure the service:
   - **Name:** `fcrs-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Add Environment Variables (click "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=db.xxxx.supabase.co        ← from Supabase
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   DB_NAME=postgres
   JWT_SECRET=generate_a_long_random_string
   FRONTEND_URL=https://your-app.vercel.app   ← fill in after step 3
   ```
7. Click **Create Web Service**
8. Wait for deploy (~3-5 minutes)
9. Copy your backend URL: `https://fcrs-backend.onrender.com`

---

#### STEP 3 — Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up (free)
2. Click **New Project** → Import your GitHub repo
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://fcrs-backend.onrender.com/api
   ```
   (use the URL from Step 2)
5. Click **Deploy**
6. Copy your frontend URL: `https://fcrs-yourname.vercel.app`

---

#### STEP 4 — Update CORS on Backend

Go back to Render → your backend service → Environment:
- Update `FRONTEND_URL` to your Vercel URL
- Click Save → Service will redeploy automatically

---

### Option B: Local MySQL (simpler, no Supabase)

If you prefer local MySQL with Render hosting the backend:

1. Use `database/schema.sql` (MySQL syntax)
2. Use `config/db.js` (mysql2 driver — already set up)
3. You'll need a remote MySQL host. Options:
   - **PlanetScale** (https://planetscale.com) — free MySQL hosting
   - **Railway** (https://railway.app) — free MySQL in cloud
   - **Clever Cloud** (https://clever-cloud.com) — free MySQL add-on

For PlanetScale:
```
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fcrs_db
```

---

## 🧪 Testing the API manually

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"client"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password"}'

# Get profile (use token from login)
curl http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `ER_ACCESS_DENIED` | Check DB_USER and DB_PASSWORD in .env |
| `ECONNREFUSED` | Make sure MySQL is running: `sudo service mysql start` |
| CORS error | Set FRONTEND_URL in backend .env to your exact frontend URL |
| `npm start` not found | Run `npm install` first in that folder |
| Token expired | Log out and log back in |
| Port 3000 busy | `PORT=3001 npm start` or kill the process using port 3000 |

---

## 📝 Tech Stack Summary

- **Frontend:** React 18 + React Router v6 + Axios
- **Backend:** Node.js + Express 4 + JWT auth
- **Database:** MySQL 8 (local) / PostgreSQL via Supabase (cloud)
- **ORM:** None — raw SQL with mysql2/pg for learning purposes
- **Auth:** bcryptjs + jsonwebtoken
- **Deployment:** Vercel (frontend) + Render (backend) + Supabase (DB)
