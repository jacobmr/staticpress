export interface PostData {
  title: string
  date: string
  draft: boolean
  content: string
  featuredImage?: string
  tags?: string[]
  categories?: string[]
  author?: string
  summary?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ThemeProfile {
  id: string
  name: string
  repo: string
  description: string

  // Frontmatter configuration
  frontmatter: {
    featuredImageField: string | null
    featuredImageIsNested: boolean
    authorField: string | null
    summaryField: string | null
  }

  // Config requirements
  config: {
    paramsTemplate: string
    requiredSections: string[]
  }

  // Functions
  generateFrontmatter: (data: PostData) => string
  validateConfig: (config: string) => ValidationResult
  getDefaultConfig: (blogName?: string, baseURL?: string) => string
}

/**
 * Helper to escape YAML string values
 */
export function escapeYaml(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
