import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    photoUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);

