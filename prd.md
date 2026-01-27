1. Project Overview
1.1 Purpose
Build a Point of Sale (POS) application that demonstrates production-ready code quality, system design capabilities, and full-stack development proficiency using modern web technologies.
1.2 Goals

Deliver a fully functional POS system with authentication, product management, and sales processing
Demonstrate clean architecture, best practices, and deployment readiness
Create an intuitive user interface for managing products and processing sales

1.3 Success Criteria

All core features implemented and working
Code follows industry best practices and is maintainable
Application deployed and accessible via live URLs
Comprehensive API documentation via Postman collection


2. Technical Stack
2.1 Backend

Framework: NestJS (Node.js framework)
Database: PostgreSQL (relational database)
ORM: Prisma (database toolkit)
Cache: Redis (in-memory data store)
Authentication: JWT (JSON Web Tokens)

2.2 Frontend

Build Tool: Vite
Framework: React
UI Library: Ant Design
Data Fetching: TanStack Query (React Query)

2.3 Infrastructure

Version Control: Git (single repository - monorepo)
Deployment: Live hosting for both frontend and backend
API Documentation: Postman collection


3. Feature Requirements
3.1 Authentication System
3.1.1 User Registration
Priority: High
Description: Allow new users to create accounts
Requirements:

Email validation (unique, proper format)
Password validation (minimum 8 characters, complexity rules)
Secure password hashing (bcrypt)
Return appropriate error messages

API Endpoint:
POST /auth/register
Body: { email, password }
Response: { message, userId }
3.1.2 User Login
Priority: High
Description: Authenticate users and provide access tokens
Requirements:

Email and password verification
Generate JWT access token (expires in 1 hour)
Generate JWT refresh token (expires in 7 days)
Return user information with tokens

API Endpoint:
POST /auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user: { id, email } }
3.1.3 Token Refresh
Priority: Medium
Description: Allow users to refresh expired access tokens
Requirements:

Validate refresh token
Generate new access token
Invalidate old refresh token (optional security enhancement)

API Endpoint:
POST /auth/refresh
Body: { refreshToken }
Response: { accessToken }
3.1.4 Logout
Priority: Medium
Description: Invalidate user session
Requirements:

Blacklist tokens in Redis
Clear client-side tokens

API Endpoint:
POST /auth/logout
Headers: { Authorization: Bearer <token> }
Response: { message }
3.1.5 Route Protection
Requirements:

Implement JWT authentication guard
Protect all product and sales endpoints
Return 401 for unauthorized requests
Frontend route guards for protected pages


3.2 Product Management
3.2.1 Create Product
Priority: High
Description: Add new products to inventory
Requirements:

All fields required
SKU must be unique
Price must be positive number
Stock quantity must be non-negative integer
Validate input data

Data Model:
typescriptProduct {
  id: string (UUID)
  name: string
  sku: string (unique)
  price: decimal
  stock_quantity: integer
  created_at: timestamp
  updated_at: timestamp
}
```

**API Endpoint**:
```
POST /products
Body: { name, sku, price, stock_quantity }
Response: { product }
```

**UI Requirements**:
- Modal or dedicated page with form
- Real-time validation
- Success/error notifications

#### 3.2.2 List Products
**Priority**: High  
**Description**: Display all products with pagination and search

**Requirements**:
- Pagination (10 items per page)
- Search by name or SKU
- Sort by name, price, or stock quantity
- Display all product fields
- Show out-of-stock indicators

**API Endpoint**:
```
GET /products?page=1&limit=10&search=&sortBy=name&order=asc
Response: { products[], total, page, limit }
```

**UI Requirements**:
- Data table with columns: Name, SKU, Price, Stock, Actions
- Search input with debounce
- Pagination controls
- Visual indicators for low/out of stock

#### 3.2.3 Update Product
**Priority**: High  
**Description**: Modify existing product details

**Requirements**:
- All fields editable except created_at
- SKU uniqueness validation (excluding current product)
- Same validation rules as create
- Optimistic updates with rollback on error

**API Endpoint**:
```
PUT /products/:id
Body: { name, sku, price, stock_quantity }
Response: { product }
```

**UI Requirements**:
- Edit modal/form with pre-filled values
- Inline editing option (nice to have)
- Confirmation for changes

#### 3.2.4 Delete Product
**Priority**: Medium  
**Description**: Remove products from the system

**Requirements**:
- Soft delete or hard delete (decision documented)
- Prevent deletion if product has sales history (optional enhancement)
- Confirmation dialog

**API Endpoint**:
```
DELETE /products/:id
Response: { message }
```

**UI Requirements**:
- Delete button with confirmation modal
- Success notification

#### 3.2.5 View Product Details
**Priority**: Low  
**Description**: Show detailed product information

**Requirements**:
- Display all product fields
- Show sales history (optional enhancement)
- Show stock movement history (optional enhancement)

**API Endpoint**:
```
GET /products/:id
Response: { product }

3.3 Sales Management
3.3.1 Create Sale
Priority: High
Description: Process product sales and update inventory
Requirements:

Select one or multiple products
Specify quantity for each product
Validate stock availability before processing
Calculate total amount
Deduct stock quantities atomically
Record sale transaction

Data Model:
typescriptSale {
  id: string (UUID)
  total_amount: decimal
  created_at: timestamp
  sale_items: SaleItem[]
}

SaleItem {
  id: string (UUID)
  sale_id: string
  product_id: string
  quantity: integer
  unit_price: decimal
  subtotal: decimal
}
```

**API Endpoint**:
```
POST /sales
Body: {
  items: [
    { product_id, quantity }
  ]
}
Response: { sale, message }
```

**Business Logic**:
- Check stock availability for ALL items before processing
- If any item has insufficient stock, reject entire sale
- Use database transaction to ensure atomicity
- Lock product rows during stock deduction
- Calculate subtotals and total

**UI Requirements**:
- Product selection (dropdown/autocomplete)
- Quantity input for each item
- Real-time total calculation
- Stock availability indicator
- Add/remove item functionality
- Clear error messages for insufficient stock

#### 3.3.2 List Sales
**Priority**: Medium  
**Description**: View sales history

**Requirements**:
- Pagination
- Filter by date range
- Display sale ID, total amount, date
- Expandable rows to show sale items

**API Endpoint**:
```
GET /sales?page=1&limit=10&startDate=&endDate=
Response: { sales[], total, page, limit }
```

**UI Requirements**:
- Data table with pagination
- Date range picker
- Expandable rows for sale details

#### 3.3.3 View Sale Details
**Priority**: Medium  
**Description**: Show complete sale information

**Requirements**:
- Display all sale items with product details
- Show quantities, prices, subtotals
- Display total amount

**API Endpoint**:
```
GET /sales/:id
Response: { sale }
3.3.4 Stock Validation
Priority: High
Description: Prevent overselling
Requirements:

Real-time stock checking during sale creation
Clear error messages specifying which products have insufficient stock
Frontend validation before API call
Backend validation as final check

Error Response Example:
json{
  "error": "Insufficient stock",
  "details": [
    {
      "product_id": "uuid",
      "product_name": "Product A",
      "requested": 10,
      "available": 5
    }
  ]
}

4. Non-Functional Requirements
4.1 Security

Passwords hashed using bcrypt (minimum 10 rounds)
JWT tokens with appropriate expiration
HTTP-only cookies for refresh tokens (optional enhancement)
Input validation and sanitization
SQL injection prevention (via Prisma)
XSS protection
CORS configuration

4.2 Performance

API response time < 500ms for standard operations
Database queries optimized with proper indexing
Redis caching for frequently accessed data
Lazy loading for frontend components
Debounced search inputs

4.3 Data Integrity

Database transactions for sales operations
Foreign key constraints
Unique constraints on SKU
Validation at both frontend and backend

4.4 Error Handling

Consistent error response format
Appropriate HTTP status codes
User-friendly error messages
Backend error logging
Frontend error boundaries

4.5 Code Quality

TypeScript for type safety
ESLint configuration
Prettier for code formatting
Meaningful variable and function names
Code comments for complex logic
DRY principle adherence


5. Database Schema
5.1 Users Table
sqlCREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
5.2 Products Table
sqlCREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
5.3 Sales Table
sqlCREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
5.4 Sale Items Table
sqlCREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

6. API Endpoints Summary
6.1 Authentication

POST /auth/register - Register new user
POST /auth/login - Login user
POST /auth/refresh - Refresh access token
POST /auth/logout - Logout user

6.2 Products

POST /products - Create product
GET /products - List products (with pagination, search, sort)
GET /products/:id - Get product details
PUT /products/:id - Update product
DELETE /products/:id - Delete product

6.3 Sales

POST /sales - Create sale
GET /sales - List sales (with pagination, filters)
GET /sales/:id - Get sale details


7. Frontend Routes
7.1 Public Routes

/login - Login page
/register - Registration page

7.2 Protected Routes

/ or /dashboard - Dashboard/Home
/products - Product listing and management
/products/new - Create new product
/products/:id/edit - Edit product
/sales - Sales listing
/sales/new - Create new sale
/sales/:id - View sale details


8. Redis Usage
8.1 Token Blacklist

Store invalidated JWT tokens
Key: blacklist:${token}
TTL: Token expiration time

8.2 Session Cache (Optional)

Cache user sessions
Key: session:${userId}
TTL: Access token expiration

8.3 Product Cache (Optional)

Cache frequently accessed products
Key: product:${productId}
TTL: 5-10 minutes
Invalidate on update/delete


9. Deployment Requirements
9.1 Backend Deployment

Environment variables configuration
Database migrations run
Redis connection established
CORS configured for frontend domain
Health check endpoint: GET /health

Recommended Platforms: Railway, Render, Fly.io, AWS
9.2 Frontend Deployment

Environment variables for API URL
Production build optimization
Static file serving
Routing configuration (SPA fallback)

Recommended Platforms: Vercel, Netlify, Cloudflare Pages
9.3 Database Hosting

PostgreSQL instance
Connection pooling configured
Backup strategy (optional)

Recommended Platforms: Supabase, Neon, Railway, AWS RDS
9.4 Redis Hosting

Redis instance accessible to backend
Connection string configured

Recommended Platforms: Upstash, Redis Cloud, Railway