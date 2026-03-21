import { createClient } from "redis";

// Singleton Redis client — import this everywhere instead of creating new clients.
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("connect", () => console.log("[Redis] TCP connection established"));
redisClient.on("ready", () => console.log("[Redis] Ready to process commands"));
redisClient.on("error", (err: Error) => console.error("[Redis] Client Error:", err.message));
redisClient.on("end", () => console.warn("[Redis] Connection closed"));

redisClient.connect().catch((err: Error) => {
    console.error("[Redis] Fatal connection error:", err.message);
});

export default redisClient;
