import yaml from 'js-yaml'
import { ThemeProfile, PostData, escapeYaml, mergeExistingFrontmatter } from './types'

export const papermodProfile: ThemeProfile = {
  id: 'papermod',
  name: 'PaperMod',
  repo: 'https://github.com/adityatelange/hugo-PaperMod.git',
  description: 'Modern, fast, and feature-rich. Ideal for blogs and portfolios.',

  frontmatter: {
    featuredImageField: 'cover.image',
    featuredImageIsNested: true,
    authorField: 'author',
    summaryField: 'summary',
  },

  config: {
    paramsTemplate: `[params]
  defaultTheme = "auto"
  ShowReadingTime = true
  ShowShareButtons = false
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true

[params.cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false`,
    requiredSections: ['markup.goldmark.renderer'],
  },

  generateFrontmatter: (data: PostData): string => {
    // Build managed fields with PaperMod-specific structure
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
      managedFields.cover = {
        image: data.featuredImage,
        alt: data.title,
        hidden: false,
      }
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
      lineWidth: -1,
    })

    return `---\n${yamlContent}---`
  },

  validateConfig: (config: string) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.includes('[params]')) {
      errors.push('Missing [params] section')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled - images may not display correctly')
    }
    if (config.includes('theme = "ananke"')) {
      errors.push('Config has wrong theme - expected PaperMod')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: (blogName = 'My Blog', baseURL = 'https://example.org/'): string => `baseURL = "${baseURL}"
languageCode = "en-us"
title = "${escapeYaml(blogName)}"
theme = "PaperMod"

[params]
  defaultTheme = "auto"
  ShowReadingTime = true
  ShowShareButtons = false
  ShowPostNavLinks = true
  ShowBreadCrumbs = true
  ShowCodeCopyButtons = true

[params.cover]
  hidden = false
  hiddenInList = false
  hiddenInSingle = false

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}
