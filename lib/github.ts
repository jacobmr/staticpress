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
    sha?: string
  ) {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
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
