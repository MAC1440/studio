
'use server';

import { type OrganizationPlan } from './types';

// --- Configuration ---
// Note: These would be stored in environment variables in a real application.
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE; // Optional, for security

const PLAN_PRICES: Record<OrganizationPlan, { paddleId: string; payfastAmount: number }> = {
    free: { paddleId: 'price_free', payfastAmount: 0 },
    startup: { paddleId: 'price_startup_monthly', payfastAmount: 20 },
    pro: { paddleId: 'price_pro_monthly', payfastAmount: 50 },
};

// --- Helper Functions ---

async function getUserCountry(): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/location`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to fetch location');
    const data = await response.json();
    return data.country || 'unknown';
  } catch (error) {
    console.error("Location detection failed:", error);
    return 'unknown';
  }
}

function createPaddleCheckoutLink(planId: 'startup' | 'pro', email: string, userId: string, organizationId: string): string | null {
  if (!PADDLE_VENDOR_ID || !PADDLE_API_KEY) {
    console.warn("Paddle environment variables are not set. Cannot create checkout link.");
    return null;
  }
  const planPaddleId = PLAN_PRICES[planId].paddleId;
  // This is a simplified passthrough URL. A real implementation would use Paddle.js
  // or the Pay Links API to create a more secure and robust checkout session.
  const paddleUrl = new URL(`https://sandbox-vendors.paddle.com/api/2.0/product/generate_pay_link`);
  paddleUrl.searchParams.set('vendor_id', PADDLE_VENDOR_ID);
  paddleUrl.searchParams.set('vendor_auth_code', PADDLE_API_KEY);
  paddleUrl.searchParams.set('product_id', planPaddleId); // Using a placeholder, in reality you'd have product IDs for each plan
  paddleUrl.searchParams.set('customer_email', email);
  paddleUrl.searchParams.set('passthrough', JSON.stringify({ userId, organizationId, planId }));
  paddleUrl.searchParams.set('return_url', `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?status=success`);

  // In a real scenario, you'd POST this to Paddle's API and get a checkout URL back.
  // We're simulating this by returning a constructed URL.
  // For now, let's just return a placeholder that shows the intent.
  return `https://checkout.paddle.com/subscribe/product/${planPaddleId}?customer_email=${encodeURIComponent(email)}&passthrough=${encodeURIComponent(JSON.stringify({ userId, organizationId, planId }))}`;
}

function createPayFastCheckoutLink(planId: 'startup' | 'pro', email: string, userId: string, organizationId: string): string | null {
   if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    console.warn("PayFast environment variables are not set. Cannot create checkout link.");
    return null;
  }
  const amount = PLAN_PRICES[planId].payfastAmount;
  const itemName = `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`;

  // PayFast requires a specific set of data to be posted to their endpoint.
  // We'll construct the URL for a GET request for simplicity, but a POST form is standard.
  const payfastUrl = new URL("https://sandbox.payfast.co.za/eng/process");
  payfastUrl.searchParams.set('merchant_id', PAYFAST_MERCHANT_ID);
  payfastUrl.searchParams.set('merchant_key', PAYFAST_MERCHANT_KEY);
  payfastUrl.searchParams.set('return_url', `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?status=success`);
  payfastUrl.searchParams.set('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?status=cancelled`);
  payfastUrl.searchParams.set('notify_url', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payfast`);
  
  payfastUrl.searchParams.set('email_address', email);
  payfastUrl.searchParams.set('m_payment_id', `${organizationId}_${planId}_${Date.now()}`);

  payfastUrl.searchParams.set('amount', amount.toFixed(2));
  payfastUrl.searchParams.set('item_name', itemName);
  payfastUrl.searchParams.set('item_description', `Subscription to BoardR's ${itemName}`);
  
  // Custom fields for reconciliation via webhook
  payfastUrl.searchParams.set('custom_str1', userId);
  payfastUrl.searchParams.set('custom_str2', organizationId);
  payfastUrl.searchParams.set('custom_str3', planId);
  
  // In a real app, you would generate a signature hash here for security
  // const signature = generatePayFastSignature(...);
  // payfastUrl.searchParams.set('signature', signature);

  return payfastUrl.toString();
}


// --- Main Exported Function ---
type GenerateCheckoutArgs = {
    planId: 'startup' | 'pro';
    userId: string;
    email: string;
    organizationId: string;
}

export async function generateCheckoutLink(args: GenerateCheckoutArgs): Promise<string | null> {
    const { planId, email, userId, organizationId } = args;

    const country = await getUserCountry();
    console.log(`User country detected: ${country}`);

    if (country === 'PK') {
        console.log("Using PayFast for local payment.");
        return createPayFastCheckoutLink(planId, email, userId, organizationId);
    } else {
        console.log("Using Paddle for international payment.");
        return createPaddleCheckoutLink(planId, email, userId, organizationId);
    }
}
