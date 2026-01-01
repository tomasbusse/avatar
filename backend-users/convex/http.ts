// Clerk webhook handler for Convex
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { Webhook } from 'svix';

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get headers
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    // Get body
    const body = await request.text();

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        // Sync user to Convex
        await ctx.runMutation(internal.users.upsertUserInternal, {
          clerkId: evt.data.id,
          email: evt.data.email_addresses?.[0]?.email_address || '',
          firstName: evt.data.first_name || undefined,
          lastName: evt.data.last_name || undefined,
          imageUrl: evt.data.image_url || undefined,
        });
        break;

      case 'user.deleted':
        // Delete user from Convex
        await ctx.runMutation(internal.users.deleteUserByClerkId, {
          clerkId: evt.data.id,
        });
        break;

      case 'session.created':
        // Update last login (optional)
        await ctx.runMutation(internal.users.updateLastLogin, {
          clerkId: evt.data.user_id,
        });
        break;
    }

    return new Response('OK', { status: 200 });
  }),
});

export default http;
