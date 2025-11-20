import { Octokit } from "octokit"

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  type: "file" | "dir"
  content?: string
}

export interface HugoPost {
  title: string
  date: string
  slug: string
  content: string
  path: string
}

export class GitHubClient {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  async getUserRepos() {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    })
    return data
  }

  async getRepoContents(owner: string, repo: string, path: string = "") {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })
      return Array.isArray(data) ? data : [data]
    } catch (error) {
      console.error(`Error fetching contents for ${path}:`, error)
      return []
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      })

      if (!Array.isArray(data) && data.type === "file" && data.content) {
        // Content is base64 encoded
        return Buffer.from(data.content, "base64").toString("utf-8")
      }
      return null
    } catch (error) {
      console.error(`Error fetching file ${path}:`, error)
      return null
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    isAlreadyBase64 = false
  ) {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: isAlreadyBase64 ? content : Buffer.from(content).toString("base64"),
        sha,
      })
      return data
    } catch (error) {
      console.error(`Error creating/updating file ${path}:`, error)
      throw error
    }
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string
  ) {
    try {
      const { data } = await this.octokit.rest.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
      })
      return data
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error)
      throw error
    }
  }

  async getAuthenticatedUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data
  }

  async createRepository(name: string, description: string, isPrivate: boolean = false) {
    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true, // Initialize with README to create main branch
      })
      return data
    } catch (error) {
      console.error(`Error creating repository ${name}:`, error)
      throw error
    }
  }

  // Helper to create file with retry for newly created repos
  private async createFileWithRetry(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    maxRetries: number = 5
  ) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.createOrUpdateFile(owner, repo, path, content, message)
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        // Wait with exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, attempt - 1) * 1000
        console.log(`Retry ${attempt}/${maxRetries} for ${path}, waiting ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  async initializeHugoProject(owner: string, repo: string, blogName: string) {
    // Use Git Data API for more reliable file creation in new repos

    // First, get the default branch and its latest commit
    const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch

    const { data: refData } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    })
    const latestCommitSha = refData.object.sha

    // Get the tree from the latest commit
    const { data: commitData } = await this.octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    })
    const baseTreeSha = commitData.tree.sha

    // Define all files to create
    const files = [
      {
        path: 'hugo.toml',
        content: `baseURL = "https://example.org/"
languageCode = "en-us"
title = "${blogName}"
theme = "ananke"

[params]
  author = "StaticPress User"
  description = "A blog created with StaticPress"
`,
      },
      {
        path: 'content/posts/.gitkeep',
        content: '',
      },
      {
        path: 'static/images/.gitkeep',
        content: '',
      },
      {
        path: 'content/posts/welcome.md',
        content: `---
title: "Welcome to My Blog"
date: "${new Date().toISOString()}"
draft: false
---

Welcome to your new blog powered by Hugo and StaticPress!

## Getting Started

This is your first post. You can edit it directly in StaticPress or create new posts.

### What's Next?

1. **Customize your theme** - Change the look and feel of your blog
2. **Write your first real post** - Share your thoughts with the world
3. **Deploy your site** - Publish to Cloudflare Pages, Vercel, or Netlify

Happy blogging!
`,
      },
      {
        path: '.github/workflows/hugo.yml',
        content: `name: Deploy Hugo site

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.128.0
    steps:
      - name: Install Hugo CLI
        run: |
          wget -O \${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v\${HUGO_VERSION}/hugo_extended_\${HUGO_VERSION}_linux-amd64.deb \\
          && sudo dpkg -i \${{ runner.temp }}/hugo.deb
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      - name: Install Node.js dependencies
        run: "[[ -f package-lock.json || -f npm-shrinkwrap.json ]] && npm ci || true"
      - name: Build with Hugo
        env:
          HUGO_CACHEDIR: \${{ runner.temp }}/hugo_cache
          HUGO_ENVIRONMENT: production
        run: |
          hugo \\
            --minify \\
            --baseURL "\${{ steps.pages.outputs.base_url }}/"
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`,
      },
    ]

    // Add README to files
    const readmeContent = `# ${blogName}

A blog built with [Hugo](https://gohugo.io) and managed by [StaticPress](https://staticpress.me).

## Setup

To build this site locally:

1. Install Hugo: https://gohugo.io/installation/
2. Clone this repository
3. Install the theme:
   \`\`\`bash
   git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke.git themes/ananke
   \`\`\`
4. Run \`hugo server\` to preview

## Deployment

This repository includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

You can also deploy to:
- [Cloudflare Pages](https://pages.cloudflare.com)
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
`
    files.push({ path: 'README.md', content: readmeContent })

    // Create blobs for all files
    const treeItems = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await this.octokit.rest.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        })
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        }
      })
    )

    // Create a new tree with all files
    const { data: newTree } = await this.octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeItems,
    })

    // Create a commit
    const { data: newCommit } = await this.octokit.rest.git.createCommit({
      owner,
      repo,
      message: 'Initialize Hugo project with StaticPress',
      tree: newTree.sha,
      parents: [latestCommitSha],
    })

    // Update the branch reference
    await this.octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha,
    })

    return true
  }

  async getHugoPosts(owner: string, repo: string, contentPath: string = "content/posts", limit: number = 10, maxDepth: number = 10): Promise<HugoPost[]> {
    const posts: HugoPost[] = []
    let count = 0

    const traverseDirectory = async (path: string, depth: number = 0): Promise<void> => {
      if (count >= limit || depth > maxDepth) return

      const contents = await this.getRepoContents(owner, repo, path)

      // Sort directories in reverse order (2025, 2024, etc.) to get recent posts first
      const sortedContents = contents.sort((a, b) => {
        // If both are directories, sort by name descending
        if (a.type === "dir" && b.type === "dir") {
          return b.name.localeCompare(a.name)
        }
        // Keep original order for files
        return 0
      })

      for (const item of sortedContents) {
        if (count >= limit) break

        if (item.type === "dir") {
          await traverseDirectory(item.path, depth + 1)
        } else if (item.type === "file" && (item.name.endsWith(".md") || item.name.endsWith(".markdown"))) {
          const content = await this.getFileContent(owner, repo, item.path)
          if (content) {
            const post = this.parseHugoPost(content, item.path)
            if (post) {
              posts.push(post)
              count++
            }
          }
        }
      }
    }

    await traverseDirectory(contentPath)
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  private parseHugoPost(content: string, path: string): HugoPost | null {
    // Parse frontmatter (YAML between --- or TOML between +++)
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)

    const frontmatter: Record<string, unknown> = {}
    let bodyContent = content

    if (yamlMatch) {
      const yamlContent = yamlMatch[1]
      bodyContent = content.slice(yamlMatch[0].length).trim()

      // Simple YAML parser (for basic key: value pairs)
      yamlContent.split("\n").forEach((line) => {
        const colonIndex = line.indexOf(":")
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim()
          let value = line.slice(colonIndex + 1).trim()
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          frontmatter[key] = value
        }
      })
    }

    const slug = path.split("/").pop()?.replace(/\.(md|markdown)$/, "") || ""

    return {
      title: (typeof frontmatter.title === 'string' ? frontmatter.title : null) || slug,
      date: (typeof frontmatter.date === 'string' ? frontmatter.date : null) || new Date().toISOString(),
      slug,
      content: bodyContent,
      path,
    }
  }
}
