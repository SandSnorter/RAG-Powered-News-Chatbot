import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
    sources: [String],
    timestamp: { type: Date, default: Date.now }
});

export const Chat = mongoose.model('Chat', chatSchema);