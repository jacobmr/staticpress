import { describe, it, expect } from 'vitest'
import { anankeProfile } from '../ananke'

describe('Ananke Theme Profile', () => {
  describe('generateFrontmatter', () => {
    it('generates correct frontmatter with featured image', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        featuredImage: '/images/test.jpg',
      }

      const result = anankeProfile.generateFrontmatter(data)

      expect(result).toContain('title: "Test Post"')
      expect(result).toContain('featured_image: "/images/test.jpg"')
      expect(result).toContain('draft: false')
      // Should NOT have nested cover object like PaperMod
      expect(result).not.toContain('cover:')
    })

    it('uses description field for summary', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        summary: 'This is a summary',
      }

      const result = anankeProfile.generateFrontmatter(data)

      expect(result).toContain('description: "This is a summary"')
      // Should NOT use summary field name
      expect(result).not.toContain('summary:')
    })

    it('does not include author in frontmatter', () => {
      const data = {
        title: 'Test Post',
        date: '2024-01-15T10:00:00Z',
        draft: false,
        content: 'Test content',
        author: 'John Doe',
      }

      const result = anankeProfile.generateFrontmatter(data)

      // Ananke uses global author in config, not per-post
      expect(result).not.toContain('author:')
    })
  })

  describe('validateConfig', () => {
    it('returns valid for correct config', () => {
      const config = `
baseURL = "https://example.org/"
theme = "ananke"

[params]
  author = "Test Author"

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`
      const result = anankeProfile.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error for nested author params', () => {
      const config = `
[params]
  [params.author]
    name = "Test"
`
      const result = anankeProfile.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('nested'))).toBe(true)
    })

    it('returns error for wrong theme', () => {
      const config = `
theme = "PaperMod"
[params]
  test = true
`
      const result = anankeProfile.validateConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('wrong theme'))).toBe(true)
    })
  })

  describe('getDefaultConfig', () => {
    it('generates valid default config', () => {
      const config = anankeProfile.getDefaultConfig('My Blog', 'https://myblog.com/')

      expect(config).toContain('title = "My Blog"')
      expect(config).toContain('baseURL = "https://myblog.com/"')
      expect(config).toContain('theme = "ananke"')
      expect(config).toContain('author = "StaticPress User"')
      expect(config).toContain('unsafe = true')
    })
  })
})
