# Local Setup (No Docker Required)

## Quick Start with Free Neon PostgreSQL

### 1. Create a Free PostgreSQL Database on Neon

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up (free tier gives you 3 projects + 0.5GB storage)
3. Create a new project (defaults are fine)
4. Copy your connection string (looks like):
   ```
   postgresql://user:password@host/dbname?sslmode=require
   ```

### 2. Set Your .env.local

Replace the DATABASE_URL in `.env.local`:

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
SESSION_SECRET="dev-secret-key-32-chars-minimum-ok"
NODE_ENV="development"
```

### 3. Install & Run

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 4. Open Browser

Go to **http://localhost:3000**

Login with:
- **Email:** alice@demo.com
- **Password:** demo

---

## Why This Works

- **Neon** is a free managed PostgreSQL (perfect for dev/testing)
- **No Docker needed** on your machine
- **Same database** as production (Vercel will also use Neon in prod)
- **Zero data loss** — Neon is durable and backed up

## If Neon is Down

You can also use:
- [Railway](https://railway.app) — Free PostgreSQL tier
- [Render](https://render.com) — Free PostgreSQL tier
- [Supabase](https://supabase.com) — Free PostgreSQL tier

All provide connection strings compatible with this project.

---

**Next:** Follow steps 1-4 above, then you'll have the app running locally!
