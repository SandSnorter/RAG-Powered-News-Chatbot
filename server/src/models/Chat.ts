import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId:    { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    role:      { type: String, enum: ["user", "bot"], required: true },
    content:   { type: String, required: true },
    sources:   [String],
}, { timestamps: true });

// Compound index for efficient per-user, per-session queries
chatSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

export const Chat = mongoose.model("Chat", chatSchema);
