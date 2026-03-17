import "dotenv/config"; // To ensure env vars load before other imports
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { createClient } from "redis";
import { webhookHandler } from "./routes/webhook.route";
import { handleChat } from "./services/chat.service";
import { User } from "./models/User";

const app = express();
const port = process.env.PORT || 3001;

// --- 1. Database & Cache Connections ---

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.connect().catch((err) => console.error("[Redis] Connection error:", err));

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

app.use(cors());

app.post(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    webhookHandler
);

// Standard Middlewares
app.use(express.json());
app.use(clerkMiddleware());

// --- 3. Routes ---

app.post("/api/chat", requireAuth(), handleChat);

// Health Check
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        redis: redisClient.isOpen ? "Connected" : "Disconnected",
        timestamp: new Date().toISOString(),
    });
});

// Temporary debug route to check user data
app.get("/api/users", async (req: Request, res: Response) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            count: users.length,
            users: users,
        });
    } catch (error) {
        res.status(500).json({ 
            error: error instanceof Error ? error.message : "Failed to fetch users" 
        });
    }
});

// --- 4. Server Initialization ---

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});