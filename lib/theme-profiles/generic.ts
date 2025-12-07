import yaml from 'js-yaml'
import { ThemeProfile, PostData, escapeYaml, mergeExistingFrontmatter } from './types'

/**
 * Generic theme profile for unknown Hugo themes.
 *
 * Uses minimal, widely-compatible frontmatter and preserves
 * ALL existing frontmatter fields to prevent data loss.
 */
export const genericProfile: ThemeProfile = {
  id: 'generic',
  name: 'Generic Hugo Theme',
  repo: '',
  description: 'Basic Hugo frontmatter for unsupported themes. Preserves existing fields.',

  frontmatter: {
    featuredImageField: 'image',
    featuredImageIsNested: false,
    authorField: 'author',
    summaryField: 'summary',
  },

  config: {
    paramsTemplate: `[params]
  # Generic params - customize as needed`,
    requiredSections: ['markup.goldmark.renderer'],
  },

  generateFrontmatter: (data: PostData): string => {
    // Build managed fields with generic/standard field names
    const managedFields: Record<string, unknown> = {
      title: data.title,
      date: data.date,
      draft: data.draft,
    }

    if (data.summary) {
      managedFields.summary = data.summary
    }

    if (data.author) {
      managedFields.author = data.author
    }

    if (data.featuredImage) {
      managedFields.image = data.featuredImage
    }

    if (data.tags && data.tags.length > 0) {
      managedFields.tags = data.tags
    }

    if (data.categories && data.categories.length > 0) {
      managedFields.categories = data.categories
    }

    // Merge with existing frontmatter to preserve unknown fields
    const merged = mergeExistingFrontmatter(managedFields, data.existingFrontmatter)

    // Use js-yaml for proper serialization
    const yamlContent = yaml.dump(merged, {
      quotingType: '"',
      forceQuotes: false,
      lineWidth: -1, // Don't wrap lines
    })

    return `---\n${yamlContent}---`
  },

  validateConfig: (config: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    // Generic validation - just check for basic structure
    if (!config.includes('theme =')) {
      warnings.push('No theme specified in config')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled - HTML in markdown may not render')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: (blogName = 'My Blog', baseURL = 'https://example.org/'): string => `baseURL = "${baseURL}"
languageCode = "en-us"
title = "${escapeYaml(blogName)}"

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}
