import "dotenv/config"; // To ensure env vars load before other imports
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { webhookHandler } from "./routes/webhook.route";
import { handleChat } from "./services/chat.service";
import chatsRouter from "./routes/chats.route";
import redisClient from "./lib/redis.client"; // Singleton — no second connection created

const app = express();

app.set('trust proxy', 1);

const port = process.env.PORT || 3001;

// --- 1. Database & Cache Connections ---

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/news_chatbot";

mongoose.connection.on("connected", () => console.log("🟢 MongoDB: Connected successfully"));
mongoose.connection.on("error", (err) => console.error("🔴 MongoDB: Connection error:", err));
mongoose.connection.on("disconnected", () => console.warn("🟡 MongoDB: Disconnected"));

mongoose.connect(MONGO_URI).catch((err) => {
    console.error("MongoDB connection fatal error:", err);
    process.exit(1); // Exit process if the primary DB fails to connect
});

// --- 2. Middleware & Webhooks ---

// Security headers
app.use(helmet());

// In dev: allow any localhost port (Vite can bump ports).
// In prod: lock to ALLOWED_ORIGIN env var.
const isDev = process.env.NODE_ENV !== "production";
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow server-to-server / curl
        if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        if (origin === process.env.ALLOWED_ORIGIN) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// Webhook must receive raw body — register before express.json()
app.post(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    webhookHandler
);

// Standard Middlewares
app.use(express.json());
app.use(clerkMiddleware());

// Rate limiter: 20 chat requests per minute per IP
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- 3. Routes ---

app.post("/api/chat", chatLimiter, requireAuth(), handleChat);
app.use("/api/chats", requireAuth(), chatsRouter);

// Health Check
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        redis: redisClient.isOpen ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString(),
    });
});

// --- 4. Server Initialization ---

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
