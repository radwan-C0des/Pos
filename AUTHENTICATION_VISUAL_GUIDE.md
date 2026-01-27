# 🔐 AUTHENTICATION VISUAL REFERENCE GUIDE

## Route Protection Diagram

```
FRONTEND APPLICATION (React)
├─ Public Routes (No Auth Needed)
│  ├─ /login
│  └─ /register
│
└─ Protected Routes (Auth Needed)
   └─ <ProtectedRoute> ← Authentication Check
      ├─ if (loading) → Show "Loading..."
      ├─ if (!user) → Navigate to /login
      └─ if (user) → Render children
         ├─ /
         ├─ /products
         ├─ /products/new
         ├─ /sales
         └─ /sales/new

BACKEND APPLICATION (NestJS)
├─ Public Endpoints (No JWT Needed)
│  ├─ POST /auth/register
│  ├─ POST /auth/login
│  └─ POST /auth/refresh
│
└─ Protected Endpoints (JWT Needed)
   └─ @UseGuards(AuthGuard('jwt')) ← JWT Validation
      ├─ GET /products
      ├─ POST /products
      ├─ GET /products/:id
      ├─ PUT /products/:id
      ├─ DELETE /products/:id
      ├─ GET /sales
      ├─ POST /sales
      └─ GET /sales/:id
```

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER REGISTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User enters email + password on /register                    │
│     ↓                                                             │
│  2. Frontend: POST /auth/register (no token needed)              │
│     ↓                                                             │
│  3. Backend: Validate email doesn't exist                        │
│     ↓                                                             │
│  4. Backend: Hash password with bcrypt (10 rounds)               │
│     ↓                                                             │
│  5. Backend: Store user in database                              │
│     ↓                                                             │
│  6. Frontend: Display success message                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        USER LOGIN                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User enters email + password on /login                       │
│     ↓                                                             │
│  2. Frontend: POST /auth/login (no token needed)                 │
│     ↓                                                             │
│  3. Backend: Find user by email                                  │
│     ↓                                                             │
│  4. Backend: Verify password with bcrypt                         │
│     ↓                                                             │
│  5. Backend: Generate accessToken (1 hour)                       │
│             Generate refreshToken (7 days)                       │
│     ↓                                                             │
│  6. Backend: Return tokens + user data                           │
│     ↓                                                             │
│  7. Frontend: Store tokens in localStorage                       │
│             Store user info in React state                       │
│     ↓                                                             │
│  8. Frontend: Redirect to / (Dashboard)                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PROTECTED API REQUEST                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User clicks "Get Products" on /products page                 │
│     ↓                                                             │
│  2. Frontend: GET /products request                              │
│     ↓                                                             │
│  3. Axios Interceptor: Add Authorization header                  │
│     Header: "Authorization: Bearer <accessToken>"                │
│     ↓                                                             │
│  4. Backend: Receive request with Authorization header           │
│     ↓                                                             │
│  5. JWT Strategy: Extract token from header                      │
│     ↓                                                             │
│  6. JWT Strategy: Verify token signature                         │
│     ✅ Valid → Continue                                           │
│     ❌ Invalid → Return 401 Unauthorized                          │
│     ↓                                                             │
│  7. JWT Strategy: Check token expiration                         │
│     ✅ Not expired → Continue                                     │
│     ❌ Expired → Return 401 Unauthorized                          │
│     ↓                                                             │
│  8. JWT Strategy: Look up user in database                       │
│     ✅ User found → Continue                                      │
│     ❌ User not found → Return 401 Unauthorized                   │
│     ↓                                                             │
│  9. Backend: Process request (GET /products)                     │
│     ↓                                                             │
│ 10. Backend: Return 200 OK + product list                        │
│     ↓                                                             │
│ 11. Frontend: Display products to user                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      UNAUTHORIZED REQUEST                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Scenario 1: No Token                                            │
│  GET /products (no Authorization header)                         │
│  ↓ Backend JWT Strategy ↓                                        │
│  Status: 401 Unauthorized                                        │
│                                                                   │
│  Scenario 2: Invalid Token                                       │
│  GET /products                                                   │
│  Header: "Authorization: Bearer invalid_token"                   │
│  ↓ Backend JWT Strategy ↓                                        │
│  Signature verification fails                                    │
│  Status: 401 Unauthorized                                        │
│                                                                   │
│  Scenario 3: Tampered Token                                      │
│  GET /products                                                   │
│  Header: "Authorization: Bearer <modified_token>"                │
│  ↓ Backend JWT Strategy ↓                                        │
│  Signature verification fails                                    │
│  Status: 401 Unauthorized                                        │
│                                                                   │
│  Scenario 4: Expired Token                                       │
│  GET /products                                                   │
│  Header: "Authorization: Bearer <expired_token>"                 │
│  ↓ Backend JWT Strategy ↓                                        │
│  Token expiration check fails                                    │
│  Status: 401 Unauthorized                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## JWT Token Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                       JWT TOKEN FORMAT                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                              │
│  eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.     │
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                        │
│                                                                        │
│  └─ HEADER ─────────────────────────────────────────────────────────┘
│     { "alg": "HS256", "typ": "JWT" }                                 │
│                                                                        │
│  └─ PAYLOAD ────────────────────────────────────────────────────────┘
│     { "sub": "user-id", "email": "user@example.com" }                │
│     sub = subject (user ID from database)                            │
│     email = user email for reference                                 │
│                                                                        │
│  └─ SIGNATURE ──────────────────────────────────────────────────────┘
│     HMAC-SHA256(                                                      │
│       base64UrlEncode(header) + "." + base64UrlEncode(payload),      │
│       "JWT_ACCESS_SECRET"                                             │
│     )                                                                  │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN GENERATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Login Successful                                                │
│  ↓                                                               │
│  ┌─ Access Token ──────┐         ┌─ Refresh Token ──────┐       │
│  │ Expiry: 1 hour      │         │ Expiry: 7 days       │       │
│  │ Secret: JWT_ACCESS  │         │ Secret: JWT_REFRESH  │       │
│  │ Use: API calls      │         │ Use: Get new token   │       │
│  └─────────────────────┘         └──────────────────────┘       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN USAGE TIMELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  T+0 min      Login
│               Generate tokens
│               Store in localStorage
│               ↓
│  T+1 min      User browses app
│               Make API call with accessToken
│               Status: ✅ Valid (59 min left)
│               ↓
│  T+30 min     User still browsing
│               Make API call with accessToken
│               Status: ✅ Valid (30 min left)
│               ↓
│  T+59 min     User makes final request
│               Make API call with accessToken
│               Status: ✅ Valid (1 min left)
│               ↓
│  T+60 min     User tries to make request
│               Make API call with accessToken
│               Status: ❌ Token Expired (401)
│               ↓
│  Automatic    Send refreshToken to /auth/refresh
│  Recovery     Get new accessToken (1 hour valid)
│               Retry original request with new token
│               Status: ✅ Valid
│               ↓
│  T+7 days     refreshToken expires
│               User must login again
│               ↓
│  Logout       User clicks logout
│               Clear localStorage
│               Clear tokens
│               Redirect to /login
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## HTTP Status Codes

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS RESPONSES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  200 OK              Protected endpoint accessed successfully     │
│  201 Created         Resource created (POST /auth/login)         │
│  204 No Content      Resource deleted successfully               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ERROR RESPONSES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  400 Bad Request     Invalid request data                        │
│  401 Unauthorized    Missing or invalid JWT token                │
│  403 Forbidden       Not authorized to access resource           │
│  404 Not Found       Resource doesn't exist                      │
│  409 Conflict        Email already registered                    │
│  500 Server Error    Internal server error                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   401 UNAUTHORIZED CASES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ❌ No Authorization header provided                             │
│  ❌ Invalid Bearer token format                                  │
│  ❌ Token signature doesn't match secret                         │
│  ❌ Token expired (past expiration time)                         │
│  ❌ User ID in token doesn't exist in database                   │
│  ❌ Malformed token (not valid JWT)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

```
✅ TESTS TO RUN:

1. Public Route Access
   [ ] GET http://localhost:3000/auth/login (no token)
       Expected: Access allowed
   
2. Protected Route Without Token
   [ ] GET http://localhost:3000/products (no token)
       Expected: 401 Unauthorized

3. Protected Route With Valid Token
   [ ] GET http://localhost:3000/products (with valid JWT)
       Expected: 200 OK + data

4. Invalid Token
   [ ] GET http://localhost:3000/products (invalid JWT)
       Expected: 401 Unauthorized

5. Tampered Token
   [ ] GET http://localhost:3000/products (modified JWT)
       Expected: 401 Unauthorized

6. Frontend Route Without Auth
   [ ] Visit http://localhost:5173/
       Expected: Redirect to /login

7. Frontend Route With Auth
   [ ] Login then visit /products
       Expected: Page loads

8. Login/Logout
   [ ] Login → Verify tokens in localStorage
   [ ] Logout → Verify tokens cleared
```

---

## Environment Variables

```
BACKEND (.env)
──────────────
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET="topsecretaccess"      ← Signs access tokens
JWT_REFRESH_SECRET="topsecretrefresh"    ← Signs refresh tokens
PORT=3000
FRONTEND_URL=http://localhost:5173

FRONTEND (.env)
───────────────
VITE_API_URL=http://localhost:3000       ← Backend URL
```

---

**Reference Guide Complete** ✅  
All diagrams and information current as of January 25, 2026
