import { sendMessage, streamMessage } from "../services/aiService.js";
import {
  getHistory,
  appendHistory,
  clearHistory,
  getTokenUsage,
  incrementTokenUsage,
} from "../services/sessionStore.js";
import { AppError } from "../middleware/errorHandler.js";
import { config } from "../config/env.js";

export const chat = async (req, res, next) => {
  try {
    const { message, session_id, system_prompt } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== "string") {
      throw new AppError("'message' is required and must be a string", 400);
    }

    // Quota check
    const usage = getTokenUsage(userId);
    if (usage.total >= config.DAILY_TOKEN_QUOTA) {
      throw new AppError("Daily token quota exceeded", 429);
    }

    const sessionId = session_id || `${userId}-default`;
    const history = getHistory(sessionId);
    const messages = [...history, { role: "user", content: message }];

    const result = await sendMessage(messages, system_prompt);
    appendHistory(sessionId, message, result.response);
    incrementTokenUsage(userId, result.usage.total_tokens);

    res.json({
      session_id: sessionId,
      response: result.response,
      usage: result.usage,
      stop_reason: result.stop_reason,
    });
  } catch (err) {
    next(err);
  }
};

export const chatStream = async (req, res, next) => {
  try {
    const { message, session_id, system_prompt } = req.body;
    if (!message) throw new AppError("'message' is required", 400);

    const sessionId = session_id || `${req.user.id}-default`;
    const history = getHistory(sessionId);
    const messages = [...history, { role: "user", content: message }];

    await streamMessage(messages, system_prompt, res);
  } catch (err) {
    next(err);
  }
};

export const getSession = (req, res) => {
  const sessionId = req.params.sessionId;
  const history = getHistory(sessionId);
  res.json({ session_id: sessionId, messages: history, count: history.length });
};

export const deleteSession = (req, res) => {
  clearHistory(req.params.sessionId);
  res.json({ message: "Session cleared" });
};

export const getUsage = (req, res) => {
  const usage = getTokenUsage(req.user.id);
  res.json({
    user_id: req.user.id,
    tokens_used_today: usage.total,
    daily_quota: config.DAILY_TOKEN_QUOTA,
    remaining: Math.max(0, config.DAILY_TOKEN_QUOTA - usage.total),
  });
};
