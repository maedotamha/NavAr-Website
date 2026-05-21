# NavAR Deployment

## Database

The database must be a cloud PostgreSQL database. Run these once with `DATABASE_URL` set:

```powershell
npm.cmd run db:init
npm.cmd run db:seed
```

## Backend on Render

Create a Render Web Service from this repository.

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Environment variables:

```text
DATABASE_URL=<cloud postgres url>
AUTH_SECRET=<long random secret>
NODE_ENV=production
CORS_ORIGIN=<your Vercel frontend URL>
```

## Frontend on Vercel

Create a Vercel project from this repository.

```text
Root Directory: frontend
Build Command: npm run build
```

Environment variable:

```text
NEXT_PUBLIC_API_URL=<your Render backend URL>
```

After Vercel gives you the frontend URL, update `CORS_ORIGIN` in Render and redeploy the backend.

## Admin Login

```text
Email: admin@navar.local
Password: Admin@12345
```
