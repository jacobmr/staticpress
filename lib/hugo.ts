import slugify from "slugify"
import yaml from "js-yaml"

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
 * Uses js-yaml for robust parsing of nested objects, multi-line strings, etc.
 */
export function parseHugoPost(fileContent: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  // Match YAML frontmatter between --- delimiters
  const yamlMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)

  if (!yamlMatch) {
    return { frontmatter: {}, content: fileContent }
  }

  try {
    const frontmatter = yaml.load(yamlMatch[1]) as Record<string, unknown>
    const content = fileContent.slice(yamlMatch[0].length).trim()
    return { frontmatter: frontmatter || {}, content }
  } catch (error) {
    // Log error but don't crash - return empty frontmatter
    console.error('Failed to parse YAML frontmatter:', error)
    return { frontmatter: {}, content: fileContent }
  }
}

/**
 * Extract first image URL from HTML content
 * Returns relative URLs for Hugo to handle with baseURL
 */
export function extractFirstImageUrl(htmlContent: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = htmlContent.match(imgRegex)

  if (match) {
    let imageUrl = match[1]

    // For GitHub raw URLs, convert to relative paths
    if (imageUrl.includes('raw.githubusercontent.com')) {
      const pathMatch = imageUrl.match(/\/main\/static(\/images\/.+)/)
      if (pathMatch) {
        imageUrl = pathMatch[1]
      }
    }

    // Only return relative URLs (skip external images)
    if (imageUrl.startsWith('/')) {
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

// Krems-specific functions

/**
 * Generate Krems file path - just slug.md in root
 */
export function generateKremsPath(title: string): string {
  const slug = generateSlug(title)
  return `${slug}.md`
}

/**
 * Krems frontmatter interface (no draft support)
 */
export interface KremsFrontmatter {
  title: string
  date?: string
  tags?: string[]
  [key: string]: unknown
}

/**
 * Generate YAML frontmatter for Krems
 * Krems doesn't support draft mode, so we omit that field
 */
export function generateKremsFrontmatter(data: KremsFrontmatter): string {
  const lines = ["---"]

  // Title (required)
  lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`)

  // Date (ISO format)
  if (data.date) {
    lines.push(`date: ${data.date}`)
  } else {
    lines.push(`date: ${new Date().toISOString()}`)
  }

  // Tags
  if (data.tags && data.tags.length > 0) {
    lines.push("tags:")
    data.tags.forEach((tag) => {
      lines.push(`  - "${tag.replace(/"/g, '\\"')}"`)
    })
  }

  // Any other custom fields (but not draft)
  Object.keys(data).forEach((key) => {
    if (!["title", "date", "tags", "draft"].includes(key)) {
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
