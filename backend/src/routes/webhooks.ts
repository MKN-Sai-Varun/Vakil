import { Router, raw } from 'express';
import crypto from 'crypto';
import { markDealSettled } from '../db/deals';
import { logAuditEvent } from '../db/audit';

export const webhooksRouter = Router();

const processedEventIds = new Set<string>(); // simple in-memory dedupe for the demo; swap for a DB table if persistence across restarts matters

webhooksRouter.post(
  '/razorpay',
  raw({ type: 'application/json' }), // critical: raw body, NOT express.json() — needed for signature verification
  async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const eventId = req.headers['x-razorpay-event-id'] as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET as string;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body) // req.body is the raw Buffer here, thanks to express.raw()
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'invalid signature' });
    }

    // Dedupe: Razorpay delivers at-least-once, same event can arrive more than once
    if (eventId && processedEventIds.has(eventId)) {
      return res.status(200).json({ status: 'already processed' });
    }
    if (eventId) processedEventIds.add(eventId);

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
      if (orderId) {
        const deal = await markDealSettled(orderId);
        if (deal) {
          await logAuditEvent(deal.id, 'webhook_confirmed', { event, razorpay_order_id: orderId });
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  }
);