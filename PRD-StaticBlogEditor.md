# Product Requirements Document: StaticPress

**Version:** 2.0 (Merged & Updated)
**Last Updated:** 2025-10-20
**Status:** Active Development - Phase 1 Complete

---

## Core Product Mantra

**"My mom could use this"**

Every feature, every UI element, every decision must pass this test. If it requires technical knowledge or reveals backend complexity, it doesn't belong in StaticPress.

---

## Executive Summary

StaticPress is a radically simple web-based editor for Hugo blogs that bridges the gap between WordPress ease-of-use and static site performance. Users write and publish at staticpress.me through a beautiful interface while StaticPress handles all the Hugo/Git complexity automatically.

**The StaticPress Promise:** "The simplicity of Medium, the ownership of Hugo, the beauty of Ghost, the cost of free."

---

## Problem Statement

Static site generators like Hugo offer superior performance, security, and cost benefits over traditional CMSs, but suffer from terrible UX for non-technical users:

### Current Pain Points
- No simple editing interface (must use VS Code, terminal, or complex tools)
- Manual folder structure management (year/month/day directories)
- Manual file naming conventions and frontmatter YAML editing
- Manual Git operations (add, commit, push)
- No WYSIWYG editing (raw Markdown only)
- Complex hosting setup

### User Story
> "As a blogger migrating from WordPress to Hugo, I want to write and publish posts with the same simplicity as WordPress, without learning Git, Markdown, or Hugo's file structure conventions."

---

## Product Philosophy

### What StaticPress IS
- A beautiful writing interface at staticpress.me
- A place to write and publish blog posts with zero friction
- A tool that "just works" - posts appear on your blog seconds after clicking Publish
- A product focused on the joy of writing, not the mechanics of publishing

### What StaticPress IS NOT
- A Hugo configuration tool
- A Git client
- A theme development platform
- A technical product for developers

### Key Principles
1. **Hide ALL complexity** - Users should never see: Hugo, Git, YAML, frontmatter, file paths, repository names, branches, commits, or technical jargon
2. **Zero learning curve** - If it needs documentation, it's too complex
3. **Instant gratification** - Click Publish → Post appears on blog within seconds
4. **Progressive disclosure** - Start with the absolute minimum, add features only when users need them
5. **Opinionated defaults** - Make the right choices for users, don't make them choose

---

## Target Market

### Primary Personas

#### 1. Sarah the Writer (Primary)
- **Background:** Freelance writer, non-technical
- **Age:** 35-55
- **Goals:** Focus on writing, build audience, own her content
- **Frustrations:** WordPress too complex, Medium too restrictive
- **Needs:** Simple publishing, fast site, SEO-friendly
- **Quote:** "I just want to write and click publish. Is that too much to ask?"
- **Willingness to pay:** $5-15/month

#### 2. David the Developer (Secondary)
- **Background:** Software engineer, side project blogger
- **Age:** 28-45
- **Goals:** Fast site, Markdown support, Git-backed
- **Frustrations:** Static site generators too much command line
- **Needs:** Simple UI for writing, technical control underneath
- **Quote:** "I love Hugo's speed, but I don't want to mess with YAML every time I write."
- **Willingness to pay:** $10-20/month

#### 3. Technical Professionals (Tertiary)
- **Background:** Physicians, lawyers, academics
- **Age:** 35-65
- **Goals:** Professional blog, own their content, simple workflow
- **Value:** Simplicity + control + ownership
- **Willingness to pay:** $5-15/month

#### 4. Agencies Managing Client Blogs
- **Background:** Managing 5-50 static sites for clients
- **Value:** Centralized management, client-friendly interface
- **Willingness to pay:** $50-200/month

### Market Size (TAM/SAM/SOM)
- **TAM:** 7M+ WordPress users who might migrate to static
- **SAM:** 500K developers using Hugo/Jekyll/11ty
- **SOM (Year 1):** 5,000 users × $5/mo = $25K MRR target

---

## Product Roadmap

### Phase 1: MVP - Just Write ✅ (COMPLETE)

**Goal:** Prove the core value proposition - write and publish with zero friction

**Features Completed:**
- ✅ GitHub OAuth authentication
- ✅ Simple editor with Title + Content fields
- ✅ TipTap WYSIWYG editor with formatting toolbar
- ✅ Publish button (creates new post or updates existing)
- ✅ Save Draft button
- ✅ Posts list/browser with search
- ✅ Delete posts with confirmation modal
- ✅ Auto-commit to GitHub with meaningful commit messages
- ✅ Repository selection (one-time setup)
- ✅ Settings page to change repository
- ✅ Multi-user authentication with database (Supabase)
- ✅ Repository config stored in database (not cookies)
- ✅ Hyperlink functionality in editor
- ✅ Custom favicon
- ✅ 5-minute caching to reduce GitHub API calls
- ✅ Load 10 most recent posts (sorted by date)
- ✅ Three-dot menu for post actions (edit, delete)
- ✅ Long post title truncation in sidebar

**User Flow:**
1. Sign in with GitHub
2. Select repository (once)
3. Write → Publish → Done

**Success Metrics:**
- ✅ Users can publish their first post within 60 seconds of signing in
- Target: Zero support requests about "how to publish"
- Target: Users describe it as "incredibly simple" or "magical"

---

### Phase 2: Paywall Gates + Personal Tier (NEXT - Weeks 1-2)

**Goal:** Implement monetization with free tier limits + unlock Personal tier ($2.50/mo)

**Priority:** Paywall first, then Personal tier features

**Free Tier Limits:**
- Text-only blogging (no images)
- Edit last 5 posts only
- 1 repository
- Default theme
- GitHub commits (manual hosting setup via docs)

**Personal Tier Unlocks ($2.50/mo):**
- All posts editable (remove 5-post limit)
- Images (upload, drag-and-drop, auto-optimize to `/static/images/`)
- Categories & tags (free for all)
- Preview (free for all)

**Week 1 Tasks:**
- [ ] Subscription/tier management in database
- [ ] Stripe integration
- [ ] Implement "edit last 5 posts" limit on Free tier
- [ ] Upgrade prompts (when user hits limits)
- [ ] Personal tier unlock flow
- [ ] Server-side event logging (oauth_completed, repo_bound, first_publish, image_upload, upgrade_started, upgrade_done)

**Week 2 Tasks:**
- [ ] Images feature (Personal tier only)
  - Drag-and-drop + file picker
  - GitHub API upload to `/static/images/YYYY/MM/`
  - Auto-optimization (WebP conversion, size limits)
  - Insert Markdown image syntax
- [ ] Categories & Tags (free for all)
  - Input fields with autocomplete
  - Store in frontmatter
- [ ] Preview (free for all)
  - Markdown → HTML rendering
  - Preview modal/window
- [ ] Docs v1 + onboarding video
- [ ] Soft beta launch (25-50 Hugo/dev users)

**Success Metrics:**
- Free→Personal conversion: ≥6-10% within 30 days
- TTFP remains <60 seconds
- Image upload works reliably

---

### Phase 3: SMB Tier Features (Weeks 3-4)

**Goal:** Add SMB tier ($5/mo) with custom domains + theme gallery

**SMB Tier Unlocks ($5/mo):**
- Everything in Personal
- Custom domain guided setup (one-click for Cloudflare DNS)
- Theme gallery (5-8 curated themes)

**Week 3: Custom Domains**
- [ ] Cloudflare DNS automation
  - API integration (zones list, record create/verify)
  - "Add domain" flow (user auth → select zone → auto-create CNAME/A records)
  - Domain verification UI
  - Error handling for DNS propagation
- [ ] One-click setup for Cloudflare Pages
- [ ] Guided DNS flow for non-Cloudflare users (checklist + verification)

**Week 4: Theme Gallery**
- [ ] Create 5-8 template repos (Blowfish, PaperMod, Stack, Anatole, Terminal)
- [ ] Theme gallery UI (grid with screenshots, "Activate" button)
- [ ] Theme switching logic (new repo from template + content migration)
- [ ] Rollback safety
- [ ] Public beta launch ("Show HN", Hugo forum, Dev.to, Reddit)

**Success Metrics:**
- Domain attach success: ≥85% on SMB/Pro
- Theme switching: <30 seconds, zero failures
- Public beta drives initial paid conversions

---

### Phase 4: Media Management

**Goal:** Make working with images and media effortless

#### 4.1 Image Library
**User Story:** As a user, I want to browse and reuse previously uploaded images.

**Acceptance Criteria:**
- [ ] Browse previously uploaded images
- [ ] Search by filename
- [ ] Insert into posts
- [ ] Delete unused images
- [ ] Auto-detect unused images (suggest cleanup)

**UI:** Image button in editor opens modal with 2 tabs: "Upload New" and "From Library"

#### 4.2 Image Editing (Basic)
**User Story:** As a user, I want to crop or resize images before inserting them.

**Acceptance Criteria:**
- [ ] Crop
- [ ] Resize
- [ ] **NO** filters or advanced editing - use external tools for that

**UI:** After uploading, simple crop/resize UI before inserting.

#### 4.3 Featured Images
**User Story:** As a user, I want to set a featured image for social sharing.

**Acceptance Criteria:**
- [ ] Set featured image for posts
- [ ] Used in post listings/social shares

**UI:** "Featured Image" section below editor. Upload or select from library.

**Success Metrics:**
- Users reuse images across posts
- Image library cleanup feature used
- Featured images set on >60% of posts

---

### Phase 5: Advanced Features (Future)

**Goal:** Features for power users and growth, still maintaining simplicity

#### 5.1 One-Click Deploy Setup (HIGH VALUE)
**User Story:** As a new user, I want StaticPress to set up hosting for me automatically.

**Acceptance Criteria:**
- [ ] Guide users through hosting setup (Cloudflare Pages, Netlify, Vercel)
- [ ] Detect hosting provider from repository
- [ ] Automated deploy configuration
- [ ] **NO** manual build configuration

**UI:** Setup wizard on first login: "Where do you want to host your blog?" → Select provider → Automated setup

#### 5.2 Custom Domains
**User Story:** As a user, I want to use my own domain name.

**Acceptance Criteria:**
- [ ] One-click connect custom domain
- [ ] SSL included automatically
- [ ] **NO** DNS configuration shown to user

**UI:** Settings → Domain → Enter domain → Follow simple instructions

#### 5.3 Analytics (Simple)
**User Story:** As a user, I want to see how many people read my posts.

**Acceptance Criteria:**
- [ ] Simple traffic stats (page views, popular posts)
- [ ] **NO** complex analytics dashboards
- [ ] Maybe integrate with Simple Analytics or Plausible

**UI:** Dashboard with 3-4 key metrics. Link to "View detailed analytics" if they want more.

#### 5.4 SEO Essentials
**User Story:** As a user, I want my posts to rank well in search engines.

**Acceptance Criteria:**
- [ ] Auto-generate meta descriptions
- [ ] Suggest meta title
- [ ] **NO** complex SEO tools - just the basics

**UI:** Optional fields in editor (collapsed by default): "Meta Description", "Social Image"

#### 5.5 Collaboration
**User Story:** As a team, we want multiple people to write for our blog.

**Acceptance Criteria:**
- [ ] Invite co-authors
- [ ] Simple role management (Editor, Admin)
- [ ] **NO** complex permissions or workflows

**UI:** Settings → Team → Invite by email → Select role → Send invite

**Success Metrics:**
- Custom domain setup completes in <5 minutes
- Analytics viewed weekly by >40% of users
- Multi-author blogs successfully collaborate

---

## User Stories & Features (Detailed)

### Core Features (MVP - Phase 1) ✅ COMPLETE

#### 1. Authentication & Authorization ✅
**User Story:** As a user, I want to securely connect my GitHub account so the app can manage my blog repository.

**Status:** ✅ Complete

**Implementation:**
- ✅ GitHub OAuth flow with NextAuth.js
- ✅ Secure token storage in Supabase (encrypted)
- ✅ User can disconnect/reconnect GitHub account
- ✅ Session management
- ✅ Required GitHub scopes: `repo`, `user:email`

---

#### 2. Repository Selection ✅
**User Story:** As a user, I want to select which GitHub repository contains my Hugo blog.

**Status:** ✅ Complete

**Implementation:**
- ✅ List all user's GitHub repositories
- ✅ Search/filter repositories
- ✅ Save selected repository in database
- ✅ Settings page to change repository

---

#### 3. Post Browser ✅
**User Story:** As a user, I want to browse my existing posts so I can edit them.

**Status:** ✅ Complete

**Implementation:**
- ✅ List view of posts from `/content/posts/`
- ✅ Show post title and date
- ✅ Search posts by title
- ✅ Sort by date (newest first)
- ✅ Load 10 most recent posts
- ✅ Three-dot menu for actions (edit, delete)
- ✅ Delete confirmation modal

**UI Location:** `components/file-browser.tsx:14`

---

#### 4. WYSIWYG Editor ✅
**User Story:** As a user, I want to write posts using familiar formatting controls without learning Markdown.

**Status:** ✅ Complete

**Implementation:**
- ✅ TipTap rich text editor
- ✅ Formatting toolbar: Bold, Italic, Link, Heading, List
- ✅ Live HTML-to-Markdown conversion
- ✅ Character/word count display
- ✅ Hyperlink functionality

**UI Location:** `components/editor.tsx` (TipTap integration)
**Dashboard Location:** `components/dashboard-client.tsx:14`

---

#### 5. Frontmatter Management ✅
**User Story:** As a user, I want the app to automatically generate correct Hugo frontmatter.

**Status:** ✅ Complete

**Implementation:**
- ✅ Auto-generate frontmatter from title/date
- ✅ Draft/Published toggle
- ✅ Store as YAML (Hugo default)

**Code Location:** `lib/github.ts:158` (parseHugoPost function)

---

#### 6. File Structure Auto-Management ✅
**User Story:** As a user, I don't want to think about file paths—the app should handle this automatically.

**Status:** ✅ Complete

**Implementation:**
- ✅ Auto-create year/month directories
- ✅ Auto-generate filename from title (slugify)
- ✅ Path format: `/content/posts/{YYYY}/{MM}/{slug}.md`

**Code Location:** `app/api/posts/publish/route.ts`

---

#### 7. Publish to GitHub ✅
**User Story:** As a user, I want to publish my post with one click.

**Status:** ✅ Complete

**Implementation:**
- ✅ "Save Draft" button (commits but marks as draft: true)
- ✅ "Publish" button (commits and sets draft: false)
- ✅ Commit message auto-generated: "Add post: {title}" or "Update post: {title}"
- ✅ Show success/error notification
- ✅ Cache clearing after publish

**Code Locations:**
- API: `app/api/posts/publish/route.ts:7`
- Delete API: `app/api/posts/delete/route.ts:7`
- GitHub Client: `lib/github.ts:71` (createOrUpdateFile), `lib/github.ts:95` (deleteFile)

---

#### 8. Settings Panel ✅
**User Story:** As a user, I want to configure my blog settings once and have them remembered.

**Status:** ✅ Complete

**Implementation:**
- ✅ GitHub repository selection
- ✅ Repository stored in Supabase database
- ✅ Sign out functionality

**Future Settings:**
- [ ] Default author name
- [ ] Default categories
- [ ] Timezone for post dates
- [ ] Hugo content directory (default: `content/posts`)

---

## Technical Architecture

### Tech Stack

**Frontend:**
- **Framework:** Next.js 15.5.6 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Editor:** TipTap (WYSIWYG, prosemirror-based)
- **Markdown:** remark (HTML → Markdown conversion)

**Backend:**
- **Platform:** Vercel (serverless functions)
- **Database:** Supabase (PostgreSQL - user settings, sessions)
- **Cache:** In-memory caching (5 minutes for GitHub API responses)
- **Auth:** NextAuth.js (GitHub OAuth)

**Third-Party APIs:**
- **GitHub API:** Repository management, file CRUD
- **Octokit:** GitHub API client library

### System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────┐
│        Next.js Frontend             │
│  - React Components                 │
│  - TipTap Editor                    │
│  - Tailwind UI                      │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│     Vercel Serverless Functions     │
│  - /api/auth (NextAuth)             │
│  - /api/posts/* (CRUD operations)   │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬────────────────┐
       ↓              ↓                ↓
┌────────────┐  ┌──────────┐   ┌──────────┐
│ GitHub API │  │ Supabase │   │ In-Memory│
│            │  │ Postgres │   │  Cache   │
└────────────┘  └──────────┘   └──────────┘
```

### Data Models

#### Users Table (Supabase)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id INTEGER UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  access_token TEXT, -- Encrypted by Supabase
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Repository Configuration Table (Supabase)
```sql
CREATE TABLE repository_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  content_path VARCHAR(255) DEFAULT 'content/posts',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### API Endpoints

#### Authentication
- `GET /api/auth/signin` - Initiate GitHub OAuth
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/signout` - Sign out

#### Posts Management
- `GET /api/posts` - List posts from GitHub (cached 5 min)
- `POST /api/posts/publish` - Create or update post
- `POST /api/posts/delete` - Delete post

#### Settings
- `GET /api/setup` - First-time repository setup
- `POST /api/setup` - Save repository config
- `GET /api/settings` - Settings page
- `POST /api/settings` - Update repository config

### Hugo File Structure (Hidden from User)
- Posts: `content/posts/YYYY/MM/slug.md`
- Images: `static/images/YYYY/MM/` (Phase 2)
- Frontmatter: Auto-generated YAML
- File names: Auto-slugified from title

### Hosting Strategy (Simple Approach)
**Decision:** Themes committed directly to repository (not Hugo Modules)

**Rationale:**
- ✅ Works on all hosting platforms identically
- ✅ No Go dependency required
- ✅ Easier debugging for users
- ✅ Faster builds
- ✅ Higher success rate for non-technical users

**Template Repositories:**
- Create `staticpress-hugo-template` for each supported theme
- Each template includes:
  - Theme files committed directly
  - Proper `.gitignore` (excludes `public/`)
  - README with hosting instructions
  - `config.toml` with sensible defaults

**Supported Hosting Platforms:**
- Cloudflare Pages (recommended - free, fast, simple)
- Netlify
- Vercel
- GitHub Pages

### Security Considerations

1. **GitHub Token Storage**
   - ✅ Tokens encrypted by Supabase
   - ✅ Never exposed in client-side code
   - Server-side only API calls

2. **Input Validation**
   - Sanitize all user input
   - Validate file paths (prevent directory traversal)
   - Limit file sizes (posts: 1MB, images: 5MB in Phase 2)

3. **Rate Limiting**
   - GitHub API: 5,000 requests/hour (authenticated)
   - App caching: 5 minutes for post list
   - Future: Rate limit per user

4. **CORS**
   - Restrict to app domain only
   - No public API endpoints

### Performance Requirements

- **Page Load:** <2 seconds (initial load) ✅
- **Editor Responsiveness:** <100ms keystroke latency ✅
- **Save Operation:** <3 seconds (GitHub commit) ✅
- **File Tree Load:** <1 second (cached) ✅

---

## User Experience & Design

### Design Principles

1. **Simplicity First:** WordPress-level ease of use
2. **No Technical Jargon:** Hide Git/Hugo complexity completely
3. **Fast Feedback:** Show loading states, success/error clearly
4. **Mobile-Friendly:** Responsive design (desktop-first, mobile-capable)

### Key User Flows

#### Flow 1: First-Time User Setup ✅
```
1. Land on homepage
2. Click "Sign in with GitHub"
3. Authorize app (GitHub OAuth)
4. Select repository from list
5. See post browser (empty or existing posts)
6. Click "New Post"
7. Write and publish first post
```

#### Flow 2: Editing Existing Post ✅
```
1. Land on post browser
2. Search/browse for post
3. Click post to open editor
4. Edit content
5. Click "Publish" (auto-saves to GitHub)
6. See success notification
```

#### Flow 3: Creating New Post (Phase 2 - with images)
```
1. Click "New Post"
2. Enter title
3. Write content
4. Drag image into editor
5. Image uploads and inserts
6. Add categories/tags
7. Click "Publish"
8. See success + GitHub commit link
```

### Current UI Implementation

#### Dashboard Layout ✅
```
┌──────────────────────────────────────────────┐
│ StaticPress    [User ▼] [Settings]          │
├──────────┬───────────────────────────────────┤
│          │ [+ New Post]                      │
│  Posts   │                                   │
│  (10)    │  Title: ____________________      │
│          │                                   │
│ [Search] │  [Editor - TipTap]                │
│          │                                   │
│ Post 1   │                                   │
│ Post 2   │  [Publish] [Save Draft]          │
│ Post 3   │                                   │
│  [⋮]     │                                   │
└──────────┴───────────────────────────────────┘
```

---

## Success Metrics & KPIs

### North Star Metric
**Time to First Published Post** - Target: <60 seconds from sign-in

### Phase 1 Metrics (Current)
- ✅ Users can publish first post quickly
- ✅ Edit/delete functionality works reliably
- ✅ GitHub commits succeed consistently
- ✅ Works on Chrome, Firefox, Safari

### Key Metrics (Targets for 6 Months)
- **Activation:** % of users who publish first post within 24 hours (Target: >80%)
- **Retention:** Weekly active users (Target: >60% of registered users)
- **Reliability:** Successful publish rate (Target: >99.5%)
- **Simplicity:** Support requests per 100 users (Target: <5)
- **Delight:** NPS score (Target: >70)

### Business Metrics (1 Year Post-Launch)
- 1,000+ registered users
- 500+ active users (posted in last 30 days)
- $2K+ MRR (400 paid users @ $5/mo)
- NPS > 50

### Anti-Metrics (What NOT to optimize for)
- Feature count - More features ≠ better product
- Configuration options - More choices ≠ better UX
- Technical capabilities - Power ≠ usability

---

## Competitive Differentiation

### vs. WordPress
- **StaticPress:** Zero setup, zero maintenance, zero security updates
- **WordPress:** Installation, hosting, plugins, security patches, updates

### vs. Medium
- **StaticPress:** Own your content, own your domain, no lock-in
- **Medium:** Platform risk, paywalls, limited customization

### vs. Hugo + GitHub
- **StaticPress:** Beautiful UI, zero technical knowledge needed
- **Hugo CLI:** Command line, YAML, Git, technical complexity

### vs. Ghost
- **StaticPress:** Free (besides hosting), static = fast + secure
- **Ghost:** $9-$300/mo, dynamic = slow + attack surface

### vs. Competitors

| Product | Type | Pricing | Pros | Cons |
|---------|------|---------|------|------|
| Forestry.io | Git-based CMS | Discontinued | Great UX | No longer maintained |
| Netlify CMS | Open source | Free | Free, flexible | Complex setup, poor UX |
| CloudCannon | Commercial CMS | $45/mo | Full-featured | Expensive, complex |
| Front Matter CMS | VS Code ext | Free | Free, local | Requires VS Code |
| Tina CMS | Git-based CMS | $29/mo | Modern, good UX | Expensive, complex |

**Market Gap:** No simple, affordable ($5-10/mo) web-based editor for Hugo that "just works."

---

## Pricing Model & Packaging

### Tier Strategy: Free-First Adoption → Gentle Upgrades

**Rationale:** Free drives top-of-funnel; Personal unlocks media + removes friction for serious writers; SMB adds branding (domain + theme); Pro offers multi-site leverage for agencies/freelancers.

| Tier | Price | Who it's for | Key Limits & Features |
|---|---:|---|---|
| **Free** | $0 | Curious solo writers, devs kicking the tires | **Text-only** blogging; Edit **last 5 posts** only; 1 repo; Default theme; GitHub commits (manual hosting setup) |
| **Personal** | **$2.50/mo** or **$20/yr** | Individual bloggers who need images | **All posts** editable; **Images** enabled; 1 repo; Categories/tags; Preview |
| **SMB** | **$5/mo** or **$50/yr** | Small orgs needing professional branding | Personal + **Custom domain setup** + **Theme gallery** (5-8 curated themes); 1 repo |
| **Pro** | **$10/mo** or **$100/yr** | Freelancers/agencies managing multiple sites | SMB features; **Up to 5 blogs/repos** under one account |

### Feature→Tier Mapping

| Capability | Free | Personal | SMB | Pro |
|---|:--:|:--:|:--:|:--:|
| Write & publish (Hugo) | ✅ | ✅ | ✅ | ✅ |
| One-click deploy (Cloudflare/Vercel/Netlify) | ✅ | ✅ | ✅ | ✅ |
| Edit all posts | ⛔ (last 5 only) | ✅ | ✅ | ✅ |
| Images (upload, insert) | ⛔ | ✅ | ✅ | ✅ |
| Categories & Tags | ✅ | ✅ | ✅ | ✅ |
| Preview before publish | ✅ | ✅ | ✅ | ✅ |
| Theme gallery (curated Hugo themes) | ⛔ | ⛔ | ✅ | ✅ |
| Custom domain guided setup | ⛔ | ⛔ | ✅ | ✅ |
| Sites per account | 1 | 1 | 1 | **5** |

### Support Model
**Community-only for all tiers** - No 1:1 support; no SLA. Bug reports accepted via GitHub. Task-based docs, troubleshooting trees, public forum (GitHub Discussions or Discourse).

---

## Development Roadmap & Status

### Phase 1: MVP ✅ (COMPLETE - Weeks 1-8)

**Week 1-2: Foundation** ✅
- ✅ Set up Next.js project with TypeScript
- ✅ Configure Tailwind CSS
- ✅ Set up Supabase (Postgres)
- ✅ Implement NextAuth with GitHub OAuth
- ✅ Create basic layout/navigation

**Week 3-4: Core Features** ✅
- ✅ Build post browser component
- ✅ Implement GitHub file tree fetching
- ✅ Create TipTap editor component
- ✅ HTML-to-Markdown conversion

**Week 5-6: Publishing** ✅
- ✅ Frontmatter management
- ✅ Hugo file structure logic
- ✅ GitHub commit/push functionality
- ✅ Delete functionality

**Week 7-8: Polish & Testing** ✅
- ✅ Error handling & validation
- ✅ Loading states & UX polish
- ✅ Deployment to Vercel
- ✅ Production testing

### Phase 2: Paywall Gates + Personal Tier (CURRENT - Weeks 1-2)

**Goal:** Implement free tier limits + unlock Personal tier ($2.50/mo) for image support and unlimited post editing

**Week 1: Paywall Infrastructure**
- [ ] Implement "edit last 5 posts" limit on Free tier
- [ ] Create subscription/tier management in database
- [ ] Stripe integration for payments
- [ ] Personal tier unlock flow
- [ ] Upgrade prompts (when hitting limits)
- [ ] Server-side event logging (oauth_completed, repo_bound, first_publish, etc.)

**Week 2: Personal Tier Features**
- [ ] Images feature (Personal tier only)
  - [ ] Image upload button in editor
  - [ ] Drag-and-drop support
  - [ ] GitHub API image upload to `/static/images/YYYY/MM/`
  - [ ] Auto-path generation
  - [ ] Image optimization (WebP conversion, size limits)
- [ ] Categories & Tags (free for all tiers)
  - [ ] Category/tag input fields
  - [ ] Autocomplete from existing
  - [ ] Frontmatter integration
- [ ] Preview (free for all tiers)
  - [ ] Markdown → HTML rendering
  - [ ] Preview modal/window
  - [ ] Basic styling
- [ ] Docs v1 + onboarding video
- [ ] **Soft Beta Launch:** 25-50 users from Hugo/Dev circles

**Success Metrics:**
- Free→Personal conversion: ≥6-10% within 30 days
- Image upload works reliably (no GitHub errors)
- TTFP remains <60 seconds

---

### Phase 3: SMB Tier Features (Weeks 3-4)

**Goal:** Add SMB tier ($5/mo) with custom domains + theme gallery

**Week 3: Custom Domain Setup (Cloudflare DNS)**
- [ ] Cloudflare DNS automation
  - [ ] Cloudflare API integration (zones list, record create/verify)
  - [ ] "Add domain" flow (user authenticates Cloudflare → select zone → auto-create records)
  - [ ] Domain verification UI
  - [ ] Error handling for DNS propagation
- [ ] One-click domain setup for Cloudflare Pages projects
- [ ] Guided DNS flow for non-Cloudflare users (checklist + verification)

**Week 4: Theme Gallery**
- [ ] Create 5-8 template repositories (Blowfish, PaperMod, Stack, Anatole, Terminal)
- [ ] Theme gallery UI (grid with screenshots, "Activate" button)
- [ ] Theme switching logic (create new repo from template + migrate content)
- [ ] Theme preview (static screenshots)
- [ ] Rollback safety
- [ ] **Public Beta:** "Show HN", Hugo forum, Dev.to, Reddit r/JAMstack

**Success Metrics:**
- Domain attach success rate: ≥85% on SMB/Pro
- Theme switching completes in <30 seconds
- Zero failed theme switches

---

### Phase 4: Pro Tier + Multi-Site (Weeks 5-6)

**Goal:** Launch Pro tier ($10/mo) with support for 5 repos/sites

**Week 5: Multi-Repository Support**
- [ ] Database schema for multi-repo config (per user)
- [ ] UI to switch between repos/sites
- [ ] Pro tier restriction (max 5 sites)
- [ ] Vercel domain attach & verify flow
- [ ] Pricing page + upgrade flows
- [ ] Referral MVP (1 month free for both)

**Week 6: GA Prep**
- [ ] Generic guided DNS flow for other registrars
- [ ] GA launch assets (Product Hunt, demo video, "Zero to blog in 60s" guide)
- [ ] Post-launch monitoring & tuning
- [ ] Outreach for showcases/case studies

**Success Metrics:**
- Pro tier adoption by agencies/freelancers
- Multi-repo switching works smoothly
- GA launch drives ≥500 signups in first week

---

### Phase 5: Post-Launch Polish & Growth (Weeks 7-8+)

**Week 7-8: GA Launch + Tuning**
- [ ] **GA Launch** (Product Hunt + blog posts + partner outreach)
- [ ] Post-launch docs updates
- [ ] Error copy improvements
- [ ] Funnel optimization based on analytics
- [ ] Community forum setup (GitHub Discussions or Discourse)

**Future (Weeks 9+):**
- [ ] Image library (browse previously uploaded images)
- [ ] Featured images for social sharing
- [ ] Simple analytics integration (Plausible/Simple Analytics)
- [ ] SEO essentials (auto-generate meta descriptions)
- [ ] Scheduled publishing
- [ ] Team collaboration (invite co-authors)

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| GitHub API rate limits | High | Medium | ✅ Cache aggressively (5 min), batch operations |
| Token security breach | Critical | Low | ✅ Encrypt tokens (Supabase), monitor access |
| User confusion with Git conflicts | Medium | High | Lock editing, show clear warnings |
| Competition launches similar | Medium | Medium | ✅ Speed to market, focus on UX simplicity |
| Hugo updates break compatibility | Low | Low | Pin Hugo version, test upgrades |
| Image storage limits (GitHub) | Medium | Medium | Plan for external storage (Phase 4+) |

---

## Open Questions & Decisions

### Resolved ✅
1. **Theme Management:** Simple Approach (themes in repo) vs Hugo Modules → **Simple Approach** ✅
2. **Database:** Vercel Postgres vs Supabase → **Supabase** ✅
3. **Repository Storage:** Cookies vs Database → **Database** ✅
4. **Caching Strategy:** Cache duration → **5 minutes** ✅

### To Be Decided
1. **Pricing Model:** Free tier limits? (Recommendation: 1 repo free, unlimited posts)
2. **Conflict Resolution:** Multiple users editing same post? (Recommendation: Last-write-wins with warning)
3. **Offline Support:** Support offline editing? (Recommendation: Phase 2+)
4. **Custom Domains:** Help setup or docs only? (Recommendation: Phase 5 with automation)
5. **Image Storage:** External service (Cloudinary/ImgIx) for image-heavy blogs? (Recommendation: Phase 4+)

---

## Non-Goals (What We Won't Build)

- Custom theme development tools
- Hugo configuration editor
- Git client features (branches, PRs, merge conflicts)
- Advanced analytics dashboard
- E-commerce features
- Multi-language blog support (maybe later)
- Built-in comments system (use external services like Disqus)
- Built-in newsletter features (use external services like Buttondown)
- Custom post types
- Database-backed content
- Server-side rendering
- Complex permissions/workflows (until Phase 5)

---

## User Feedback & Validation

### Problem Discovery Quotes

> "I just want to write. I don't want to think about folders, file names, or Git commands."
> — JMR, Physician Blogger (Product Creator)

> "Obsidian is too complex for my needs. I just need a text box and a publish button."
> — Potential User

### Success Stories (Target)
- "I published my first post in under a minute. This is exactly what I needed!"
- "Finally, Hugo blogging without the headache"
- "It's like WordPress, but my site loads in 200ms"

---

## Next Steps

### Immediate (Phase 2 - Week 9)
1. ✅ PRD merged and updated
2. [ ] Design image upload UI mockups
3. [ ] Implement image upload API endpoint
4. [ ] Add image button to TipTap toolbar
5. [ ] Test drag-and-drop functionality

### Short-term (Phase 2 - Weeks 10-12)
1. [ ] Complete image upload feature
2. [ ] Add categories/tags input
3. [ ] Implement preview functionality
4. [ ] User testing with 5-10 beta users
5. [ ] Bug fixes and polish

### Long-term (Phases 3-5)
1. [ ] Build theme template repositories
2. [ ] Create theme gallery
3. [ ] Implement site settings
4. [ ] Plan media library
5. [ ] Design hosting setup wizard

---

## Appendix

### Current Codebase Structure

```
/Users/jmr/dev/staticpress/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth config
│   │   ├── posts/
│   │   │   ├── route.ts                 # GET posts list
│   │   │   ├── publish/route.ts         # POST create/update
│   │   │   └── delete/route.ts          # POST delete
│   │   └── setup/route.ts               # Repository setup
│   ├── dashboard/page.tsx               # Main editor page
│   ├── setup/page.tsx                   # First-time setup
│   └── settings/page.tsx                # Settings page
├── components/
│   ├── dashboard-client.tsx             # Dashboard state mgmt
│   ├── editor.tsx                       # TipTap editor
│   └── file-browser.tsx                 # Post list/browser
├── lib/
│   ├── auth.ts                          # Auth utilities
│   ├── github.ts                        # GitHub API client
│   ├── supabase.ts                      # Supabase client
│   ├── cookies.ts                       # Cookie utilities
│   └── cache.ts                         # Caching utilities
└── types/
    └── next-auth.d.ts                   # NextAuth types
```

### Key Implementation Files

- **GitHub Integration:** `/Users/jmr/dev/staticpress/lib/github.ts:21` (GitHubClient class)
- **Posts API:** `/Users/jmr/dev/staticpress/app/api/posts/publish/route.ts:7`
- **Delete API:** `/Users/jmr/dev/staticpress/app/api/posts/delete/route.ts:7`
- **Dashboard:** `/Users/jmr/dev/staticpress/components/dashboard-client.tsx:14`
- **File Browser:** `/Users/jmr/dev/staticpress/components/file-browser.tsx:14`
- **Auth:** `/Users/jmr/dev/staticpress/lib/auth.ts`

---

## Conclusion

StaticPress fills a clear market gap: making static site blogging as simple as WordPress while maintaining all the benefits of static sites (performance, security, cost).

**Phase 1 is complete** - we have proven the core value proposition. Users can write and publish Hugo blog posts through a beautiful interface without ever thinking about Git, YAML, or file structures.

**Phase 2 is the next priority** - adding images, categories/tags, and preview functionality will make StaticPress feature-complete for real-world blogging while maintaining our "radical simplicity" mantra.

**Remember:** Simplicity is not simple to build, but it's worth it. Every feature must pass the "my mom could use this" test.

---

**Document Version:** 2.0 (Merged)
**Last Updated:** 2025-10-20
**Status:** Active Development - Phase 2 Planning
