#!/usr/bin/env tsx

/**
 * Script to manually fix subscription status in database
 * Usage: npx tsx scripts/fix-subscription.ts <user-email>
 */

import { stripe } from "../lib/stripe";
import { getSupabaseClient } from "../lib/db";

async function fixSubscription(userEmail: string) {
  console.log(`\n🔍 Looking up Stripe customer for email: ${userEmail}`);

  try {
    // Get Stripe client
    const stripeClient = stripe();

    // Find customer by email
    const customers = await stripeClient.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      console.error("❌ No Stripe customer found with that email");
      process.exit(1);
    }

    const customer = customers.data[0];
    console.log(`✅ Found Stripe customer: ${customer.id}`);

    // Get active subscriptions for this customer
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.error("❌ No active subscriptions found for this customer");
      console.log(
        "   You may need to check Stripe dashboard for subscription status",
      );
      process.exit(1);
    }

    const subscription = subscriptions.data[0];
    console.log(`✅ Found active subscription: ${subscription.id}`);

    // Get tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    console.log(`   Price ID: ${priceId}`);

    // Determine tier based on price ID
    let tier: "personal" | "smb" | "pro" = "personal";
    if (priceId?.includes("personal")) tier = "personal";
    else if (priceId?.includes("smb")) tier = "smb";
    else if (priceId?.includes("pro")) tier = "pro";

    console.log(`   Tier: ${tier}`);
    console.log(`   Status: ${subscription.status}`);

    // Get user ID from subscription metadata or find by email
    let userId = subscription.metadata?.user_id;

    if (!userId) {
      console.log("\n🔍 Looking up user in database by email...");
      const supabase = await getSupabaseClient();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, github_id")
        .eq("email", userEmail)
        .single();

      if (userError || !user) {
        console.error(
          "❌ Could not find user in database with email:",
          userEmail,
        );
        console.error("   Error:", userError?.message);
        process.exit(1);
      }

      userId = user.id.toString();
      console.log(`✅ Found user in database: ID ${userId}`);
    }

    // Update user subscription in database
    console.log("\n📝 Updating subscription in database...");
    const supabase = await getSupabaseClient();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        subscription_tier: tier,
        subscription_status: "active",
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(userId));

    if (updateError) {
      console.error("❌ Failed to update database:", updateError.message);
      process.exit(1);
    }

    console.log("✅ Successfully updated subscription in database!");
    console.log("\n📊 Summary:");
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Tier: ${tier}`);
    console.log(`   Status: active`);
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log("\n🎉 All done! Your subscription is now active.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Get email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Usage: npx tsx scripts/fix-subscription.ts <user-email>");
  process.exit(1);
}

fixSubscription(userEmail);
