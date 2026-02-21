import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleChat } from './services/chat.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', handleChat);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});