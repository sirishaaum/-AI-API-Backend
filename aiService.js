import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

/**
 * Send a message and return a full response.
 * @param {Array} messages - Array of {role, content} objects
 * @param {string} systemPrompt - Optional system prompt
 * @returns {object} - { response, usage }
 */
export const sendMessage = async (messages, systemPrompt = "") => {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: config.MAX_TOKENS,
      system: systemPrompt || "You are a helpful assistant.",
      messages,
    });

    return {
      response: response.content[0].text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      stop_reason: response.stop_reason,
    };
  } catch (err) {
    if (err.status === 401) throw new AppError("Invalid Anthropic API key", 500);
    if (err.status === 429) throw new AppError("AI rate limit exceeded. Try again later.", 429);
    throw new AppError(`AI service error: ${err.message}`, 502);
  }
};

/**
 * Stream a response to the client using Server-Sent Events.
 * @param {Array} messages - Conversation history
 * @param {string} systemPrompt - Optional system prompt
 * @param {object} res - Express response object
 */
export const streamMessage = async (messages, systemPrompt = "", res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: config.MAX_TOKENS,
      system: systemPrompt || "You are a helpful assistant.",
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    const finalMessage = await stream.finalMessage();
    res.write(
      `data: ${JSON.stringify({
        done: true,
        usage: finalMessage.usage,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};
