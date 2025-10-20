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

  async getHugoPosts(owner: string, repo: string, contentPath: string = "content/posts"): Promise<HugoPost[]> {
    const posts: HugoPost[] = []

    async function traverseDirectory(path: string): Promise<void> {
      const contents = await this.getRepoContents(owner, repo, path)

      for (const item of contents) {
        if (item.type === "dir") {
          await traverseDirectory(item.path)
        } else if (item.type === "file" && (item.name.endsWith(".md") || item.name.endsWith(".markdown"))) {
          const content = await this.getFileContent(owner, repo, item.path)
          if (content) {
            const post = this.parseHugoPost(content, item.path)
            if (post) {
              posts.push(post)
            }
          }
        }
      }
    }

    await traverseDirectory.call(this, contentPath)
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
      title: frontmatter.title || slug,
      date: frontmatter.date || new Date().toISOString(),
      slug,
      content: bodyContent,
      path,
    }
  }
}
