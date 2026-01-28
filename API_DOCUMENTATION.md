# POS System API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Testing with Postman](#testing-with-postman)

## 🌟 Overview

This is a complete REST API for a Point of Sale (POS) system built with NestJS, Prisma, and PostgreSQL. The API provides endpoints for:

- **Authentication**: User registration, login, profile management
- **Products**: CRUD operations for product management
- **Customers**: Customer relationship management
- **Sales**: Sales transaction processing
- **Uploads**: File upload handling for images

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate deploy

# Start the server
npm run start:dev
```

### Base URLs
- **Production**: `https://pos-bu4g.onrender.com`
- **Local Development**: `http://localhost:3000`

## 🔐 Authentication

Most endpoints require JWT authentication. After logging in or registering, you'll receive:
- `accessToken`: Short-lived token for API requests (include in Authorization header)
- `refreshToken`: Long-lived token to get new access tokens

### Using Authentication

Include the access token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## 📡 API Endpoints

### Authentication Endpoints

#### 1. Register
- **Endpoint**: `POST /auth/register`
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### 2. Login
- **Endpoint**: `POST /auth/login`
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**: Same as Register

#### 3. Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Authentication**: Not required
- **Request Body**:
```json
{
  "refreshToken": "your-refresh-token"
}
```
- **Response**:
```json
{
  "accessToken": "new-access-token"
}
```

#### 4. Logout
- **Endpoint**: `POST /auth/logout`
- **Authentication**: Not required
- **Response**:
```json
{
  "message": "Logged out"
}
```

#### 5. Get Profile
- **Endpoint**: `GET /auth/profile`
- **Authentication**: Required
- **Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "My Company",
  "address": "123 Main St",
  "profile_image_url": "https://...",
  "created_at": "2026-01-25T10:30:00Z"
}
```

#### 6. Update Profile
- **Endpoint**: `PUT /auth/profile`
- **Authentication**: Required
- **Request Body**:
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "My Company",
  "address": "123 Main St, City, Country"
}
```

#### 7. Change Password
- **Endpoint**: `POST /auth/change-password`
- **Authentication**: Required
- **Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### 8. Update Notifications
- **Endpoint**: `PUT /auth/notifications`
- **Authentication**: Required
- **Request Body**:
```json
{
  "emailNotifications": true,
  "pushNotifications": false
}
```

#### 9. Update Preferences
- **Endpoint**: `PUT /auth/preferences`
- **Authentication**: Required
- **Request Body**:
```json
{
  "language": "en",
  "theme": "dark",
  "currency": "USD"
}
```

---

### Product Endpoints

#### 1. Get All Products
- **Endpoint**: `GET /products`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 10): Items per page
  - `search` (string): Search term for name or SKU
  - `sortBy` (string, default: "created_at"): Field to sort by
  - `order` (string: "asc" | "desc", default: "desc"): Sort order

- **Example**: `GET /products?page=1&limit=10&search=laptop&sortBy=price&order=asc`

- **Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Laptop",
      "sku": "LAP-001",
      "category": "Electronics",
      "price": "999.99",
      "stock_quantity": 50,
      "image_url": "https://...",
      "created_at": "2026-01-25T10:30:00Z",
      "updated_at": "2026-01-25T10:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### 2. Get Product by ID
- **Endpoint**: `GET /products/:id`
- **Authentication**: Required
- **Response**: Single product object

#### 3. Create Product
- **Endpoint**: `POST /products`
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "category": "Electronics",
  "price": 999.99,
  "stock_quantity": 50,
  "image_url": "https://..."
}
```
- **Validation**:
  - `name`: Required, string
  - `sku`: Required, string, must be unique
  - `category`: Optional, string (default: "General")
  - `price`: Required, number, minimum 0
  - `stock_quantity`: Required, integer, minimum 0
  - `image_url`: Optional, string

#### 4. Update Product
- **Endpoint**: `PUT /products/:id`
- **Authentication**: Required
- **Request Body**: Same as Create (all fields optional)

#### 5. Delete Product
- **Endpoint**: `DELETE /products/:id`
- **Authentication**: Required
- **Response**:
```json
{
  "message": "Product deleted successfully"
}
```

#### 6. Upload Product Image
- **Endpoint**: `POST /products/:id/image`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Image file (JPEG, PNG, etc.)
- **Response**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "product": { /* updated product */ },
  "message": "Product image uploaded successfully"
}
```

---

### Customer Endpoints

#### 1. Get All Customers
- **Endpoint**: `GET /customers`
- **Authentication**: Required
- **Query Parameters**: Same as Products (page, limit, search, sortBy, order)
- **Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "internal_notes": "VIP customer",
      "total_orders": 15,
      "total_spent": "5000.00",
      "last_visit": "2026-01-25T10:30:00Z",
      "created_at": "2026-01-01T10:30:00Z"
    }
  ],
  "meta": { /* pagination info */ }
}
```

#### 2. Get Customer by ID
- **Endpoint**: `GET /customers/:id`
- **Authentication**: Required
- **Response**: Single customer object with purchase history

#### 3. Create Customer
- **Endpoint**: `POST /customers`
- **Authentication**: Required
- **Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "internal_notes": "VIP customer"
}
```
- **Validation**:
  - `first_name`: Required, string
  - `last_name`: Required, string
  - `email`: Required, valid email
  - `phone`: Required, string
  - `internal_notes`: Optional, string

#### 4. Update Customer
- **Endpoint**: `PUT /customers/:id`
- **Authentication**: Required
- **Request Body**: Same as Create (all fields optional)

#### 5. Delete Customer
- **Endpoint**: `DELETE /customers/:id`
- **Authentication**: Required

---

### Sales Endpoints

#### 1. Get All Sales
- **Endpoint**: `GET /sales`
- **Authentication**: Required
- **Query Parameters**:
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `startDate` (string, ISO format): Filter from date (e.g., "2026-01-01")
  - `endDate` (string, ISO format): Filter to date (e.g., "2026-01-31")

- **Example**: `GET /sales?page=1&limit=10&startDate=2026-01-01&endDate=2026-01-31`

- **Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "customer_id": "uuid",
      "total_amount": "299.99",
      "created_at": "2026-01-25T10:30:00Z",
      "customer": {
        "first_name": "John",
        "last_name": "Doe"
      },
      "sale_items": [
        {
          "id": "uuid",
          "product_id": "uuid",
          "quantity": 2,
          "unit_price": "99.99",
          "subtotal": "199.98",
          "product": {
            "name": "Product Name",
            "sku": "SKU-001"
          }
        }
      ]
    }
  ],
  "meta": { /* pagination info */ }
}
```

#### 2. Get Sale by ID
- **Endpoint**: `GET /sales/:id`
- **Authentication**: Required
- **Response**: Single sale object with full details

#### 3. Create Sale
- **Endpoint**: `POST /sales`
- **Authentication**: Required
- **Request Body**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    },
    {
      "product_id": "uuid",
      "quantity": 1
    }
  ],
  "customer_id": "uuid"
}
```
- **Validation**:
  - `items`: Required, array of sale items
    - `product_id`: Required, valid product UUID
    - `quantity`: Required, integer, minimum 1
  - `customer_id`: Optional, UUID (for walk-in customers, omit this field)

- **Behavior**:
  - Automatically calculates `unit_price`, `subtotal`, and `total_amount`
  - Decreases product stock quantities
  - Updates customer's `total_orders`, `total_spent`, and `last_visit`
  - Links sale to the authenticated user

---

### Upload Endpoints

#### 1. Upload Product Image
- **Endpoint**: `POST /uploads/product`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Image file
- **Response**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "message": "Product image uploaded successfully"
}
```

#### 2. Upload Profile Image
- **Endpoint**: `POST /uploads/profile`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Image file
- **Response**:
```json
{
  "success": true,
  "imageUrl": "https://...",
  "message": "Profile image uploaded successfully"
}
```
- **Behavior**: Automatically updates user's profile image and deletes old image

---

## 📊 Data Models

### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  full_name?: string
  phone?: string
  company?: string
  address?: string
  profile_image_url?: string
  created_at: DateTime
  updated_at: DateTime
}
```

### Product
```typescript
{
  id: string (UUID)
  name: string
  sku: string (unique)
  category: string (default: "General")
  price: Decimal
  stock_quantity: number
  image_url?: string
  created_at: DateTime
  updated_at: DateTime
}
```

### Customer
```typescript
{
  id: string (UUID)
  first_name: string
  last_name: string
  email: string
  phone: string
  internal_notes?: string
  total_orders: number (default: 0)
  total_spent: Decimal (default: 0)
  last_visit?: DateTime
  created_at: DateTime
  updated_at: DateTime
}
```

### Sale
```typescript
{
  id: string (UUID)
  user_id: string (UUID)
  customer_id?: string (UUID)
  total_amount: Decimal
  created_at: DateTime
  sale_items: SaleItem[]
}
```

### SaleItem
```typescript
{
  id: string (UUID)
  sale_id: string (UUID)
  product_id: string (UUID)
  quantity: number
  unit_price: Decimal
  subtotal: Decimal
  created_at: DateTime
}
```

---

## ⚠️ Error Handling

The API uses standard HTTP status codes:

### Success Codes
- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST

### Client Error Codes
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation failed

### Server Error Codes
- `500 Internal Server Error`: Server-side error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

---

## 🧪 Testing with Postman

### Import the Collection

1. Open Postman
2. Click **Import**
3. Select `POS_API_Collection.postman_collection.json`
4. The collection will be imported with all endpoints

### Setup Environment

**Option 1: Use Pre-configured Variables (Recommended)**
- The collection comes with `baseUrl` set to `https://pos-bu4g.onrender.com`
- `accessToken` and `refreshToken` will be auto-set after login
- No need to create an environment!

**Option 2: Create Custom Environment**
1. Create a new environment in Postman
2. Add these variables:
   - `baseUrl`: `https://pos-bu4g.onrender.com` (or `http://localhost:3000` for local)
   - `accessToken`: (leave empty, will be auto-set)
   - `refreshToken`: (leave empty, will be auto-set)

### Testing Flow

1. **Register/Login**: Start by registering a new user or logging in
   - The collection automatically saves tokens to environment variables
   
2. **Test Authentication**: Try the "Get Profile" endpoint to verify auth works

3. **Create Resources**: Create products and customers

4. **Test Sales**: Create a sale with the product IDs you created

5. **Upload Images**: Test file uploads for products and profile

### Auto-Authentication

The collection includes scripts that automatically:
- Save tokens after login/register
- Use tokens for authenticated requests
- No need to manually copy/paste tokens!

---

## 📝 Notes

### Password Requirements
- Minimum 8 characters
- Must include letters and numbers (recommended)

### File Upload Limits
- Maximum file size: 50MB
- Supported formats: JPEG, PNG, GIF, WebP

### Pagination
- Default page size: 10 items
- Maximum page size: 100 items

### Date Formats
- All dates are in ISO 8601 format
- Example: `2026-01-25T10:30:00Z`

### Decimal Fields
- All prices and amounts use 2 decimal places
- Example: `99.99`, `1500.00`

---

## 🔗 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Postman Documentation](https://learning.postman.com/)

---

## 📧 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: January 28, 2026
