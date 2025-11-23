import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

/**
 * Vercel Webhook Handler
 *
 * Receives events from Vercel for deployment status updates.
 *
 * Events handled:
 * - deployment.created: New deployment started
 * - deployment.succeeded: Deployment completed successfully
 * - deployment.failed: Deployment failed
 * - deployment.canceled: Deployment was canceled
 * - project.created: New project was created
 * - project.removed: Project was deleted
 */

// Vercel webhook event types
interface VercelWebhookPayload {
  id: string
  type: string
  createdAt: number
  payload: {
    // Deployment events
    deployment?: {
      id: string
      name: string
      url: string
      inspectorUrl: string
      meta?: {
        githubCommitSha?: string
        githubCommitMessage?: string
        githubCommitAuthorName?: string
      }
      target?: string // 'production' or 'preview'
      createdAt: number
      buildingAt?: number
      ready?: number
      state?: string
    }
    // Project events
    project?: {
      id: string
      name: string
      accountId: string
      createdAt: number
      framework?: string
      gitRepository?: {
        type: string
        repo: string
      }
    }
    // Common fields
    team?: {
      id: string
      name: string
    }
    user?: {
      id: string
      username: string
    }
  }
}

/**
 * Verify Vercel webhook signature
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.error('VERCEL_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  // Get raw body for signature verification
  const rawBody = await request.text()

  // Verify signature
  const signature = request.headers.get('x-vercel-signature')
  if (!verifySignature(rawBody, signature, webhookSecret)) {
    logger.warn('Invalid Vercel webhook signature', {
      signature: signature?.substring(0, 10) + '...',
    })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Parse payload
  let event: VercelWebhookPayload
  try {
    event = JSON.parse(rawBody)
  } catch {
    logger.error('Failed to parse Vercel webhook payload')
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const eventType = request.headers.get('x-vercel-event') || event.type

  logger.info('Vercel webhook received', {
    eventType,
    eventId: event.id,
  })

  try {
    // Dynamic import to prevent build-time initialization
    const { getSupabaseClient } = await import('@/lib/db')

    switch (eventType) {
      case 'deployment.created':
      case 'deployment': {
        // A new deployment has started
        const deployment = event.payload.deployment
        if (!deployment) break

        const supabase = await getSupabaseClient()

        // Find the project in our database by Vercel project name
        const { data: project } = await supabase
          .from('deployment_projects')
          .select('id')
          .eq('platform', 'vercel')
          .eq('project_name', deployment.name)
          .single()

        if (project) {
          // Record deployment in history
          await supabase.from('deployment_history').insert({
            project_id: project.id,
            deployment_id: deployment.id,
            status: 'building',
            deployment_url: `https://${deployment.url}`,
            preview_url: deployment.target !== 'production'
              ? `https://${deployment.url}`
              : undefined,
            commit_sha: deployment.meta?.githubCommitSha,
            commit_message: deployment.meta?.githubCommitMessage,
            triggered_by: 'webhook',
            started_at: new Date(deployment.createdAt).toISOString(),
          })

          logger.info('Deployment started', {
            projectId: project.id,
            deploymentId: deployment.id,
          })
        }
        break
      }

      case 'deployment.succeeded':
      case 'deployment.ready': {
        // Deployment completed successfully
        const deployment = event.payload.deployment
        if (!deployment) break

        const supabase = await getSupabaseClient()

        // Update deployment status
        const { error } = await supabase
          .from('deployment_history')
          .update({
            status: 'success',
            deployment_url: `https://${deployment.url}`,
            completed_at: deployment.ready
              ? new Date(deployment.ready).toISOString()
              : new Date().toISOString(),
          })
          .eq('deployment_id', deployment.id)

        if (error) {
          logger.error('Failed to update deployment status', {
            deploymentId: deployment.id,
            error: error.message,
          })
        } else {
          logger.info('Deployment succeeded', {
            deploymentId: deployment.id,
            url: deployment.url,
          })
        }
        break
      }

      case 'deployment.error':
      case 'deployment.failed': {
        // Deployment failed
        const deployment = event.payload.deployment
        if (!deployment) break

        const supabase = await getSupabaseClient()

        await supabase
          .from('deployment_history')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Deployment failed - check Vercel dashboard for details',
          })
          .eq('deployment_id', deployment.id)

        logger.warn('Deployment failed', {
          deploymentId: deployment.id,
        })
        break
      }

      case 'deployment.canceled': {
        // Deployment was canceled
        const deployment = event.payload.deployment
        if (!deployment) break

        const supabase = await getSupabaseClient()

        await supabase
          .from('deployment_history')
          .update({
            status: 'cancelled',
            completed_at: new Date().toISOString(),
          })
          .eq('deployment_id', deployment.id)

        logger.info('Deployment cancelled', {
          deploymentId: deployment.id,
        })
        break
      }

      case 'project.created': {
        // New project was created via Vercel dashboard
        // This could be used to sync projects created outside StaticPress
        const project = event.payload.project
        if (project) {
          logger.info('Vercel project created', {
            projectId: project.id,
            projectName: project.name,
          })
        }
        break
      }

      case 'project.removed': {
        // Project was deleted
        const project = event.payload.project
        if (!project) break

        const supabase = await getSupabaseClient()

        // Mark our record as inactive
        await supabase
          .from('deployment_projects')
          .update({ is_active: false })
          .eq('platform', 'vercel')
          .eq('project_id', project.id)

        logger.info('Vercel project removed', {
          projectId: project.id,
          projectName: project.name,
        })
        break
      }

      default:
        // Log unknown events for future implementation
        logger.debug('Unhandled Vercel webhook event', {
          eventType,
          eventId: event.id,
        })
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Vercel webhook handler error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType,
    })

    // Still return 200 to prevent retries for internal errors
    // Vercel will retry on non-2xx responses
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

// Vercel webhooks only use POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
