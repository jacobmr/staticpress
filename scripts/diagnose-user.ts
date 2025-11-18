#!/usr/bin/env tsx

/**
 * Diagnostic script to show all users with email jacob@reider.us
 */

import { getSupabaseClient } from '../lib/db'

async function diagnoseUser() {
  console.log('\n🔍 Looking up all users with email jacob@reider.us...\n')

  try {
    const supabase = await getSupabaseClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'jacob@reider.us')
      .order('id', { ascending: true })

    if (error) {
      console.error('❌ Database error:', error.message)
      process.exit(1)
    }

    if (!users || users.length === 0) {
      console.error('❌ No users found')
      process.exit(1)
    }

    console.log(`Found ${users.length} user(s):\n`)

    for (const user of users) {
      console.log('─'.repeat(60))
      console.log(`User ID: ${user.id}`)
      console.log(`GitHub ID: ${user.github_id}`)
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Tier: ${user.subscription_tier}`)
      console.log(`Status: ${user.subscription_status}`)
      console.log(`Stripe Customer: ${user.stripe_customer_id || '(none)'}`)
      console.log(`Stripe Subscription: ${user.stripe_subscription_id || '(none)'}`)
      console.log(`Created: ${user.created_at}`)
      console.log(`Updated: ${user.updated_at}`)

      // Check if this user has a repository configured
      const { data: repos } = await supabase
        .from('user_repositories')
        .select('*')
        .eq('user_id', user.id)

      if (repos && repos.length > 0) {
        console.log(`Repository: ${repos[0].owner}/${repos[0].repo}`)
        console.log(`Content Path: ${repos[0].content_path}`)
      } else {
        console.log('Repository: (none configured)')
      }
    }

    console.log('─'.repeat(60))
    console.log('\n💡 The dashboard uses GitHub ID to identify users.')
    console.log('   Check which GitHub ID is in your session to know which user record is active.\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

diagnoseUser()
