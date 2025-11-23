# PRD: One-Click Deployment Setup

## Overview

Simplify deployment platform setup to a single OAuth authorization. After clicking "Connect," StaticPress automatically configures everything needed for deployment.

## Problem Statement

Current implementation requires multiple steps:
- Cloudflare requires manual API token and Account ID entry
- Users must manually create projects after connecting
- Build configuration requires user input

**Goal**: User clicks one button → OAuth → Done. Site deploys on next push.

## User Experience

### Target Flow

```
┌─────────────────────────────────────────┐
│  Choose Your Deployment Platform        │
├─────────────────────────────────────────┤
│                                         │
│  [GitHub Pages]  ← Recommended          │
│   Already connected via GitHub          │
│   [Enable GitHub Pages]                 │
│                                         │
│  [Vercel]                               │
│   [Connect with Vercel]                 │
│                                         │
│  [Netlify]                              │
│   [Connect with Netlify]                │
│                                         │
│  [Cloudflare Pages]                     │
│   [Connect with Cloudflare]             │
│                                         │
└─────────────────────────────────────────┘
```

### After OAuth Authorization

1. **Immediate feedback**: "Setting up your deployment..."
2. **Auto-detection**: Find user's account/team
3. **Auto-creation**: Create project linked to GitHub repo
4. **Auto-configuration**: Set Hugo build settings
5. **Success**: "Your site will deploy on every push to main"

### Success State

```
┌─────────────────────────────────────────┐
│  ✓ Deployed with Vercel                 │
├─────────────────────────────────────────┤
│                                         │
│  Your site: https://myblog.vercel.app   │
│                                         │
│  [View Site]  [Deploy Now]  [Settings]  │
│                                         │
│  Last deployment: 2 minutes ago ✓       │
│                                         │
└─────────────────────────────────────────┘
```

## Technical Requirements

### 1. Cloudflare OAuth Migration

**Current**: API token + Account ID form
**Target**: OAuth with auto-account detection

```typescript
// After OAuth callback
const accounts = await cloudflareApi.listAccounts(token)
const accountId = accounts[0].id // or prompt if multiple
```

**Environment Variables**:
- `CLOUDFLARE_CLIENT_ID`
- `CLOUDFLARE_CLIENT_SECRET`

**OAuth Scopes**: `account:read`, `pages:write`

### 2. Auto-Project Creation

Add `autoSetupProject()` method to DeploymentProvider interface:

```typescript
interface DeploymentProvider {
  // ... existing methods

  /**
   * Complete one-click setup after OAuth
   * - Detect account/team
   * - Create project linked to GitHub repo
   * - Configure build settings
   * - Return deployment URL
   */
  autoSetupProject(
    credentials: DeploymentCredentials,
    githubRepo: { owner: string; name: string; defaultBranch: string },
    config: {
      framework: 'hugo'
      hugoVersion?: string
    }
  ): Promise<{
    project: DeploymentProject
    deploymentUrl: string
    webhookConfigured: boolean
  }>
}
```

### 3. Platform-Specific Implementation

#### GitHub Pages
- Already OAuth'd via main GitHub auth
- Call `enableGitHubPages()` with workflow source
- No additional OAuth needed

#### Vercel
- OAuth scopes: Default (full access)
- Auto-detect personal account or team
- Create project with:
  ```json
  {
    "name": "{repo-name}",
    "framework": "hugo",
    "gitRepository": {
      "type": "github",
      "repo": "{owner}/{repo}"
    },
    "buildCommand": "hugo --minify",
    "outputDirectory": "public"
  }
  ```

#### Netlify
- OAuth scopes: Default
- Create site with:
  ```json
  {
    "name": "{repo-name}",
    "repo": {
      "provider": "github",
      "repo": "{owner}/{repo}",
      "branch": "main"
    },
    "build_settings": {
      "cmd": "hugo --minify",
      "dir": "public"
    }
  }
  ```

#### Cloudflare Pages
- OAuth scopes: `account:read`, `pages:write`
- List accounts, select first (or prompt)
- Create project with:
  ```json
  {
    "name": "{repo-name}",
    "production_branch": "main",
    "build_config": {
      "build_command": "hugo --minify",
      "destination_dir": "public"
    },
    "source": {
      "type": "github",
      "config": {
        "owner": "{owner}",
        "repo_name": "{repo}"
      }
    }
  }
  ```

### 4. API Route Changes

#### New Endpoint: `POST /api/deployment/setup`

One endpoint to handle the entire flow:

```typescript
// Request
{
  "platform": "vercel" | "netlify" | "cloudflare" | "github-pages",
  "repositoryId": number
}

// Response
{
  "success": true,
  "project": {
    "id": "prj_xxx",
    "name": "my-blog",
    "productionUrl": "https://my-blog.vercel.app",
    "platform": "vercel"
  },
  "message": "Deployment configured successfully"
}
```

#### Updated OAuth Callback

After successful OAuth, automatically call `autoSetupProject()`:

```typescript
// In /api/deployment/oauth/[platform]/callback
const token = await provider.exchangeCodeForToken(code, redirectUri)

// Store credentials
await saveCredentials(userId, platform, token)

// Auto-setup project
const repoConfig = await getRepoConfig(userId)
const result = await provider.autoSetupProject(
  { platform, accessToken: token },
  { owner: repoConfig.owner, name: repoConfig.repo, defaultBranch: 'main' },
  { framework: 'hugo' }
)

// Store project
await saveDeploymentProject(repoConfig.repositoryId, result.project)

// Redirect to success page
redirect(`/deploy?success=true&url=${result.deploymentUrl}`)
```

### 5. UI Simplification

#### Platform Selector Component

Simplified to show connection status and single action button:

```tsx
<PlatformCard platform="vercel">
  {isConnected ? (
    <>
      <Status>Connected</Status>
      <Button onClick={setupProject}>Set Up Deployment</Button>
    </>
  ) : (
    <Button onClick={startOAuth}>Connect with Vercel</Button>
  )}
</PlatformCard>
```

#### Remove Manual Configuration

- Remove project name input (auto-generate from repo name)
- Remove build command input (always Hugo defaults)
- Remove account/team selection for single-account users

### 6. Error Handling

#### Account Selection (Multiple Accounts)

If user has multiple teams/accounts, show selector:

```
┌─────────────────────────────────────────┐
│  Select Account                         │
├─────────────────────────────────────────┤
│  ○ Personal Account                     │
│  ○ Acme Corp (Team)                     │
│  ○ Side Projects (Team)                 │
│                                         │
│  [Continue]                             │
└─────────────────────────────────────────┘
```

#### Project Already Exists

If project name conflicts:
1. Check if it's linked to same GitHub repo → use existing
2. Different repo → append random suffix to name

#### Missing Permissions

Clear error message with link to re-authorize:

```
"StaticPress needs additional permissions to create projects.
[Re-authorize with Vercel]"
```

## Database Changes

No schema changes needed. Use existing tables:
- `deployment_platforms` - Store OAuth tokens
- `deployment_projects` - Store auto-created projects

## Environment Variables

```bash
# Existing
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# New OAuth apps
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=

NETLIFY_CLIENT_ID=
NETLIFY_CLIENT_SECRET=

CLOUDFLARE_CLIENT_ID=
CLOUDFLARE_CLIENT_SECRET=
```

## Success Metrics

- **Setup completion rate**: >90% of users complete setup after starting OAuth
- **Time to first deploy**: <60 seconds from clicking "Connect"
- **Support tickets**: Reduce deployment-related tickets by 80%

## Implementation Phases

### Phase 1: Cloudflare OAuth (1-2 hours)
- Update CloudflareProvider to use OAuth
- Add account auto-detection
- Update platform-connect-modal for Cloudflare

### Phase 2: Auto-Setup Method (2-3 hours)
- Add `autoSetupProject()` to provider interface
- Implement for all 4 providers
- Add `/api/deployment/setup` endpoint

### Phase 3: UI Streamlining (1-2 hours)
- Simplify platform-selector component
- Update OAuth callback to auto-setup
- Add success/error states

### Phase 4: Testing (1 hour)
- Unit tests for auto-setup logic
- E2E tests for OAuth flow
- Manual testing with each platform

## Out of Scope

- Custom build commands (always use Hugo defaults)
- Multiple projects per platform (one repo = one deployment)
- Team/organization management UI
- Deployment rollback UI (keep API only)

## Dependencies

User must:
1. Register OAuth apps with each platform
2. Configure redirect URIs
3. Set environment variables

## Appendix: OAuth App Registration

### Vercel
1. Go to https://vercel.com/account/tokens
2. Create OAuth App
3. Redirect URI: `https://www.staticpress.me/api/deployment/oauth/vercel/callback`

### Netlify
1. Go to https://app.netlify.com/user/applications
2. Create OAuth App
3. Redirect URI: `https://www.staticpress.me/api/deployment/oauth/netlify/callback`

### Cloudflare
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create OAuth App (under API Tokens → OAuth)
3. Redirect URI: `https://www.staticpress.me/api/deployment/oauth/cloudflare/callback`
4. Scopes: `account:read`, `pages:write`
