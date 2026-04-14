# Google OAuth Setup Guide

## Issues Fixed
✅ Removed `bgImage is not defined` error in Login.jsx
✅ Prevented multiple Google initialization calls  
✅ Made Google Client ID configurable via environment variables
✅ Added safe fallback when Client ID is not configured

## Setup Instructions

### 1. Get Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google+ API**:
   - Search for "Google+ API" in the search bar
   - Click it and press "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (if using different port)
     - Your production domain
   - Add Authorized redirect URIs:
     - `http://localhost:5173/login`
     - `http://localhost:5173/register`
     - Your production URLs
   - Click "Create" and copy the Client ID

### 2. Configure Frontend

Edit `/home/zac/Afristay/frontend/.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
VITE_API_URL=http://localhost:8000
```

### 3. Configure Backend

Edit `/home/zac/Afristay/backend/.env`:
```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

### 4. Restart Servers

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

## Testing Google Login

1. Visit http://localhost:5173/login or /register
2. Click the "Sign in with Google" button
3. You should see the Google sign-in popup (no more 403 errors)

## Troubleshooting

**"The given client ID is not found"**
- Make sure you've added the correct Client ID in both frontend and backend
- Check that your authorized origins include your development URL

**Google button not appearing**
- Open browser DevTools → Console to see warnings
- Make sure Google Sign-In script is loaded (check Network tab for accounts.google.com)
