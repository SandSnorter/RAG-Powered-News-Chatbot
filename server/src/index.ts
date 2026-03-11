import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleChat } from './services/chat.service';
import { authenticateJWT } from './middleware/auth.middleware';
import authRoutes from './routes/auth.route';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 1. Middlewares
app.use(cors());
app.use(express.json());

// 2. MongoDB Connection Logic
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/news_chatbot";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (Requires Login)
app.post('/api/chat', authenticateJWT, handleChat);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});