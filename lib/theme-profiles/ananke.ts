import { ThemeProfile, PostData, escapeYaml } from './types'

export const anankeProfile: ThemeProfile = {
  id: 'ananke',
  name: 'Ananke',
  repo: 'https://github.com/theNewDynamic/gohugo-theme-ananke.git',
  description: 'Clean and simple. Official Hugo starter theme with great defaults.',

  frontmatter: {
    featuredImageField: 'featured_image',
    featuredImageIsNested: false,
    authorField: null,  // Ananke uses global author in config
    summaryField: 'description',
  },

  config: {
    paramsTemplate: `[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]`,
    requiredSections: ['markup.goldmark.renderer'],
  },

  generateFrontmatter: (data: PostData): string => {
    const lines = ['---']
    lines.push(`title: "${escapeYaml(data.title)}"`)
    lines.push(`date: ${data.date}`)
    lines.push(`draft: ${data.draft}`)

    if (data.summary) {
      lines.push(`description: "${escapeYaml(data.summary)}"`)
    }

    if (data.featuredImage) {
      lines.push(`featured_image: "${data.featuredImage}"`)
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
    // Ananke-specific: warn if nested author exists (should be simple string)
    if (config.includes('[params.author]')) {
      errors.push('Ananke requires simple author string in [params], not nested [params.author]')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled - images may not display correctly')
    }
    if (config.includes('theme = "PaperMod"') || config.includes('theme = "papermod"')) {
      errors.push('Config has wrong theme - expected ananke')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: (blogName = 'My Blog', baseURL = 'https://example.org/'): string => `baseURL = "${baseURL}"
languageCode = "en-us"
title = "${escapeYaml(blogName)}"
theme = "ananke"

[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}
