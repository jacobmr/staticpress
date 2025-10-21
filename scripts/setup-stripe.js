#!/usr/bin/env node

/**
 * Stripe Setup Script for StaticPress
 *
 * This script will:
 * 1. Create products and prices in Stripe
 * 2. Set up webhook endpoints
 * 3. Output configuration for .env.local
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
  {
    name: 'StaticPress Personal',
    tier: 'personal',
    description: 'Edit all posts, upload images, 1 repository',
    prices: [
      { amount: 250, interval: 'month', nickname: 'Personal Monthly' },
      { amount: 2000, interval: 'year', nickname: 'Personal Yearly' }
    ]
  },
  {
    name: 'StaticPress SMB',
    tier: 'smb',
    description: 'Personal features + custom domains + theme gallery, 1 repository',
    prices: [
      { amount: 500, interval: 'month', nickname: 'SMB Monthly' },
      { amount: 5000, interval: 'year', nickname: 'SMB Yearly' }
    ]
  },
  {
    name: 'StaticPress Pro',
    tier: 'pro',
    description: 'SMB features + up to 5 repositories',
    prices: [
      { amount: 1000, interval: 'month', nickname: 'Pro Monthly' },
      { amount: 10000, interval: 'year', nickname: 'Pro Yearly' }
    ]
  }
];

async function setupStripe() {
  console.log('🚀 Setting up Stripe for StaticPress...\n');

  const priceIds = {};

  // Create products and prices
  for (const productData of PRODUCTS) {
    console.log(`📦 Creating product: ${productData.name}`);

    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: {
        tier: productData.tier
      }
    });

    console.log(`   ✓ Product created: ${product.id}`);

    for (const priceData of productData.prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.amount,
        currency: 'usd',
        recurring: {
          interval: priceData.interval
        },
        nickname: priceData.nickname,
        metadata: {
          tier: productData.tier
        }
      });

      const key = `${productData.tier}_${priceData.interval}`;
      priceIds[key] = price.id;

      console.log(`   ✓ Price created: ${priceData.nickname} - ${price.id}`);
    }

    console.log('');
  }

  // Output configuration
  console.log('\n✅ Setup complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Add these to your .env.local file:\n');
  console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}`);
  console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # Get from Stripe Dashboard`);
  console.log('');
  console.log(`STRIPE_PRICE_PERSONAL_MONTHLY=${priceIds.personal_month}`);
  console.log(`STRIPE_PRICE_PERSONAL_YEARLY=${priceIds.personal_year}`);
  console.log(`STRIPE_PRICE_SMB_MONTHLY=${priceIds.smb_month}`);
  console.log(`STRIPE_PRICE_SMB_YEARLY=${priceIds.smb_year}`);
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${priceIds.pro_month}`);
  console.log(`STRIPE_PRICE_PRO_YEARLY=${priceIds.pro_year}`);
  console.log('');
  console.log(`STRIPE_WEBHOOK_SECRET=whsec_... # Set this up next`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Next steps:');
  console.log('1. Add the above environment variables to .env.local');
  console.log('2. Get your publishable key from: https://dashboard.stripe.com/apikeys');
  console.log('3. Set up webhook endpoint (see below)\n');

  console.log('🔗 Webhook Setup:');
  console.log('1. Go to: https://dashboard.stripe.com/webhooks');
  console.log('2. Click "Add endpoint"');
  console.log('3. Endpoint URL: https://YOUR_DOMAIN/api/stripe/webhook');
  console.log('   (For local testing: Use Stripe CLI or ngrok)');
  console.log('4. Select events:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('5. Copy the webhook signing secret (whsec_...) to .env.local\n');

  console.log('💡 For local testing with Stripe CLI:');
  console.log('   stripe listen --forward-to localhost:3000/api/stripe/webhook');
  console.log('   This will give you a webhook secret starting with whsec_\n');

  // Save price IDs to a file for easy reference
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/jmr/dev/staticpress/stripe-config.json',
    JSON.stringify(priceIds, null, 2)
  );
  console.log('💾 Price IDs saved to: stripe-config.json\n');
}

setupStripe().catch(error => {
  console.error('❌ Error setting up Stripe:', error.message);
  process.exit(1);
});
