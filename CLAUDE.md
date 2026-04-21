# AfriStay

Africa-focused travel booking platform. Travellers discover, book, and pay for accommodation and transport in one flow. Hosts list services and manage bookings. Admins moderate listings and users.

## Stack

**Backend:** FastAPI (Python), PostgreSQL + GeoAlchemy2, SQLAlchemy ORM, Alembic migrations, Redis (token blacklist), Argon2 password hashing, JWT auth, Safaricom Daraja API (M-Pesa)

**Frontend:** React 19, Vite, React Router v7, Tailwind CSS v4, Context API (no Redux/Zustand), native fetch (no Axios)

## Dev Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head           # run migrations
uvicorn app.main:app --reload  # starts on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:5173
```

## Required .env (backend/.env)
```
DATABASE_URL=postgresql://user:pass@localhost/afristay
REDIS_URL=redis://localhost:6379
SECRET_KEY=<strong-random-secret>          # NEVER use "supersecret" in production
GOOGLE_CLIENT_ID=<from Google Cloud Console>
DARAJA_CONSUMER_KEY=<from Safaricom portal>
DARAJA_CONSUMER_SECRET=<from Safaricom portal>
DARAJA_SHORTCODE=174379                    # sandbox default
DARAJA_PASSKEY=<from Safaricom portal>
DARAJA_CALLBACK_URL=https://<ngrok-or-domain>/payments/mpesa/callback
DARAJA_ENV=sandbox                         # change to "production" for live
SMTP_USER=zacthuku7@gmail.com
SMTP_PASSWORD=<Gmail App Password>
SMTP_FROM_EMAIL=zacthuku7@gmail.com
FRONTEND_URL=http://localhost:5173
```

## Architecture

### Backend (`backend/app/`)
```
main.py                        # FastAPI app, CORS, router registration
core/
  config.py                    # pydantic-settings env config
  security.py                  # JWT creation/decode, Argon2 hashing
  redis.py                     # token blacklist
db/
  session.py                   # SQLAlchemy engine + SessionLocal
  init_db.py / seed.py         # DB init and test data
models/
  all_models.py                # ALL ORM models (single file)
schemas/                       # Pydantic request/response schemas
  auth.py, booking.py, payment.py, review.py, service.py, user.py
api/
  deps.py                      # get_current_user() dependency
  routes/
    auth.py                    # register, login, google, password reset
    users.py                   # profile, become-host, admin user mgmt
    services.py                # listing CRUD + admin approval
    bookings.py                # create, list, cancel bookings
    payments.py                # M-Pesa STK push + callback + status poll
    reviews.py                 # create review, list by service/host
    jobs.py                    # careers listings (admin CRUD)
services/
  auth/auth_service.py         # register, login, forgot/reset password
  auth/google_service.py       # Google OAuth id_token verification
  daraja_service.py            # M-Pesa STK push logic (Safaricom Daraja)
  email_service.py             # SMTP email (welcome, booking confirm, etc.)
  user_service.py
```

### Frontend (`frontend/src/`)
```
App.jsx                        # BrowserRouter + all routes
main.jsx                       # React entry point
context/AppContext.jsx         # Global state: user, listings, search, bookings
layouts/Layout.jsx             # Navbar + Footer + Toast wrapper
components/
  BookingCard.jsx              # 5-step payment wizard (dates→method→pay→poll→confirm)
  ListingCard.jsx              # Listing preview card
  ProtectedRoute.jsx           # role-based guard (guest/host/admin)
  ReviewSection.jsx            # display + create reviews
  SearchBar.jsx, Navbar.jsx, Hero.jsx, Footer.jsx
pages/
  Home.jsx                     # landing page
  ListingDetail.jsx            # single listing + booking
  Login.jsx / Register.jsx     # auth pages
  ForgotPassword / ResetPassword
  Profile.jsx / Settings.jsx   # user account
  MyBookings.jsx               # guest booking history
  Host.jsx                     # host application (4-step form)
  Dashboard.jsx (host)         # host bookings, revenue chart, reviews
  AdminDashboard / AdminUsers / AdminApprovals / AdminCareers
  About / Contact / Careers / Press / HostResources / Community
services/api.js                # all API calls; Bearer token auto-injected; 401 → redirect
```

## Key Patterns

### Auth Flow
1. User registers/logs in → backend returns JWT
2. Frontend stores `token` + `user` in localStorage
3. `AppContext` loads them on mount, re-fetches `/users/me` to refresh
4. `api.js` injects `Authorization: Bearer <token>` on every request
5. 401 response → clears localStorage, redirects to `/login`

### User Roles
- `guest` — browsing only (default after registration)
- `client` — can make bookings
- `host` — can create listings (after admin approves application via `POST /users/me/become-host`)
- `admin` — full platform access

### Payment Flow (M-Pesa)
1. Frontend: `POST /payments/mpesa/stk-push` with phone + booking_id
2. Backend: Daraja gets OAuth token → sends STK push to user's phone
3. User enters M-Pesa PIN on phone
4. Daraja calls `POST /payments/mpesa/callback` (must be a public URL — use ngrok in dev)
5. Frontend polls `GET /payments/status/{checkoutRequestId}` every 3s
6. On `completed`: booking status → `confirmed`, confirmation email sent

### Service Approval Workflow
1. Host creates service → status = `pending`
2. Admin reviews at `/admin/approvals`
3. Admin approves/rejects → email sent to host
4. Only `approved` services appear in public listing results

### API Conventions
- Base URL: `http://localhost:8000` (set in `frontend/src/services/api.js`)
- All endpoints prefixed `/api/v1/`
- Auth: `Authorization: Bearer <jwt>`
- Validation errors: `{ detail: [...] }` (Pydantic format); `api.js` normalizes to readable strings

## Database Models (`backend/app/models/all_models.py`)
`User`, `Service`, `Accommodation`, `Transport`, `Availability`, `Trip`, `TripSegment`, `Booking`, `Payment`, `Review`, `JobOpening`, `CartItem`

### CartItem fields
`id`, `user_id`, `service_id`, `check_in`, `check_out`, `quantity`, `saved_price` (locked at add time), `created_at`

## Cart Flow
1. User browses listing → clicks "Add to Cart" → `POST /cart/add` with service_id + dates
2. Cart page at `/cart` shows all items with subtotal, platform fee (12%), total
3. "Proceed to Payment" creates one booking per item → redirects to `/bookings`
4. Each booking is paid individually via existing M-Pesa / card flow

## Trip Generation Flow (Rule-Based)
1. `POST /trips/generate` takes `destination`, `purpose`, `check_in`, `check_out`, `group_size`, `max_budget`
2. Engine scores approved listings by purpose keywords + destination text match
3. Returns day-by-day itinerary with recommended accommodation + transport
4. `POST /trips/save` saves a Trip + TripSegment rows to DB
5. `GET /trips/saved` lists all saved trips

## Card Payment Flow (Flutterwave)
1. Frontend calls `POST /payments/card/charge` with just `booking_id`
2. Backend creates Flutterwave payment link (no card data stored)
3. Returns `payment_link` → frontend opens it in new tab/redirect
4. Flutterwave calls `POST /payments/flutterwave/callback` on completion
5. Backend confirms booking status → sends email

## Image Upload
- `POST /services/{id}/photos` — upload JPEG/PNG/WebP (multipart/form-data)
- Files saved to `backend/uploads/` directory, served at `/uploads/{filename}`
- URL appended to `service.service_metadata.images[]`

## New API Endpoints (added)
- `GET /services?q=&type=&location=&min_price=&max_price=` — server-side filtered search
- `GET /cart`, `POST /cart/add`, `PUT /cart/{id}`, `DELETE /cart/{id}`, `DELETE /cart`
- `POST /trips/generate`, `GET /trips/suggestions`, `POST /trips/save`, `GET /trips/saved`
- `POST /payments/card/charge` — Flutterwave payment link
- `POST /payments/flutterwave/callback` — Flutterwave webhook
- `POST /services/{id}/photos` — image upload

## Rate Limiting
`slowapi` is installed and configured in `main.py`. Default: 200 req/min per IP. Override per route with `@limiter.limit("X/minute")`.

## What's Implemented (~95% of Phase 1 MVP)
- [x] Email/password auth + Google OAuth
- [x] JWT with Redis token blacklist
- [x] Password reset via email token
- [x] User roles + admin approval for hosts
- [x] Service/listing CRUD (accommodation + transport)
- [x] Server-side search + filter (`?q=&type=&location=&min_price=&max_price=`)
- [x] Admin moderation queue for listings and hosts
- [x] Booking creation, status tracking, cancellation
- [x] M-Pesa STK Push + Daraja webhook callback + polling
- [x] Card payment via Flutterwave hosted checkout (needs `FLUTTERWAVE_SECRET_KEY`)
- [x] Persistent cart (`cart_items` table, `/cart` endpoints, Cart page)
- [x] Trip generation engine (rule-based, `POST /trips/generate`)
- [x] Trip save/retrieve (`POST /trips/save`, `GET /trips/saved`)
- [x] Review system (1–5 stars + comments)
- [x] Email notifications (8 event types)
- [x] Image upload (local `uploads/` dir, served as static files)
- [x] API rate limiting (slowapi, 200 req/min default)
- [x] Host dashboard (bookings, revenue chart, reviews)
- [x] Admin dashboard (stats, users, approvals, careers)
- [x] 24 frontend pages with role-based routing

## Remaining Gaps
1. **Airtel Money** — stub returns 503; needs Airtel Africa Collection API credentials
2. **Image storage** — currently local `uploads/`; migrate to S3/Cloudflare R2 before deployment
3. **SMS/push notifications** — email only; add Africa's Talking SMS for trip reminders
4. **SECRET_KEY** — must be changed from `supersecret` before any deployment
5. **Flutterwave credentials** — add `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_PUBLIC_KEY` to `.env`
