# WatchParty Deployment Guide

## Architecture

- **Frontend**: Next.js 16 (App Router) - Deploy on Vercel
- **Backend**: Node.js + Express - Deploy on Render
- **Storage**: JSON file (data.json) stored on backend server

## Backend (Render)

### Files
- `backend/package.json` - Dependencies
- `backend/server.js` - Express server
- `backend/data.json` - Data storage file

### Deploy to Render
1. Push the `backend` folder to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: (leave empty)
   - **Start Command**: `node server.js`
5. Click "Deploy"

Your backend will be available at: `https://your-app-name.onrender.com`

---

## Frontend (Vercel)

### Environment Variables
In Vercel, add this environment variable:
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: Your Render backend URL (e.g., `https://your-app-name.onrender.com`)

### Deploy to Vercel
1. Push your frontend code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the project
3. In "Environment Variables", add:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
   ```
4. Click "Deploy"

Your frontend will be available at: `https://your-app-name.vercel.app`

---

## Local Development

### Start Backend
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:3000

### Start Frontend
```bash
npm install
npm run dev
```
Frontend runs on http://localhost:3000

---

## API Endpoints

### GET /data
Returns the current JSON data.

```bash
curl http://localhost:3000/data
```

### POST /data
Updates the JSON data. Send a JSON object in the request body.

```bash
curl -X POST http://localhost:3000/data \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "currentTime": 30, "isPlaying": true}'
```
