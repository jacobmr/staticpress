import slugify from "slugify"

export interface HugoFrontmatter {
  title: string
  date?: string
  draft?: boolean
  tags?: string[]
  categories?: string[]
  [key: string]: unknown
}

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  })
}

/**
 * Generate Hugo file path following the convention:
 * content/posts/YYYY/MM/slug.md
 */
export function generateHugoPath(title: string, date: Date = new Date()): string {
  const slug = generateSlug(title)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  return `content/posts/${year}/${month}/${slug}.md`
}

/**
 * Generate YAML frontmatter for Hugo
 */
export function generateFrontmatter(data: HugoFrontmatter): string {
  const lines = ["---"]

  // Title (required)
  lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`)

  // Date (ISO format)
  if (data.date) {
    lines.push(`date: ${data.date}`)
  } else {
    lines.push(`date: ${new Date().toISOString()}`)
  }

  // Draft status
  if (data.draft !== undefined) {
    lines.push(`draft: ${data.draft}`)
  }

  // Tags
  if (data.tags && data.tags.length > 0) {
    lines.push("tags:")
    data.tags.forEach((tag) => {
      lines.push(`  - "${tag.replace(/"/g, '\\"')}"`)
    })
  }

  // Categories
  if (data.categories && data.categories.length > 0) {
    lines.push("categories:")
    data.categories.forEach((category) => {
      lines.push(`  - "${category.replace(/"/g, '\\"')}"`)
    })
  }

  // Any other custom fields
  Object.keys(data).forEach((key) => {
    if (!["title", "date", "draft", "tags", "categories"].includes(key)) {
      const value = data[key]
      if (typeof value === "string") {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`)
      } else if (typeof value === "number" || typeof value === "boolean") {
        lines.push(`${key}: ${value}`)
      } else if (Array.isArray(value)) {
        lines.push(`${key}:`)
        value.forEach((item) => {
          lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`)
        })
      }
    }
  })

  lines.push("---")
  return lines.join("\n")
}

/**
 * Create complete Hugo markdown file content
 */
export function createHugoPost(frontmatter: HugoFrontmatter, content: string): string {
  const front = generateFrontmatter(frontmatter)
  return `${front}\n\n${content}\n`
}

/**
 * Parse Hugo post to extract frontmatter and content
 */
export function parseHugoPost(fileContent: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  const yamlMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)

  const frontmatter: Record<string, unknown> = {}
  let content = fileContent

  if (yamlMatch) {
    const yamlContent = yamlMatch[1]
    content = fileContent.slice(yamlMatch[0].length).trim()

    // Simple YAML parser
    const lines = yamlContent.split("\n")
    let currentKey = ""
    let currentArray: string[] = []

    lines.forEach((line) => {
      if (line.trim().startsWith("- ")) {
        // Array item
        const item = line.trim().slice(2).replace(/^["']|["']$/g, "")
        currentArray.push(item)
      } else {
        // Save previous array if exists
        if (currentKey && currentArray.length > 0) {
          frontmatter[currentKey] = currentArray
          currentArray = []
        }

        const colonIndex = line.indexOf(":")
        if (colonIndex > 0) {
          currentKey = line.slice(0, colonIndex).trim()
          let value = line.slice(colonIndex + 1).trim()

          if (value) {
            // Remove quotes and unescape
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1)
              // Unescape backslash-escaped characters
              value = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            }

            // Parse booleans
            if (value === "true") {
              frontmatter[currentKey] = true
            } else if (value === "false") {
              frontmatter[currentKey] = false
            } else {
              frontmatter[currentKey] = value
            }
            currentKey = ""
          }
        }
      }
    })

    // Save final array if exists
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray
    }
  }

  return { frontmatter, content }
}

/**
 * Extract first image URL from HTML content
 * Only returns docnotes.net images (Hugo theme can't resize external URLs)
 */
export function extractFirstImageUrl(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = htmlContent.match(imgRegex)

  if (match) {
    let imageUrl = match[1]

    // Convert relative URLs to absolute URLs
    if (imageUrl.startsWith('/')) {
      imageUrl = `https://docnotes.net${imageUrl}`
    }

    // Only return docnotes.net images (Hugo theme can't handle external URLs)
    if (imageUrl.includes('docnotes.net') || imageUrl.startsWith('/')) {
      return imageUrl
    }
  }

  return null
}

/**
 * Generate commit message for Hugo post
 */
export function generateCommitMessage(action: "create" | "update" | "delete", title: string): string {
  const actionMap = {
    create: "Add",
    update: "Update",
    delete: "Delete",
  }

  return `${actionMap[action]} post: ${title}`
}
