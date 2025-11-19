#!/usr/bin/env tsx

/**
 * Script to merge duplicate user records into one with the correct GitHub ID
 * Usage: npx tsx scripts/merge-duplicate-users.ts <email> <github-numeric-id>
 */

import { getSupabaseClient } from '../lib/db'

async function mergeDuplicateUsers(email: string, correctGithubId: string) {
  console.log(`\n🔍 Merging duplicate users for: ${email}`)
  console.log(`   Using GitHub ID: ${correctGithubId}\n`)

  try {
    const supabase = await getSupabaseClient()

    // Find all users with this email
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .order('id', { ascending: true })

    if (fetchError || !users || users.length === 0) {
      console.error('❌ No users found with that email')
      process.exit(1)
    }

    console.log(`Found ${users.length} user record(s)\n`)

    // Find the user with 'personal' tier and Stripe info (the correct one)
    const primaryUser = users.find(u => u.subscription_tier === 'personal' && u.stripe_customer_id)

    if (!primaryUser) {
      console.error('❌ Could not find primary user record with personal tier')
      process.exit(1)
    }

    console.log(`Primary user record: ID ${primaryUser.id}`)
    console.log(`   Old GitHub ID: ${primaryUser.github_id}`)
    console.log(`   Tier: ${primaryUser.subscription_tier}`)
    console.log(`   Stripe Customer: ${primaryUser.stripe_customer_id}\n`)

    // Update primary user with correct GitHub ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        github_id: correctGithubId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', primaryUser.id)

    if (updateError) {
      console.error('❌ Failed to update primary user:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Updated primary user with correct GitHub ID\n')

    // Find repository for primary user
    const { data: primaryRepo } = await supabase
      .from('user_repositories')
      .select('*')
      .eq('user_id', primaryUser.id)
      .single()

    // Delete all other duplicate users
    const duplicateIds = users
      .filter(u => u.id !== primaryUser.id)
      .map(u => u.id)

    if (duplicateIds.length > 0) {
      console.log(`Deleting ${duplicateIds.length} duplicate user record(s)...`)

      // If duplicates have repositories, migrate them first
      for (const duplicateId of duplicateIds) {
        const { data: duplicateRepo } = await supabase
          .from('user_repositories')
          .select('*')
          .eq('user_id', duplicateId)
          .single()

        if (duplicateRepo && !primaryRepo) {
          // Migrate repository to primary user
          await supabase
            .from('user_repositories')
            .update({ user_id: primaryUser.id })
            .eq('user_id', duplicateId)

          console.log(`   Migrated repository from user ${duplicateId}`)
        } else if (duplicateRepo) {
          // Delete duplicate repo
          await supabase
            .from('user_repositories')
            .delete()
            .eq('user_id', duplicateId)
        }
      }

      // Delete duplicate users
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('id', duplicateIds)

      if (deleteError) {
        console.error('❌ Failed to delete duplicates:', deleteError.message)
        process.exit(1)
      }

      console.log(`✅ Deleted ${duplicateIds.length} duplicate user(s)\n`)
    }

    console.log('🎉 Successfully merged duplicate users!')
    console.log('\n📊 Final user record:')
    console.log(`   User ID: ${primaryUser.id}`)
    console.log(`   GitHub ID: ${correctGithubId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Tier: ${primaryUser.subscription_tier}`)
    console.log(`   Status: ${primaryUser.subscription_status}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Get arguments
const email = process.argv[2]
const githubId = process.argv[3]

if (!email || !githubId) {
  console.error('Usage: npx tsx scripts/merge-duplicate-users.ts <email> <github-numeric-id>')
  console.error('\nTo find your GitHub ID, go to: https://api.github.com/users/YOUR_GITHUB_USERNAME')
  process.exit(1)
}

mergeDuplicateUsers(email, githubId)
