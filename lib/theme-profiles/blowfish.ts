import yaml from 'js-yaml'
import { ThemeProfile, PostData, escapeYaml, mergeExistingFrontmatter } from './types'

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
    // Build managed fields with Blowfish-specific structure
    const managedFields: Record<string, unknown> = {
      title: data.title,
      date: data.date,
      draft: data.draft,
    }

    if (data.summary) {
      managedFields.summary = data.summary
    }

    if (data.author) {
      managedFields.authors = [data.author]
    }

    if (data.featuredImage) {
      managedFields.featureimage = data.featuredImage
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
