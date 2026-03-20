# StaticPress - Project Runbook

## Overview

StaticPress is a web-based WYSIWYG editor for Hugo and Krems static site blogs with GitHub integration. Users authenticate via GitHub OAuth, connect their Hugo/Krems repository, and can create/edit posts through a clean interface.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Editor**: TipTap (ProseMirror-based)
- **Auth**: NextAuth.js v5 (GitHub OAuth)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe (subscription tiers)
- **Integrations**: GitHub API via Octokit

## Key Features

- GitHub OAuth authentication
- Repository connection/creation
- WYSIWYG post editing with markdown conversion
- Hugo and Krems blog engine support
- GitHub Pages deployment
- Subscription tiers (Free, Personal, SMB, Pro)

## Current Status

- Core functionality implemented
- Stripe integration complete
- Deployment workflow functional

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm test         # Run unit tests
npm run test:e2e # Run e2e tests
```

---

_Last updated by BMad Master_
