import { Request, Response, Router } from "express";
import { getAuth } from "@clerk/express";
import { Chat } from "../models/Chat";
import redisClient from "../lib/redis.client";

const router = Router();

/**
 * GET /api/chats/sessions
 * Returns a list of distinct chat sessions for the current user,
 * with the first user message as a preview.
 */
router.get("/sessions", async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthenticated." });

        // Aggregate: get the earliest user message per session
        const sessions = await Chat.aggregate([
            { $match: { userId, role: "user" } },
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$sessionId",
                    preview: { $first: "$content" },
                    timestamp: { $last: "$createdAt" },
                },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 50 },
        ]);

        const result = sessions.map((s) => ({
            sessionId: s._id,
            preview: s.preview.length > 60 ? s.preview.slice(0, 60) + "…" : s.preview,
            timestamp: s.timestamp,
        }));

        return res.json({ sessions: result });
    } catch (err) {
        console.error("[Chats] sessions error:", err);
        return res.status(500).json({ error: "Failed to fetch sessions." });
    }
});

/**
 * GET /api/chats/sessions/:sessionId
 * Returns all messages for a specific session.
 */
router.get("/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthenticated." });

        const sessionId = req.params.sessionId as string;
        const messages = await Chat.find({ userId, sessionId })
            .sort({ createdAt: 1, _id: 1 })
            .limit(100)
            .lean();

        return res.json({ messages });
    } catch (err) {
        console.error("[Chats] session messages error:", err);
        return res.status(500).json({ error: "Failed to fetch session messages." });
    }
});

/**
 * DELETE /api/chats/clear
 * Deletes all chat history for the current user (MongoDB + Redis context).
 */
router.delete("/clear", async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthenticated." });

        await Promise.all([
            Chat.deleteMany({ userId }),
            redisClient.del(`context:${userId}`),
        ]);

        return res.json({ success: true });
    } catch (err) {
        console.error("[Chats] clear error:", err);
        return res.status(500).json({ error: "Failed to clear history." });
    }
});

export default router;
