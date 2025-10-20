# Stripe Setup Guide for StaticPress

This guide will help you set up Stripe for handling subscriptions in StaticPress.

## Prerequisites

- Stripe account (https://stripe.com)
- Access to Stripe Dashboard
- StaticPress repository with Phase 2 code

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your keys (you'll need both test and live keys):
   - **Test Publishable Key** (starts with `pk_test_`)
   - **Test Secret Key** (starts with `sk_test_`)
   - **Live Publishable Key** (starts with `pk_live_`)
   - **Live Secret Key** (starts with `sk_live_`)

## Step 2: Create Products and Prices

### Personal Tier ($2.50/mo or $20/yr)

1. Go to https://dashboard.stripe.com/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name:** StaticPress Personal
   - **Description:** Individual bloggers who need images
   - **Pricing model:** Standard pricing
4. Add two prices:
   - **Monthly:** $2.50 USD, Recurring, Monthly
   - **Yearly:** $20 USD, Recurring, Yearly (17% savings)
5. Copy the Price IDs (e.g., `price_1Abc123...`)

### SMB Tier ($5/mo or $50/yr)

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** StaticPress SMB
   - **Description:** Small businesses needing custom domains and themes
   - **Pricing model:** Standard pricing
3. Add two prices:
   - **Monthly:** $5 USD, Recurring, Monthly
   - **Yearly:** $50 USD, Recurring, Yearly (17% savings)
4. Copy the Price IDs

### Pro Tier ($10/mo or $100/yr)

1. Click **"+ Add product"**
2. Fill in:
   - **Name:** StaticPress Pro
   - **Description:** Agencies managing multiple sites
   - **Pricing model:** Standard pricing
3. Add two prices:
   - **Monthly:** $10 USD, Recurring, Monthly
   - **Yearly:** $100 USD, Recurring, Yearly (17% savings)
4. Copy the Price IDs

## Step 3: Set Up Environment Variables

Update your `.env.local` file:

```bash
# Stripe API Keys (use test keys for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Stripe Price IDs (from Step 2)
STRIPE_PERSONAL_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PERSONAL_YEARLY_PRICE_ID=price_xxxxx
STRIPE_SMB_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_SMB_YEARLY_PRICE_ID=price_xxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
```

## Step 4: Set Up Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. For **Endpoint URL**, enter:
   - **Development:** Use Stripe CLI (see below)
   - **Production:** `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Step 5: Test Webhooks Locally (Development)

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

### Forward Webhooks to Local Server

```bash
# Login to Stripe
stripe login

# Start your Next.js server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret it gives you and add to .env.local
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Test a Payment

```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

## Step 6: Test Subscription Flow

1. Start your development server: `npm run dev`
2. Go to http://localhost:3000/pricing
3. Click **"Upgrade to Personal"**
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete checkout
6. Verify in Stripe Dashboard: https://dashboard.stripe.com/test/payments
7. Check that webhook updated user tier in Supabase

## Step 7: Configure Customer Portal

The Customer Portal allows users to manage their subscriptions.

1. Go to https://dashboard.stripe.com/settings/billing/portal
2. Enable **"Customer portal"**
3. Configure settings:
   - Allow customers to **cancel subscriptions**
   - Allow customers to **update payment methods**
   - Allow customers to **view invoices**
4. Save settings

## Step 8: Production Deployment

### Before Going Live

1. Replace test keys with live keys in production environment variables
2. Create products and prices in **Live mode** (toggle at top of Stripe Dashboard)
3. Set up webhook endpoint with your production URL
4. Test with real credit card (small amount, then refund)
5. Verify webhooks are working in production

### Security Checklist

- ✅ Webhook signature verification enabled
- ✅ Secret keys never exposed client-side
- ✅ HTTPS enabled on production domain
- ✅ Environment variables properly configured
- ✅ Stripe API version pinned in code

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe Dashboard > Webhooks > Recent deliveries
2. Verify endpoint URL is correct
3. Check webhook signing secret matches `.env.local`
4. Ensure development server is running

### Subscription Not Updating User Tier

1. Check webhook logs in terminal
2. Verify `user_id` is in subscription metadata
3. Check Supabase logs for database errors
4. Verify price IDs match between Stripe and `.env.local`

### Test Card Declined

- Use Stripe test cards: https://stripe.com/docs/testing
- `4242 4242 4242 4242` - Success
- `4000 0000 0000 0002` - Decline

## Monitoring

### Stripe Dashboard

- Monitor payments: https://dashboard.stripe.com/payments
- View subscriptions: https://dashboard.stripe.com/subscriptions
- Check webhooks: https://dashboard.stripe.com/webhooks

### Important Metrics

- Successful subscription rate
- Failed payment rate
- Churn rate
- Average revenue per user (ARPU)

## Resources

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Stripe Customer Portal: https://stripe.com/docs/billing/subscriptions/customer-portal

---

**Last Updated:** 2025-10-20
**Status:** Phase 2 - Stripe Integration Complete
