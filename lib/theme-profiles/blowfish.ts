import { ThemeProfile, PostData, escapeYaml } from './types'

export const blowfishProfile: ThemeProfile = {
  id: 'blowfish',
  name: 'Blowfish',
  repo: 'https://github.com/nunocoracao/blowfish.git',
  description: 'Powerful, lightweight theme with dark mode and extensive customization.',

  frontmatter: {
    featuredImageField: 'featureimage',
    featuredImageIsNested: false,
    authorField: 'authors',
    summaryField: 'summary',
  },

  config: {
    paramsTemplate: `[params]
  defaultAppearance = "dark"
  autoSwitchAppearance = true
  enableSearch = true
  enableCodeCopy = true

[params.homepage]
  layout = "profile"
  showRecent = true`,
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
      lines.push('authors:')
      lines.push(`  - "${escapeYaml(data.author)}"`)
    }

    if (data.featuredImage) {
      lines.push(`featureimage: "${data.featuredImage}"`)
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

    if (!config.includes('theme = "blowfish"')) {
      errors.push('Config should have theme = "blowfish"')
    }
    if (!config.includes('unsafe = true')) {
      warnings.push('Goldmark unsafe rendering not enabled - HTML in markdown may not render')
    }

    return { valid: errors.length === 0, errors, warnings }
  },

  getDefaultConfig: (blogName = 'My Blog', baseURL = 'https://example.org/'): string => `baseURL = "${baseURL}"
languageCode = "en-us"
title = "${escapeYaml(blogName)}"
theme = "blowfish"

enableRobotsTXT = true
enableEmoji = true

[params]
  defaultAppearance = "dark"
  autoSwitchAppearance = true
  enableSearch = true
  enableCodeCopy = true

[params.homepage]
  layout = "profile"
  showRecent = true

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
}
