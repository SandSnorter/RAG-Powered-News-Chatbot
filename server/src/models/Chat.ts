import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    role: { type: String, enum: ['user', 'bot'], required: true },
    content: { type: String, required: true },
    sources: [String],
    timestamp: { type: Date, default: Date.now }
});

export const Chat = mongoose.model('Chat', chatSchema);