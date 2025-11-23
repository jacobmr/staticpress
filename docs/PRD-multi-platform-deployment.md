# PRD: Multi-Platform Deployment Integration

**Version:** 1.0
**Date:** 2025-11-23
**Author:** Claude Code
**Status:** Draft

---

## Executive Summary

StaticPress currently has excellent GitHub Pages integration but only provides manual instructions for Vercel, Netlify, and Cloudflare Pages. This PRD outlines a comprehensive solution to add full API integration for all major deployment platforms, providing users with one-click deployment, real-time status monitoring, and unified management regardless of their chosen hosting platform.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Success Metrics](#goals--success-metrics)
3. [User Experience Requirements](#user-experience-requirements)
4. [Technical Architecture](#technical-architecture)
5. [Epic 1: Platform Provider Abstraction](#epic-1-platform-provider-abstraction)
6. [Epic 2: Vercel Integration](#epic-2-vercel-integration)
7. [Epic 3: Netlify Integration](#epic-3-netlify-integration)
8. [Epic 4: Cloudflare Pages Integration](#epic-4-cloudflare-pages-integration)
9. [Epic 5: Unified Deployment Dashboard](#epic-5-unified-deployment-dashboard)
10. [Epic 6: Custom Domain Management](#epic-6-custom-domain-management)
11. [Database Schema Changes](#database-schema-changes)
12. [API Design](#api-design)
13. [Security Considerations](#security-considerations)
14. [Testing Strategy](#testing-strategy)
15. [Implementation Timeline](#implementation-timeline)

---

## Problem Statement

### Current State
- **GitHub Pages**: Full automation via API ✅
- **Vercel**: Manual setup with external links ❌
- **Netlify**: Manual setup with external links ❌
- **Cloudflare Pages**: Manual setup with external links ❌

### User Pain Points
1. Must leave StaticPress to deploy to non-GitHub platforms
2. No deployment status for Vercel/Netlify/Cloudflare deployments
3. Cannot auto-fix build issues on other platforms
4. Must manually enter site URL after deployment
5. Custom domains only work with GitHub Pages
6. No preview deployments
7. Cannot switch platforms without losing configuration

### Business Impact
- Users choose GitHub Pages by default (path of least resistance)
- Higher churn from users who prefer Vercel/Netlify
- Support burden from manual deployment issues
- Missed opportunity for platform-agnostic positioning

---

## Goals & Success Metrics

### Goals
1. One-click deployment to any supported platform
2. Unified status monitoring across all platforms
3. Platform-specific auto-fix capabilities
4. Custom domain support for all platforms
5. Preview deployment support where available

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Platforms with full API integration | 1/4 | 4/4 |
| Average time to first deployment | ~10 min | < 2 min |
| Deployment success rate | Unknown | > 95% |
| Users on non-GitHub platforms | ~5% | > 30% |
| Support tickets for deployment issues | High | 50% reduction |

---

## User Experience Requirements

### Onboarding Flow

```
1. User creates/connects repository
2. Platform selection screen with clear comparison
3. One-click "Connect & Deploy" button
4. OAuth popup for platform authentication
5. Auto-configuration of build settings
6. Real-time deployment progress
7. Success screen with live site link
```

### Dashboard Experience

```
1. Deployment status badge always visible
2. Click badge → expanded deployment panel
3. Panel shows: status, platform, last deploy time, site URL
4. Quick actions: Redeploy, View Logs, Settings
5. Auto-fix suggestions for failures
```

### Settings Experience

```
1. Deployment section in settings
2. Current platform with "Switch Platform" option
3. Custom domain configuration
4. Build settings (branch, command, output dir)
5. Environment variables management
6. Deployment history
```

---

## Technical Architecture

### Provider Abstraction Layer

```typescript
// lib/deployment/types.ts

export type DeploymentPlatform = 'github-pages' | 'vercel' | 'netlify' | 'cloudflare'

export interface DeploymentProvider {
  platform: DeploymentPlatform

  // Authentication
  getAuthUrl(): string
  handleCallback(code: string): Promise<PlatformCredentials>

  // Project Management
  createProject(config: ProjectConfig): Promise<ProjectResult>
  deleteProject(projectId: string): Promise<void>

  // Deployment
  triggerDeploy(): Promise<DeploymentResult>
  getDeploymentStatus(deployId: string): Promise<DeploymentStatus>
  getDeploymentLogs(deployId: string): Promise<string>
  cancelDeployment(deployId: string): Promise<void>

  // Domains
  addCustomDomain(domain: string): Promise<DomainResult>
  verifyDomain(domain: string): Promise<DomainVerification>
  removeCustomDomain(domain: string): Promise<void>

  // Configuration
  setEnvironmentVariables(vars: EnvVar[]): Promise<void>
  setBuildSettings(settings: BuildSettings): Promise<void>
}

export interface ProjectConfig {
  name: string
  repoOwner: string
  repoName: string
  branch: string
  buildCommand: string
  outputDirectory: string
  framework: 'hugo' | 'other'
}

export interface DeploymentStatus {
  id: string
  state: 'queued' | 'building' | 'ready' | 'error' | 'canceled'
  url?: string
  createdAt: string
  readyAt?: string
  errorMessage?: string
}
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  StaticPress App                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Dashboard  │  │  Settings   │  │  Onboarding │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          │                          │
│              ┌───────────▼───────────┐              │
│              │  Deployment Service   │              │
│              │  (lib/deployment/)    │              │
│              └───────────┬───────────┘              │
│                          │                          │
│    ┌─────────┬───────────┼───────────┬─────────┐   │
│    │         │           │           │         │   │
│    ▼         ▼           ▼           ▼         │   │
│ ┌──────┐ ┌──────┐  ┌──────────┐ ┌──────────┐  │   │
│ │GitHub│ │Vercel│  │ Netlify  │ │Cloudflare│  │   │
│ │Pages │ │      │  │          │ │  Pages   │  │   │
│ └──┬───┘ └──┬───┘  └────┬─────┘ └────┬─────┘  │   │
│    │        │           │            │         │   │
└────┼────────┼───────────┼────────────┼─────────┘   │
     │        │           │            │
     ▼        ▼           ▼            ▼
 ┌──────┐ ┌──────┐  ┌──────────┐ ┌──────────┐
 │GitHub│ │Vercel│  │ Netlify  │ │Cloudflare│
 │ API  │ │ API  │  │   API    │ │   API    │
 └──────┘ └──────┘  └──────────┘ └──────────┘
```

---

## Epic 1: Platform Provider Abstraction

### Story 1.1: Create Deployment Provider Interface

**Files to create:**
- `lib/deployment/types.ts` - Type definitions
- `lib/deployment/provider.ts` - Base provider interface
- `lib/deployment/index.ts` - Factory and exports

**Implementation:**

```typescript
// lib/deployment/provider.ts

import { DeploymentPlatform, DeploymentProvider, ProjectConfig } from './types'

export abstract class BaseDeploymentProvider implements DeploymentProvider {
  abstract platform: DeploymentPlatform

  protected userId: number
  protected credentials: PlatformCredentials | null = null

  constructor(userId: number) {
    this.userId = userId
  }

  abstract getAuthUrl(): string
  abstract handleCallback(code: string): Promise<PlatformCredentials>
  abstract createProject(config: ProjectConfig): Promise<ProjectResult>
  // ... other abstract methods

  // Shared utilities
  protected async saveCredentials(creds: PlatformCredentials): Promise<void> {
    // Encrypt and store in database
  }

  protected async loadCredentials(): Promise<PlatformCredentials | null> {
    // Load and decrypt from database
  }

  protected normalizeStatus(platformStatus: string): DeploymentStatus['state'] {
    // Map platform-specific statuses to our standard states
  }
}
```

### Story 1.2: Create Provider Factory

```typescript
// lib/deployment/index.ts

import { DeploymentPlatform, DeploymentProvider } from './types'
import { GitHubPagesProvider } from './providers/github-pages'
import { VercelProvider } from './providers/vercel'
import { NetlifyProvider } from './providers/netlify'
import { CloudflareProvider } from './providers/cloudflare'

export function getDeploymentProvider(
  platform: DeploymentPlatform,
  userId: number
): DeploymentProvider {
  switch (platform) {
    case 'github-pages':
      return new GitHubPagesProvider(userId)
    case 'vercel':
      return new VercelProvider(userId)
    case 'netlify':
      return new NetlifyProvider(userId)
    case 'cloudflare':
      return new CloudflareProvider(userId)
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

export * from './types'
```

### Story 1.3: Refactor GitHub Pages to Provider Pattern

**Files to modify:**
- `lib/deployment/providers/github-pages.ts` - New provider implementation
- Migrate existing code from `lib/github.ts`

---

## Epic 2: Vercel Integration

### Overview

**Vercel API:** https://vercel.com/docs/rest-api

**OAuth Flow:**
1. User clicks "Connect Vercel"
2. Redirect to Vercel OAuth
3. User authorizes StaticPress
4. Callback with access token
5. Store encrypted token

### Story 2.1: Vercel OAuth Setup

**Environment Variables:**
```
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
```

**API Routes:**
- `GET /api/auth/vercel` - Initiate OAuth
- `GET /api/auth/vercel/callback` - Handle callback

**Implementation:**

```typescript
// lib/deployment/providers/vercel.ts

export class VercelProvider extends BaseDeploymentProvider {
  platform: DeploymentPlatform = 'vercel'

  private apiBase = 'https://api.vercel.com'

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.VERCEL_CLIENT_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/vercel/callback`,
      scope: 'user:read projects:write deployments:read',
    })
    return `https://vercel.com/oauth/authorize?${params}`
  }

  async handleCallback(code: string): Promise<PlatformCredentials> {
    const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/vercel/callback`,
      }),
    })

    const data = await response.json()
    const creds = {
      accessToken: data.access_token,
      teamId: data.team_id,
      expiresAt: null, // Vercel tokens don't expire
    }

    await this.saveCredentials(creds)
    return creds
  }
}
```

### Story 2.2: Vercel Project Creation

```typescript
async createProject(config: ProjectConfig): Promise<ProjectResult> {
  const creds = await this.loadCredentials()
  if (!creds) throw new Error('Not authenticated with Vercel')

  // Create project via Vercel API
  const response = await fetch(`${this.apiBase}/v10/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: config.name,
      gitRepository: {
        repo: `${config.repoOwner}/${config.repoName}`,
        type: 'github',
      },
      framework: 'hugo',
      buildCommand: config.buildCommand || 'hugo --minify',
      outputDirectory: config.outputDirectory || 'public',
      installCommand: 'npm install || true',
    }),
  })

  const project = await response.json()

  return {
    projectId: project.id,
    projectName: project.name,
    url: `https://${project.name}.vercel.app`,
  }
}
```

### Story 2.3: Vercel Deployment Status

```typescript
async getDeploymentStatus(deployId: string): Promise<DeploymentStatus> {
  const creds = await this.loadCredentials()

  const response = await fetch(
    `${this.apiBase}/v13/deployments/${deployId}`,
    {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    }
  )

  const deploy = await response.json()

  return {
    id: deploy.id,
    state: this.mapVercelState(deploy.readyState),
    url: deploy.url ? `https://${deploy.url}` : undefined,
    createdAt: new Date(deploy.createdAt).toISOString(),
    readyAt: deploy.ready ? new Date(deploy.ready).toISOString() : undefined,
    errorMessage: deploy.errorMessage,
  }
}

private mapVercelState(state: string): DeploymentStatus['state'] {
  const mapping: Record<string, DeploymentStatus['state']> = {
    'QUEUED': 'queued',
    'BUILDING': 'building',
    'READY': 'ready',
    'ERROR': 'error',
    'CANCELED': 'canceled',
  }
  return mapping[state] || 'queued'
}
```

### Story 2.4: Vercel Build Logs

```typescript
async getDeploymentLogs(deployId: string): Promise<string> {
  const creds = await this.loadCredentials()

  const response = await fetch(
    `${this.apiBase}/v2/deployments/${deployId}/events`,
    {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    }
  )

  const events = await response.json()

  // Format events into readable log
  return events
    .filter((e: any) => e.type === 'stdout' || e.type === 'stderr')
    .map((e: any) => e.text)
    .join('\n')
}
```

### Story 2.5: Vercel Custom Domains

```typescript
async addCustomDomain(domain: string): Promise<DomainResult> {
  const creds = await this.loadCredentials()
  const projectId = await this.getProjectId()

  const response = await fetch(
    `${this.apiBase}/v10/projects/${projectId}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  )

  const result = await response.json()

  return {
    domain: result.name,
    verified: result.verified,
    verification: result.verification || [],
  }
}
```

---

## Epic 3: Netlify Integration

### Overview

**Netlify API:** https://docs.netlify.com/api/get-started/

**OAuth Flow:** Similar to Vercel

### Story 3.1: Netlify OAuth Setup

**Environment Variables:**
```
NETLIFY_CLIENT_ID=
NETLIFY_CLIENT_SECRET=
```

### Story 3.2: Netlify Provider Implementation

```typescript
// lib/deployment/providers/netlify.ts

export class NetlifyProvider extends BaseDeploymentProvider {
  platform: DeploymentPlatform = 'netlify'

  private apiBase = 'https://api.netlify.com/api/v1'

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.NETLIFY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/netlify/callback`,
      scope: 'user:read sites:write deploys:read',
    })
    return `https://app.netlify.com/authorize?${params}`
  }

  async createProject(config: ProjectConfig): Promise<ProjectResult> {
    const creds = await this.loadCredentials()

    // Create site linked to GitHub repo
    const response = await fetch(`${this.apiBase}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        repo: {
          provider: 'github',
          repo: `${config.repoOwner}/${config.repoName}`,
          branch: config.branch,
          cmd: config.buildCommand || 'hugo --minify',
          dir: config.outputDirectory || 'public',
        },
      }),
    })

    const site = await response.json()

    return {
      projectId: site.id,
      projectName: site.name,
      url: site.ssl_url || site.url,
    }
  }

  async getDeploymentStatus(deployId: string): Promise<DeploymentStatus> {
    const creds = await this.loadCredentials()

    const response = await fetch(
      `${this.apiBase}/deploys/${deployId}`,
      {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
      }
    )

    const deploy = await response.json()

    return {
      id: deploy.id,
      state: this.mapNetlifyState(deploy.state),
      url: deploy.ssl_url || deploy.deploy_url,
      createdAt: deploy.created_at,
      readyAt: deploy.published_at,
      errorMessage: deploy.error_message,
    }
  }

  private mapNetlifyState(state: string): DeploymentStatus['state'] {
    const mapping: Record<string, DeploymentStatus['state']> = {
      'new': 'queued',
      'pending_review': 'queued',
      'building': 'building',
      'uploading': 'building',
      'uploaded': 'building',
      'preparing': 'building',
      'prepared': 'building',
      'processing': 'building',
      'ready': 'ready',
      'error': 'error',
    }
    return mapping[state] || 'queued'
  }
}
```

---

## Epic 4: Cloudflare Pages Integration

### Overview

**Cloudflare API:** https://developers.cloudflare.com/api/

**Note:** Cloudflare uses API tokens rather than OAuth for programmatic access.

### Story 4.1: Cloudflare API Token Setup

```typescript
// lib/deployment/providers/cloudflare.ts

export class CloudflareProvider extends BaseDeploymentProvider {
  platform: DeploymentPlatform = 'cloudflare'

  private apiBase = 'https://api.cloudflare.com/client/v4'

  // Cloudflare uses API tokens instead of OAuth
  // User provides token with Pages permissions

  async createProject(config: ProjectConfig): Promise<ProjectResult> {
    const creds = await this.loadCredentials()

    const response = await fetch(
      `${this.apiBase}/accounts/${creds.accountId}/pages/projects`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          production_branch: config.branch,
          source: {
            type: 'github',
            config: {
              owner: config.repoOwner,
              repo_name: config.repoName,
              production_branch: config.branch,
            },
          },
          build_config: {
            build_command: config.buildCommand || 'hugo --minify',
            destination_dir: config.outputDirectory || 'public',
          },
        }),
      }
    )

    const project = await response.json()

    return {
      projectId: project.result.name,
      projectName: project.result.name,
      url: `https://${project.result.subdomain}.pages.dev`,
    }
  }
}
```

---

## Epic 5: Unified Deployment Dashboard

### Story 5.1: Enhanced Deployment Status Component

**File:** `components/deployment-panel.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Cloud,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react'

interface DeploymentPanelProps {
  platform: DeploymentPlatform
  projectId: string
  siteUrl: string
}

export function DeploymentPanel({ platform, projectId, siteUrl }: DeploymentPanelProps) {
  const [status, setStatus] = useState<DeploymentStatus | null>(null)
  const [logs, setLogs] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [isRedeploying, setIsRedeploying] = useState(false)

  // Fetch status on mount and poll
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    const res = await fetch(`/api/deployment/status?platform=${platform}`)
    const data = await res.json()
    setStatus(data)
  }

  const handleRedeploy = async () => {
    setIsRedeploying(true)
    await fetch('/api/deployment/trigger', { method: 'POST' })
    setTimeout(() => {
      fetchStatus()
      setIsRedeploying(false)
    }, 3000)
  }

  const handleViewLogs = async () => {
    if (!status?.id) return
    const res = await fetch(`/api/deployment/logs?id=${status.id}`)
    const data = await res.json()
    setLogs(data.logs)
    setShowLogs(true)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} />
          <span className="font-medium">{platformNames[platform]}</span>
        </div>
        <StatusBadge status={status?.state} />
      </div>

      {siteUrl && (
        <a
          href={siteUrl}
          target="_blank"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4"
        >
          {siteUrl}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleRedeploy}
          disabled={isRedeploying}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <RefreshCw className={`w-3 h-3 ${isRedeploying ? 'animate-spin' : ''}`} />
          Redeploy
        </button>

        {status?.state === 'error' && (
          <button
            onClick={handleViewLogs}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            View Logs
          </button>
        )}

        <a
          href="/settings#deployment"
          className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          <Settings className="w-3 h-3" />
        </a>
      </div>

      {showLogs && logs && (
        <LogsModal logs={logs} onClose={() => setShowLogs(false)} />
      )}
    </div>
  )
}
```

### Story 5.2: Platform Selection UI

**File:** `components/platform-selector.tsx`

Features:
- Cards for each platform with pros/cons
- Visual indicator for current selection
- Connection status per platform
- Quick connect buttons

---

## Epic 6: Custom Domain Management

### Story 6.1: Domain Configuration UI

**File:** `components/domain-manager.tsx`

Features:
- Add custom domain input
- DNS verification status
- Required DNS records display
- SSL certificate status
- Remove domain option

### Story 6.2: DNS Verification Flow

```typescript
// lib/deployment/domain-verification.ts

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  name: string
  value: string
}

export async function verifyDomain(
  platform: DeploymentPlatform,
  domain: string
): Promise<{
  verified: boolean
  records: DNSRecord[]
  errors: string[]
}> {
  const provider = getDeploymentProvider(platform, userId)
  const verification = await provider.verifyDomain(domain)

  return {
    verified: verification.verified,
    records: verification.requiredRecords,
    errors: verification.errors || [],
  }
}
```

---

## Database Schema Changes

### New Tables

```sql
-- Platform credentials (encrypted)
CREATE TABLE platform_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  team_id VARCHAR(255),
  account_id VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Deployment projects
CREATE TABLE deployment_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  production_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(repository_id, platform)
);

-- Deployment history
CREATE TABLE deployment_history (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES deployment_projects(id) ON DELETE CASCADE,
  deployment_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  url TEXT,
  commit_sha VARCHAR(40),
  commit_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Custom domains
CREATE TABLE custom_domains (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES deployment_projects(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  ssl_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  UNIQUE(project_id, domain)
);
```

### Modify Existing Tables

```sql
-- Add deployment_platform to repositories
ALTER TABLE repositories
ADD COLUMN deployment_platform VARCHAR(50) DEFAULT 'github-pages';
```

---

## API Design

### New API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[platform]` | GET | Initiate OAuth for platform |
| `/api/auth/[platform]/callback` | GET | OAuth callback |
| `/api/deployment/connect` | POST | Create project on platform |
| `/api/deployment/trigger` | POST | Trigger new deployment |
| `/api/deployment/status` | GET | Get current deployment status |
| `/api/deployment/logs` | GET | Get build logs |
| `/api/deployment/history` | GET | Get deployment history |
| `/api/domains` | GET/POST/DELETE | Manage custom domains |
| `/api/domains/verify` | POST | Verify domain DNS |

### Request/Response Examples

**POST /api/deployment/connect**
```json
// Request
{
  "platform": "vercel",
  "buildCommand": "hugo --minify",
  "outputDirectory": "public"
}

// Response
{
  "success": true,
  "projectId": "prj_xxx",
  "url": "https://my-blog.vercel.app"
}
```

**GET /api/deployment/status**
```json
// Response
{
  "platform": "vercel",
  "deployment": {
    "id": "dpl_xxx",
    "state": "ready",
    "url": "https://my-blog.vercel.app",
    "createdAt": "2024-01-15T10:00:00Z",
    "readyAt": "2024-01-15T10:02:30Z"
  }
}
```

---

## Security Considerations

### Token Storage
- Encrypt platform tokens with AES-256-GCM
- Use environment variable for encryption key
- Never log tokens

### OAuth Security
- Validate state parameter
- Use PKCE where supported
- Short-lived authorization codes

### API Security
- All routes require authentication
- Rate limit OAuth endpoints
- Validate webhook signatures

---

## Testing Strategy

### Unit Tests
- Provider abstraction layer
- Token encryption/decryption
- Status mapping functions

### Integration Tests
- OAuth flow mocking
- API response handling
- Error scenarios

### E2E Tests
- Full deployment flow per platform
- Custom domain setup
- Platform switching

### Test Files to Create
```
lib/deployment/__tests__/provider.test.ts
lib/deployment/__tests__/vercel.test.ts
lib/deployment/__tests__/netlify.test.ts
lib/deployment/__tests__/cloudflare.test.ts
e2e/deployment-vercel.spec.ts
e2e/deployment-netlify.spec.ts
e2e/deployment-domains.spec.ts
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Provider abstraction layer
- Refactor GitHub Pages to provider pattern
- Database schema changes

### Phase 2: Vercel Integration (Week 2)
- OAuth setup
- Project creation
- Status monitoring
- Build logs

### Phase 3: Netlify Integration (Week 3)
- OAuth setup
- Project creation
- Status monitoring
- Build logs

### Phase 4: Cloudflare Integration (Week 4)
- API token flow
- Project creation
- Status monitoring

### Phase 5: UI & Polish (Week 5)
- Unified deployment panel
- Platform selector
- Settings integration
- Custom domain UI

### Phase 6: Testing & Documentation (Week 6)
- Comprehensive test suite
- User documentation
- API documentation

---

## Environment Variables

### New Required Variables

```
# Vercel
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=

# Netlify
NETLIFY_CLIENT_ID=
NETLIFY_CLIENT_SECRET=

# Cloudflare (uses API tokens)
# No app-level secrets needed

# Token Encryption
PLATFORM_TOKEN_ENCRYPTION_KEY=
```

---

## Appendix: Platform API References

### Vercel
- API Docs: https://vercel.com/docs/rest-api
- OAuth: https://vercel.com/docs/rest-api#authentication/oauth2
- Scopes needed: `user:read`, `projects:write`, `deployments:read`

### Netlify
- API Docs: https://docs.netlify.com/api/get-started/
- OAuth: https://docs.netlify.com/api/get-started/#authentication
- Scopes needed: `user:read`, `sites:write`, `deploys:read`

### Cloudflare
- API Docs: https://developers.cloudflare.com/api/
- Pages API: https://developers.cloudflare.com/pages/platform/api/
- Token permissions: Account > Cloudflare Pages > Edit

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] Vercel OAuth and project creation
- [ ] Netlify OAuth and project creation
- [ ] Status monitoring for all platforms
- [ ] Basic deployment panel in dashboard

### Full Release
- [ ] All 4 platforms fully integrated
- [ ] Custom domain support for all platforms
- [ ] Deployment history
- [ ] Auto-fix for common issues
- [ ] Comprehensive test coverage
- [ ] User documentation
