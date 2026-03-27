# Pro GM Subscription — Setup Guide
**Status:** UI stub live in Hub > Pro GM tab. Stripe integration pending.

## Overview
Pro GM is a $4.99/month subscription tier that enables:
- Custom team themes
- Unlimited save slots (currently capped at 3)
- Pro analytics dashboard (EPA, DVOA-style)
- Exclusive achievements
- Early access to new features
- Claude AI Storylines (full narrative engine)
- Cloud Sync (ships with multiplayer)

## Implementation Steps

### 1. Stripe Setup
```bash
# Install Stripe SDK
npm install @stripe/stripe-js

# Add to .env.local
VITE_STRIPE_KEY=pk_live_xxx       # Stripe publishable key
VITE_STRIPE_PRICE_ID=price_xxx    # Monthly price ID ($4.99/mo)
```

### 2. Checkout Flow
Replace the stub button in `App.jsx` Hub > Pro tab with:
```js
import { loadStripe } from '@stripe/stripe-js';

const handleSubscribe = async () => {
  const stripe = await loadStripe(import.meta.env.VITE_STRIPE_KEY);
  await stripe.redirectToCheckout({
    lineItems: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/gridiron-gm/?pro=success`,
    cancelUrl: `${window.location.origin}/gridiron-gm/`,
    customerEmail: undefined, // optional: pre-fill
  });
};
```

### 3. Webhook Handler (Cloudflare Worker or Vercel Edge)
```js
// POST /api/stripe-webhook
export default {
  async fetch(request) {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');
    // Verify webhook signature
    // On checkout.session.completed: store pro status in KV or D1
    // Return user a signed JWT or session token
  }
};
```

### 4. Pro Status Detection in App
```js
const isPro = localStorage.getItem('gm_pro_token') === 'valid';
// OR: check JWT from auth flow
```

### 5. Gate Pro Features
```js
// Example: unlock extra save slots
const maxSlots = isPro ? 10 : 3;

// Example: unlock custom themes
const themes = isPro ? ALL_THEMES : DEFAULT_THEMES;
```

## Revenue Estimate
- 1% of 1,000 MAU = 10 subscribers × $4.99 = $49.90/mo
- 1% of 10,000 MAU = 100 subscribers × $4.99 = $499/mo
- 1% of 100,000 MAU = 1,000 subscribers × $4.99 = $4,990/mo

## Priority
Ship after: Analytics endpoint, Mobile responsive, Stats Hub (already done in v31).
