# StaticPress Setup Guide

## What We've Built

StaticPress is now set up with the core foundation! Here's what's complete:

### ✅ Completed Features

1. **Next.js Application**
   - TypeScript + Tailwind CSS
   - App Router architecture
   - Development server running at http://localhost:3000

2. **Authentication (NextAuth.js)**
   - GitHub OAuth integration
   - Protected routes (dashboard requires login)
   - Session management with access tokens

3. **Landing Page**
   - Professional homepage with product description
   - "Sign in with GitHub" button
   - Feature highlights

4. **Dashboard Layout**
   - Header with user info and sign-out
   - Sidebar for file browser (placeholder)
   - Main editor area with title/content fields

5. **Core Libraries**
   - **GitHub API Client** (`lib/github.ts`):
     - List repositories
     - Read/write files
     - Parse Hugo posts
     - Create commits

   - **Hugo Utilities** (`lib/hugo.ts`):
     - Generate slugs from titles
     - Create proper file paths (content/posts/YYYY/MM/slug.md)
     - Generate YAML frontmatter
     - Parse existing posts
     - Auto-generate commit messages

## Setup Instructions

### Step 1: Create GitHub OAuth App

A browser window should have opened to: https://github.com/settings/applications/new

Fill in these values:

```
Application name: StaticPress (Development)
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
```

After creating the app, you'll get a **Client ID** and need to generate a **Client Secret**.

### Step 2: Configure Environment Variables

Edit the file: `/Users/jmr/dev/staticpress/.env.local`

Replace the empty values with your GitHub OAuth credentials:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=V2B31bB3SygTu0NVKiWrmAJyla3MrAdzraLsneXJvZ4=

GITHUB_ID=your-client-id-here
GITHUB_SECRET=your-client-secret-here
```

### Step 3: Restart the Development Server

The server is already running, but you'll need to restart it after adding the OAuth credentials:

```bash
# The current server will pick up the changes automatically
# Just visit http://localhost:3000 and try signing in
```

## Testing the App

1. Open http://localhost:3000
2. Click "Sign in with GitHub"
3. Authorize the app
4. You should be redirected to the dashboard

## What's Next

To complete the MVP, we still need to build:

### TODO: Remaining Features

1. **TipTap WYSIWYG Editor**
   - Replace the textarea placeholder with a rich text editor
   - Bold, italic, links, headings
   - Converts to clean HTML

2. **File Browser Component**
   - Show list of existing posts from GitHub
   - Click to edit existing posts
   - "New Post" button

3. **Repository Selector**
   - Dropdown to select which GitHub repository to work with
   - Save selected repo in session/cookies

4. **Publish Functionality**
   - Wire up the "Publish" button
   - Create/update files in GitHub
   - Auto-generate Hugo file paths
   - Commit and push changes

5. **Post List**
   - Fetch and display existing Hugo posts
   - Sort by date
   - Search/filter

## Project Structure

```
/Users/jmr/dev/staticpress/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Main editor dashboard
│   ├── api/auth/[...nextauth]/     # NextAuth API route
│   └── layout.tsx                  # Root layout
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   ├── github.ts                   # GitHub API client
│   └── hugo.ts                     # Hugo utility functions
├── types/
│   └── next-auth.d.ts              # TypeScript definitions
├── .env.local                      # Environment variables (needs OAuth creds)
└── package.json                    # Dependencies
```

## Key Commands

```bash
# Start development server
cd /Users/jmr/dev/staticpress
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Git Repository

Local repository initialized at: `/Users/jmr/dev/staticpress/.git`

To push to GitHub:
```bash
gh repo create staticpress --public --source=. --remote=origin
git push -u origin main
```

## Notes

- The NextAuth secret has been generated for you (already in .env.local)
- All Hugo utility functions follow the file structure: `content/posts/YYYY/MM/slug.md`
- GitHub API client automatically handles base64 encoding for file contents
- The app uses server-side rendering for authentication (no client-side exposed secrets)

## Need Help?

The app is running at: http://localhost:3000

Once you've added the GitHub OAuth credentials to `.env.local`, you're ready to test the sign-in flow!
