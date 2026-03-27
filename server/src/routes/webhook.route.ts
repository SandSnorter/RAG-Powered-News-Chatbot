import { Webhook } from "svix";
import { User } from "../models/User";

import { Request, Response } from "express";

export const webhookHandler = async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
        console.error("Error: CLERK_WEBHOOK_SECRET is missing in environment variables.");
        return res.status(500).json({ error: "Internal server error" });
    }

    const payload = req.body;

    // 1. Ensure payload is raw (Buffer or string) for Svix verification
    if (typeof payload !== "string" && !Buffer.isBuffer(payload)) {
        console.error("Error: Payload is an object. Ensure express.raw() is configured before this route.");
        return res.status(400).json({ error: "Invalid payload format" });
    }

    try {
        const payloadString = payload.toString("utf8");
        const wh = new Webhook(WEBHOOK_SECRET);
        
        // 2. Verify the webhook signature
        // Note: Casting headers is required because Svix expects a specific Record<string, string> format
        const evt = wh.verify(payloadString, req.headers as Record<string, string>) as any;

        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        // 3. Process the event based on its type
        switch (evt.type) {
            case "user.created":
            case "user.updated": {
                const email = email_addresses?.[0]?.email_address;

                // Upsert by clerkId (stable identifier) — updates name, photo, email
                await User.findOneAndUpdate(
                    { clerkId: id },
                    {
                        email,
                        firstName: first_name,
                        lastName: last_name,
                        photoUrl: image_url
                    },
                    { upsert: true, returnDocument: 'after' }
                );
                console.log(`[Webhook] ${evt.type}: ${email} (${id})`);
                break;
            }
            case "user.deleted": {
                await User.findOneAndDelete({ clerkId: id });
                break;
            }
            default:
                // Silently ignore unhandled webhook events
                break;
        }
        
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Webhook processing failed:", error instanceof Error ? error.message : error);
        return res.status(400).json({ error: "Webhook verification/processing error" });
    }
};
