import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Type for Clerk webhook events
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
    // OAuth-specific fields for extracting Google profile data
    external_accounts?: Array<{
      provider: string;
      first_name?: string;
      last_name?: string;
      picture?: string;
      email_address?: string;
    }>;
    // For session.created events
    user_id?: string;
  };
};

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await request.text();
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url, external_accounts } =
        evt.data;
      const email = email_addresses?.[0]?.email_address ?? "";

      // Extract Google OAuth profile data if available (prioritize OAuth data)
      const googleAccount = external_accounts?.find(
        (account) => account.provider === "google" || account.provider === "oauth_google"
      );

      const firstName = googleAccount?.first_name ?? first_name;
      const lastName = googleAccount?.last_name ?? last_name;
      const imageUrl = googleAccount?.picture ?? image_url;

      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: id,
        email,
        firstName,
        lastName,
        imageUrl,
      });
    }

    if (eventType === "user.deleted") {
      await ctx.runMutation(internal.users.deleteUserByClerkId, {
        clerkId: evt.data.id,
      });
    }

    // Track login events for analytics
    if (eventType === "session.created") {
      const userId = evt.data.user_id;
      if (userId) {
        await ctx.runMutation(internal.users.trackLogin, {
          clerkId: userId,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
