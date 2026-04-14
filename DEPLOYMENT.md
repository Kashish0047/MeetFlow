# Deployment Guide: MeetFlow

This guide explains how to deploy the MeetFlow application using **Render** for the backend and **Vercel** for the frontend.

---

## 1. Deploying the Backend (Render)

Render is great for hosting Node.js applications with database connections.

1.  **Push Code to GitHub**: Make sure your entire project is pushed to a public GitHub repository. (Since `.env` is ignored, your secrets are safe).
2.  **Create a Web Service on Render**:
    *   Go to [Render Dashboard](https://dashboard.render.com/).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure the Service**:
    *   **Root Directory**: `Backend` (Important: type exactly `Backend` since our backend is in this subfolder).
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    *   Scroll down to the Environment Variables section.
    *   Add the following variables exactly as they are in your local `.env` file:
        *   `DATABASE_URL` (Your Supabase PostgreSQL URI)
        *   `SMTP_HOST`
        *   `SMTP_PORT`
        *   `SMTP_USER`
        *   `SMTP_PASS`
        *   `FROM_EMAIL`
5.  **Deploy**: Click "Create Web Service".
6.  **Get the API URL**: Once deployed, copy the Render URL (e.g., `https://meetflow-backend.onrender.com`).

---

## 2. Deploying the Frontend (Vercel)

Vercel is the easiest way to host React/Vite frontends.

1.  **Create a Project on Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/).
    *   Click **Add New...** -> **Project**.
    *   Import your GitHub repository.
2.  **Configure the Project**:
    *   **Root Directory**: `Frontend` (Click Edit and select the `Frontend` folder).
    *   **Framework Preset**: Vite (Vercel should automatically detect this).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  **Environment Variables**:
    *   Add a new environment variable.
    *   **Name**: `VITE_API_BASE`
    *   **Value**: Paste the Render backend URL you copied earlier without a trailing slash (e.g., `https://meetflow-backend.onrender.com`).
4.  **Deploy**: Click "Deploy".

> **Note on Routing**: The `vercel.json` file inside the Frontend directory handles translating React Router routes in production, ensuring you don't get 404 errors on page refresh.

---

## 3. Database Migration (Post-Deployment)

If you are using a new, empty database for production, you need to sync the schema and add the seed data.

You can do this locally by temporarily changing your local `.env` `DATABASE_URL` to point to the production database, and then running:
```bash
cd Backend
npx prisma db push
npx prisma db seed
```
*(Make sure to change it back to your local db if testing locally afterwards).*

**You are now Live! 🎉**
