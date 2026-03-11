import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Look for "Authorization: Bearer <TOKEN>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token) {
        return res.status(401).json({ error:"Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string};
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token." });
    }
};