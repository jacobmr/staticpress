#!/usr/bin/env tsx

/**
 * Fix all duplicate user records - set them all to Personal tier
 */

import { getSupabaseClient } from '../lib/db'

async function fixAllDuplicates() {
  console.log('\n🔧 Updating all jacob@reider.us user records to Personal tier...\n')

  try {
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: 'personal',
        subscription_status: 'active',
        stripe_customer_id: 'cus_TH7EUZexh1BIQk',
        stripe_subscription_id: 'sub_1SKZ0FFUzHNrbF7Sak9r0LVU',
        updated_at: new Date().toISOString(),
      })
      .eq('email', 'jacob@reider.us')

    if (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }

    console.log('✅ Successfully updated all user records!')
    console.log('\n📊 All jacob@reider.us accounts now have:')
    console.log('   Tier: personal')
    console.log('   Status: active')
    console.log('   Customer ID: cus_TH7EUZexh1BIQk')
    console.log('   Subscription ID: sub_1SKZ0FFUzHNrbF7Sak9r0LVU')
    console.log('\n🔄 Next step: Sign out and sign back in to refresh your session.\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixAllDuplicates()
