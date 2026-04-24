import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";

const app = express();

// Security & utilities
app.use(helmet());
app.use(cors({ origin: config.ALLOWED_ORIGINS.split(",") }));
app.use(morgan("combined"));
app.use(express.json({ limit: "10kb" }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

export default app;
