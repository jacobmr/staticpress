import { describe, it, expect } from 'vitest'
import { papermodProfile } from '../papermod'

describe('PaperMod Theme Profile', () => {
  describe('generateFrontmatter', () => {
    it('generates correct frontmatter with featured image', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        featuredImage: '/images/test.jpg',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).toContain('title: "Test Post"')
      expect(result).toContain('cover:')
      expect(result).toContain('  image: "/images/test.jpg"')
      expect(result).toContain('draft: false')
      expect(result).toContain('---')
    })

    it('escapes quotes in title', () => {
      const data = {
        title: 'Test "Quoted" Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).toContain('title: "Test \\"Quoted\\" Post"')
    })

    it('generates frontmatter without featured image', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: true,
        content: 'Test content',
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).not.toContain('cover:')
      expect(result).toContain('draft: true')
    })

    it('includes tags and categories', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        tags: ['javascript', 'react'],
        categories: ['tutorials'],
      }

      const result = papermodProfile.generateFrontmatter(data)

      expect(result).toContain('tags:')
      expect(result).toContain('  - "javascript"')
      expect(result).toContain('  - "react"')
      expect(result).toContain('categories:')
      expect(result).toContain('  - "tutorials"')
    })
  })

  describe('validateConfig', () => {
    it('returns valid for correct config', () => {
      const config = `
baseURL = "https://example.org/"
theme = "PaperMod"

[params]
  defaultTheme = "auto"

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
      const result = papermodProfile.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error for missing params', () => {
      const config = `
baseURL = "https://example.org/"
theme = "PaperMod"
`
      const result = papermodProfile.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing [params] section')
    })

    it('returns warning for missing unsafe markup', () => {
      const config = `
[params]
  defaultTheme = "auto"
`
      const result = papermodProfile.validateConfig(config)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('unsafe')
    })
  })

  describe('getDefaultConfig', () => {
    it('generates valid default config', () => {
      const config = papermodProfile.getDefaultConfig('My Blog', 'https://myblog.com/')

      expect(config).toContain('title = "My Blog"')
      expect(config).toContain('baseURL = "https://myblog.com/"')
      expect(config).toContain('theme = "PaperMod"')
      expect(config).toContain('[params]')
      expect(config).toContain('unsafe = true')
    })
  })
})
