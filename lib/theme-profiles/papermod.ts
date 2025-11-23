import { ThemeProfile, PostData, escapeYaml } from './types'

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
    const lines = ['---']
    lines.push(`title: "${escapeYaml(data.title)}"`)
    lines.push(`date: ${data.date}`)
    lines.push(`draft: ${data.draft}`)

    if (data.summary) {
      lines.push(`summary: "${escapeYaml(data.summary)}"`)
    }

    if (data.author) {
      lines.push(`author: "${escapeYaml(data.author)}"`)
    }

    if (data.featuredImage) {
      lines.push('cover:')
      lines.push(`  image: "${data.featuredImage}"`)
      lines.push(`  alt: "${escapeYaml(data.title)}"`)
      lines.push('  hidden: false')
    }

    if (data.tags && data.tags.length > 0) {
      lines.push('tags:')
      data.tags.forEach(tag => lines.push(`  - "${escapeYaml(tag)}"`))
    }

    if (data.categories && data.categories.length > 0) {
      lines.push('categories:')
      data.categories.forEach(cat => lines.push(`  - "${escapeYaml(cat)}"`))
    }

    lines.push('---')
    return lines.join('\n')
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
