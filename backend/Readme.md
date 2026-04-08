# 🇮🇳 India Quiz Backend API

A production-grade RESTful backend for the India Quiz & IKS (Indian Knowledge Systems) application, built with **Node.js**, **Express**, **TypeScript**, **MongoDB (Mongoose)**, and **ES6 modules**.

---

## 📁 Project Structure

```
src/
├── config/
│   ├── app.config.ts        # Centralized environment config
│   └── database.ts          # MongoDB connection with reconnect logic
├── controllers/
│   ├── auth.controller.ts   # Auth endpoints (register/login/refresh/me)
│   ├── category.controller.ts
│   └── quiz.controller.ts
├── middlewares/
│   ├── auth.middleware.ts   # JWT protect + role-based authorize
│   ├── error.middleware.ts  # Global error handler + 404
│   ├── validate.middleware.ts # Zod schema validation factory
│   └── schemas.ts           # All Zod validation schemas
├── models/
│   ├── category.model.ts    # Category + embedded Question schema
│   ├── user.model.ts        # User schema with bcrypt
│   └── quiz-attempt.model.ts
├── routes/
│   ├── index.ts             # Root router + health check
│   ├── auth.routes.ts
│   ├── category.routes.ts
│   └── quiz.routes.ts
├── seed/
│   └── seed.ts              # Full DB seeder with all 10 categories
├── services/
│   ├── auth.service.ts      # JWT generation, login, register
│   ├── category.service.ts  # Category & question CRUD
│   └── quiz.service.ts      # Submit attempt, leaderboard, stats
├── types/
│   └── index.ts             # Shared TypeScript interfaces & types
├── utils/
│   ├── app-error.ts         # Custom error classes
│   ├── logger.ts            # Winston logger
│   ├── quiz.helper.ts       # Score calc, title, motivational messages
│   └── response.helper.ts   # Standardized API response helpers
├── app.ts                   # Express app factory (middlewares wired)
└── server.ts                # HTTP server + graceful shutdown
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Seed the Database
```bash
npm run seed
```
This seeds **10 categories** with **105 questions** and creates an admin user.

> **Admin credentials:** `admin@indiaquiz.com` / `Admin@12345`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🌐 API Reference

**Base URL:** `http://localhost:5000/api/v1`

All responses follow this envelope:
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... },
  "meta": { "total": 10, "page": 1, "limit": 10, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}
```

---

### 🔐 Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns tokens |
| POST | `/auth/refresh` | Public | Get new access token |
| GET | `/auth/me` | Private | Get current user |

**Register / Login body:**
```json
{ "name": "Arjun", "email": "arjun@example.com", "password": "Secure@123" }
```

**Token usage:**
```
Authorization: Bearer <accessToken>
```

---

### 📚 Category Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/categories` | Public | List all categories (paginated) |
| GET | `/categories/:id` | Public | Get category with all questions |
| GET | `/categories/slug/:slug` | Public | Get category by slug |
| GET | `/categories/:id/questions` | Public | Get questions (answers hidden) |
| POST | `/categories` | Admin | Create category |
| PATCH | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Soft-delete category |
| POST | `/categories/:id/questions` | Admin | Add question |
| PATCH | `/categories/:id/questions/:qId` | Admin | Update question |
| DELETE | `/categories/:id/questions/:qId` | Admin | Delete question |

**Query params:** `?page=1&limit=10&search=vedic&difficulty=easy`

---

### 🎯 Quiz Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/quiz/attempt` | Private | Submit quiz attempt |
| GET | `/quiz/history` | Private | Get user's quiz history |
| GET | `/quiz/history/:id` | Private | Get specific attempt detail |
| GET | `/quiz/stats` | Private | Get user aggregate stats |
| GET | `/quiz/leaderboard` | Public | Get leaderboard |

**Submit Attempt body:**
```json
{
  "categoryId": "<ObjectId>",
  "timeTaken": 120,
  "answers": [
    { "questionId": "<ObjectId>", "selectedAnswer": 1, "timeTaken": 15 }
  ]
}
```

**Attempt Response includes:**
- Score, percentage, correctAnswers, wrongAnswers
- Earned title (Abhyasi → Maharishi scale)
- Motivational message
- Full question breakdown with correct answers revealed

---

### 🏆 Leaderboard

```
GET /quiz/leaderboard?categoryId=<id>&page=1&limit=10
```

Returns ranked entries with best score per user per category, sorted by percentage desc, then fastest time.

---

## 🗃️ Data Models

### Category
```
legacyId, name, slug (unique), icon, description, color, isActive
questions[]: { question, options[], correctAnswer, difficulty, explanation }
```

### User
```
name, email (unique), password (hashed), role (user|admin), isActive, lastLogin
```

### QuizAttempt
```
user, category, answers[], score, totalQuestions, correctAnswers,
wrongAnswers, percentage, timeTaken, earnedTitle, titleEmoji, completedAt
```

---

## 🏅 Scoring Titles

| Score % | Title | Emoji |
|---------|-------|-------|
| 100% | Maharishi | 👑 |
| ≥ 80% | Pandit | 🏆 |
| ≥ 60% | Vidwan | 🎖️ |
| ≥ 40% | Shishya | 📚 |
| ≥ 20% | Medhavi | 🌟 |
| < 20% | Abhyasi | 🙏 |

---

## 🔒 Security Features

- **Helmet** – Secure HTTP headers
- **CORS** – Configurable allowed origins
- **Rate Limiting** – 100 req / 15 min per IP
- **Mongo Sanitize** – Prevents NoSQL injection
- **Zod Validation** – Schema-level input validation on all routes
- **bcrypt** – Password hashing with cost factor 12
- **JWT** – Short-lived access tokens (15m) + refresh tokens (7d)
- **Role-based Authorization** – `user` and `admin` roles

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 (strict mode) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) |
| Logging | Winston |
| Module System | ES Modules (`"type": "module"`) |