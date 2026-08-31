import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

const orderId = process.argv[2];
if (!orderId) {
  console.error('Usage: ts-node scripts/test-webhook.ts <razorpay_order_id>');
  process.exit(1);
}

const payload = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        order_id: orderId,
      },
    },
  },
});

const secret = process.env.RAZORPAY_WEBHOOK_SECRET as string;
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);
console.log('\nRun this curl command:');
console.log(`curl -X POST https://vakil-v2w7.onrender.com/webhooks/razorpay \\
  -H "Content-Type: application/json" \\
  -H "x-razorpay-signature: ${signature}" \\
  -d '${payload}'`);