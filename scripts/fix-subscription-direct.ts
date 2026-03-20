#!/usr/bin/env tsx

/**
 * Direct subscription fix script using Stripe customer ID
 * Usage: npx tsx scripts/fix-subscription-direct.ts <customer-id>
 */

import { stripe } from "../lib/stripe";
import { getSupabaseClient } from "../lib/db";
import { getTierFromPriceId } from "../lib/stripe";

async function fixSubscriptionDirect(customerId: string) {
  console.log(`\n🔍 Looking up Stripe customer: ${customerId}`);

  try {
    const stripeClient = stripe();

    // Get customer details
    const customer = await stripeClient.customers.retrieve(customerId);

    if (customer.deleted) {
      console.error("❌ Customer has been deleted");
      process.exit(1);
    }

    console.log(`✅ Found customer: ${customer.email}`);

    // Get active subscriptions
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.error("❌ No active subscriptions found");
      process.exit(1);
    }

    const subscription = subscriptions.data[0];
    console.log(`✅ Found active subscription: ${subscription.id}`);

    // Get tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    console.log(`   Price ID: ${priceId}`);

    const tier = getTierFromPriceId(priceId);
    if (!tier) {
      console.error(`❌ Could not determine tier from price ID: ${priceId}`);
      process.exit(1);
    }

    console.log(`   Tier: ${tier}`);

    // Find user by email in database
    console.log(`\n🔍 Looking up user in database by email: ${customer.email}`);
    const supabase = await getSupabaseClient();

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, email, github_id, subscription_tier")
      .eq("email", customer.email);

    if (userError || !users || users.length === 0) {
      console.error("❌ Could not find user in database");
      console.error("   Error:", userError?.message);
      process.exit(1);
    }

    // If multiple users with same email, use the first one (most common case)
    const user = users[0];
    if (users.length > 1) {
      console.log(
        `⚠️  Found ${users.length} users with email ${customer.email}, using first one (ID ${user.id})`,
      );
    }

    console.log(
      `✅ Found user: ID ${user.id}, Current tier: ${user.subscription_tier}`,
    );

    // Update subscription in database
    console.log("\n📝 Updating subscription in database...");

    const { error: updateError } = await supabase
      .from("users")
      .update({
        subscription_tier: tier,
        subscription_status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Failed to update database:", updateError.message);
      process.exit(1);
    }

    console.log("✅ Successfully updated subscription!");
    console.log("\n📊 Summary:");
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Tier: ${tier}`);
    console.log(`   Status: active`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(
      "\n🎉 All done! Your subscription is now active in the database.",
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Get customer ID from command line
const customerId = process.argv[2];

if (!customerId) {
  console.error(
    "Usage: npx tsx scripts/fix-subscription-direct.ts <customer-id>",
  );
  console.error(
    "Example: npx tsx scripts/fix-subscription-direct.ts cus_TH7EUZexh1BIQk",
  );
  process.exit(1);
}

fixSubscriptionDirect(customerId);
