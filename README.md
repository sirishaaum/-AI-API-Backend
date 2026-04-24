# 🤖 AI API Backend

[![CI/CD](https://github.com/YOUR_USERNAME/ai-api-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ai-api-backend/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://www.docker.com/)

A production-grade **AI-powered REST API** built with Node.js and Express, powered by Anthropic's Claude. Features JWT authentication, streaming responses via SSE, multi-turn conversation history, per-user token quotas, and a full CI/CD pipeline.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 JWT Auth | Register, login, protected routes |
| 💬 AI Chat | Multi-turn conversations with session history |
| ⚡ Streaming | Real-time token streaming via Server-Sent Events |
| 📊 Token Quotas | Per-user daily token usage tracking |
| 🛡️ Security | Helmet, CORS, rate limiting, bcrypt |
| 🐳 Docker | Dockerfile + docker-compose with Redis |
| 🧪 Tests | Unit & integration tests with Vitest |
| 🔄 CI/CD | GitHub Actions — test, build, push to Docker Hub |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP / SSE
┌─────────────────────▼───────────────────────────────────────┐
│                   Express App                               │
│                                                             │
│   ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│   │   Helmet   │  │    CORS    │  │   Rate Limiter     │   │
│   └────────────┘  └────────────┘  └────────────────────┘   │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │                     Routes                          │  │
│   │  /api/auth   /api/chat   /api/health                │  │
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│   ┌──────────────────────▼───────────────────────────────┐  │
│   │              JWT Auth Middleware                     │  │
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                  │
│   ┌──────────────────────▼───────────────────────────────┐  │
│   │                 Controllers                          │  │
│   │      authController    chatController               │  │
│   └──────────┬─────────────────────┬────────────────────┘  │
│              │                     │                        │
│   ┌──────────▼──────┐  ┌───────────▼────────────────────┐  │
│   │   Session Store │  │        AI Service              │  │
│   │   (Redis/Memory)│  │   (Anthropic Claude SDK)       │  │
│   └─────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/ai-api-backend.git
cd ai-api-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in JWT_SECRET and ANTHROPIC_API_KEY
```

### 3. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### 4. Run with Docker

```bash
docker-compose up --build
```

---

## 📡 API Reference

### Auth

#### `POST /api/auth/register`
```json
// Request
{ "username": "alice", "password": "SecurePass1!", "email": "alice@example.com" }

// Response 201
{ "token": "eyJ...", "user": { "id": "uuid", "username": "alice", "email": "..." } }
```

#### `POST /api/auth/login`
```json
// Request
{ "username": "alice", "password": "SecurePass1!" }

// Response 200
{ "token": "eyJ...", "user": { ... } }
```

#### `GET /api/auth/me` 🔒
```json
// Response 200
{ "id": "uuid", "username": "alice", "email": "alice@example.com", "createdAt": "..." }
```

---

### Chat `🔒 All routes require Bearer token`

#### `POST /api/chat`
Send a message and receive a full AI response with conversation history.

```json
// Request
{
  "message": "Explain async/await in JavaScript",
  "session_id": "my-session",        // optional — defaults to user-default
  "system_prompt": "You are a senior engineer." // optional
}

// Response 200
{
  "session_id": "my-session",
  "response": "Async/await is syntactic sugar over Promises...",
  "usage": { "input_tokens": 24, "output_tokens": 180, "total_tokens": 204 },
  "stop_reason": "end_turn"
}
```

#### `POST /api/chat/stream`
Stream AI response token-by-token via Server-Sent Events.

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story", "session_id": "stream-1"}'

# SSE events:
# data: {"text":"Once"}
# data: {"text":" upon"}
# data: {"done":true,"usage":{...}}
```

#### `GET /api/chat/usage` 🔒
```json
{
  "user_id": "uuid",
  "tokens_used_today": 1240,
  "daily_quota": 50000,
  "remaining": 48760
}
```

#### `GET /api/chat/session/:sessionId` 🔒
Get full conversation history for a session.

#### `DELETE /api/chat/session/:sessionId` 🔒
Clear conversation history for a session.

---

### Health

#### `GET /api/health`
```json
{ "status": "ok", "uptime": 123.45, "timestamp": "2025-01-01T00:00:00Z", "version": "1.0.0" }
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

Tests are split into:
- `tests/unit/` — controller logic with mocked services
- `tests/integration/` — full HTTP request/response via Supertest

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry duration |
| `ANTHROPIC_API_KEY` | **Yes** | — | Your Anthropic API key |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS origins |
| `MAX_TOKENS` | No | `1024` | Max tokens per AI response |
| `DAILY_TOKEN_QUOTA` | No | `50000` | Daily token quota per user |

---

## 🔮 Roadmap

- [ ] Swap in-memory stores for PostgreSQL (users) + Redis (sessions)
- [ ] Add OAuth2 (Google / GitHub) login
- [ ] Persist conversation history to database
- [ ] Add admin dashboard with usage analytics
- [ ] Support multiple AI providers (OpenAI, Gemini)
- [ ] WebSocket support for bidirectional streaming

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [YOUR_USERNAME](https://github.com/YOUR_USERNAME)
