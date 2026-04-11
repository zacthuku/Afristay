# Afristay - Backend & Frontend Connection Guide

## ✅ Fixes Applied

### 1. **Fixed Import Issues**
- ✅ Created `/app/models/__init__.py` to properly export all models from `all_models.py`
- ✅ Updated all files importing from `app.models.user` to use `app.models` instead
- ✅ Fixed imports in:
  - `app/services/auth/auth_service.py`
  - `app/api/deps.py`
  - `app/services/auth/google_service.py`

### 2. **Installed Missing Dependencies**
- ✅ python-jose (JWT handling)
- ✅ passlib (password hashing)
- ✅ google-auth-oauthlib (Google OAuth)
- ✅ google-auth-httplib2 (Google authentication)

### 3. **Configured Backend-Frontend Connection**
- ✅ Added CORS middleware to `app/main.py`
  - Allows requests from localhost:5173 (Vite default)
  - Allows requests from localhost:3000 (alternative)
- ✅ Created `frontend/src/services/api.js` with:
  - Authentication services (register, login, Google auth)
  - User services
  - Listing services
  - Booking services
- ✅ Updated Login and Register pages to use the API service

### 4. **Environment Configuration**
- ✅ Created `frontend/.env` with API URL configuration
- ✅ Backend `.env` already configured with database and Redis settings

## 🚀 How to Run

### Backend Setup
```bash
cd /home/zac/Afristay/backend

# Activate virtual environment
source venv/bin/activate

# Install requirements (if needed)
pip install -r requirements.txt

# Run migrations (if not already done)
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
API docs available at: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd /home/zac/Afristay/frontend

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
  - Body: `{ email: string, password: string }`
  - Returns: `{ access_token: string }`

- `POST /auth/login` - Login user
  - Body: `{ email: string, password: string }`
  - Returns: `{ access_token: string }`

- `POST /auth/google` - Google OAuth login
  - Body: `{ id_token: string }`
  - Returns: `{ access_token: string }`

### Users
- `GET /users/me` - Get current user info (requires auth token)
- `PUT /users/me` - Update user profile (requires auth token)
- `GET /users/{id}` - Get user by ID

## 🔐 Authentication Flow

1. User fills in email and password on Login/Register page
2. Frontend calls `authService.login()` or `authService.register()`
3. Backend validates credentials and returns JWT token
4. Token is stored in localStorage
5. All subsequent API requests include `Authorization: Bearer <token>` header
6. Backend validates token in `app/api/deps.py` using `get_current_user()` dependency

## 📝 Key Files Modified

**Backend:**
- `/app/models/__init__.py` - Created to export models
- `/app/main.py` - Added CORS configuration
- `/app/services/auth/auth_service.py` - Fixed imports
- `/app/api/deps.py` - Fixed imports
- `/app/services/auth/google_service.py` - Fixed imports

**Frontend:**
- `/src/services/api.js` - Created with API client
- `/src/pages/Login.jsx` - Updated to use API service
- `/src/pages/Register.jsx` - Updated to use API service
- `/.env` - Created with API URL configuration

## 🛠 Troubleshooting

### Port Already in Use
If port 8000 is in use:
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

### CORS Errors
If you see CORS errors in the browser console:
1. Make sure backend is running on `http://localhost:8000`
2. Make sure frontend `.env` has correct API_URL
3. Check that CORS origins in `app/main.py` match your frontend URL

### Token Issues
If you're getting "Invalid token" errors:
1. Clear localStorage: Open DevTools → Application → Clear LocalStorage
2. Try logging in again
3. Check that SECRET_KEY in `.env` is set

### Database Connection Issues
If backend fails to start with database errors:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Run migrations: `alembic upgrade head`

## 🔗 Frontend-Backend Communication

The frontend communicates with the backend through:
- **API Base URL**: `http://localhost:8000`
- **Authentication**: JWT tokens stored in localStorage
- **Headers**: All requests include `Content-Type: application/json` and auth token
- **Error Handling**: API service returns meaningful error messages

## 📦 Project Structure

```
Afristay/
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI app with CORS)
│   │   ├── models/ (Database models)
│   │   ├── schemas/ (Pydantic schemas)
│   │   ├── services/ (Business logic)
│   │   ├── api/routes/ (API endpoints)
│   │   └── core/ (Configuration & security)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── services/api.js (API client)
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   └── context/AppContext.jsx
    ├── .env (API configuration)
    └── package.json
```

## ✨ Next Steps

1. Test authentication by running both servers:
   ```bash
   # Terminal 1: Backend
   cd backend && source venv/bin/activate && uvicorn app.main:app --reload
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. Navigate to `http://localhost:5173` and test Register/Login flows

3. Open browser DevTools to verify:
   - Token is stored in localStorage
   - API requests are being made correctly
   - No CORS errors appear

4. Once working, you can add more features like:
   - Listings API endpoints
   - Bookings functionality
   - User profiles
   - Reviews system

