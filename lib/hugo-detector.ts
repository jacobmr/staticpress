import TOML from '@iarna/toml'
import { GitHubClient } from './github'
import { logger } from './logger'
import { isThemeSupported, getSupportedThemeIds } from './theme-profiles'

export interface HugoSiteConfig {
  isHugoSite: boolean
  configPath?: string           // e.g., "hugo.toml" or "config/_default/hugo.toml"
  theme?: string                // detected theme name
  themeSupported: boolean       // whether we have a profile for this theme
  contentPath?: string          // e.g., "content/posts"
  baseURL?: string
  title?: string
  errors: string[]
  warnings: string[]
}

interface TomlConfig {
  theme?: string
  baseURL?: string
  title?: string
  params?: {
    mainSections?: string[]
  }
  [key: string]: unknown
}

// Common Hugo config file locations in order of preference
const CONFIG_PATHS = [
  'hugo.toml',
  'config.toml',
  'config/_default/hugo.toml',
  'config/_default/config.toml',
]

// Common content directory patterns
const CONTENT_PATHS = [
  'content/posts',
  'content/post',
  'content/blog',
  'content/articles',
  'posts',
]

/**
 * Detect if a repository is a Hugo site and extract its configuration
 */
export async function detectHugoSite(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<HugoSiteConfig> {
  const result: HugoSiteConfig = {
    isHugoSite: false,
    themeSupported: false,
    errors: [],
    warnings: [],
  }

  try {
    // Step 1: Find and parse Hugo config file
    const configResult = await findAndParseConfig(github, owner, repo)

    if (configResult.config) {
      result.isHugoSite = true
      result.configPath = configResult.path ?? undefined
      result.theme = configResult.config.theme
      result.baseURL = configResult.config.baseURL
      result.title = configResult.config.title

      // Check if theme is supported
      if (result.theme) {
        result.themeSupported = isThemeSupported(result.theme)
        if (!result.themeSupported) {
          const supported = getSupportedThemeIds().join(', ')
          result.warnings.push(
            `Theme "${result.theme}" is not fully supported. ` +
            `Supported themes: ${supported}. ` +
            `StaticPress will use a generic profile that preserves your existing frontmatter.`
          )
        }
      } else {
        result.warnings.push('No theme specified in config. StaticPress will use a generic profile.')
      }

      // Try to detect content path from mainSections
      if (configResult.config.params?.mainSections?.length) {
        const mainSection = configResult.config.params.mainSections[0]
        result.contentPath = `content/${mainSection}`
      }
    }

    // Step 2: If no config found, check for Hugo directory structure
    if (!result.isHugoSite) {
      const hasHugoStructure = await checkHugoStructure(github, owner, repo)
      if (hasHugoStructure) {
        result.isHugoSite = true
        result.warnings.push('Hugo config file not found. Using default settings.')
      }
    }

    // Step 3: Detect content path if not already found
    if (result.isHugoSite && !result.contentPath) {
      const detectedPath = await detectContentPath(github, owner, repo)
      result.contentPath = detectedPath ?? undefined
      if (!result.contentPath) {
        result.contentPath = 'content/posts' // Default
        result.warnings.push('Could not detect content path. Using default: content/posts')
      }
    }

    // Step 4: Try to detect theme from themes/ directory if not in config
    if (result.isHugoSite && !result.theme) {
      const detectedTheme = await detectThemeFromDirectory(github, owner, repo)
      if (detectedTheme) {
        result.theme = detectedTheme
        result.themeSupported = isThemeSupported(detectedTheme)
      }
    }

    // Final validation
    if (!result.isHugoSite) {
      result.errors.push('This does not appear to be a Hugo site. No hugo.toml or config.toml found.')
    }

  } catch (error) {
    logger.error('Error detecting Hugo site', {
      error: error instanceof Error ? error.message : 'Unknown error',
      owner,
      repo,
    })
    result.errors.push(`Detection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Find and parse the Hugo config file
 */
async function findAndParseConfig(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<{ config: TomlConfig | null; path: string | null }> {

  for (const configPath of CONFIG_PATHS) {
    try {
      const content = await github.getFileContent(owner, repo, configPath)
      if (content) {
        const config = TOML.parse(content) as TomlConfig
        logger.info('Found Hugo config', { path: configPath, theme: config.theme })
        return { config, path: configPath }
      }
    } catch {
      // Config file not found at this path, try next
      continue
    }
  }

  return { config: null, path: null }
}

/**
 * Check for Hugo directory structure (themes/, content/, layouts/)
 */
async function checkHugoStructure(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const contents = await github.getRepoContents(owner, repo, '')
    const dirNames = contents
      .filter(item => typeof item === 'object' && 'type' in item && item.type === 'dir')
      .map(item => ('name' in item ? item.name.toLowerCase() : ''))

    // Hugo sites typically have content/ and either themes/ or layouts/
    const hasContent = dirNames.includes('content')
    const hasThemes = dirNames.includes('themes')
    const hasLayouts = dirNames.includes('layouts')

    return hasContent && (hasThemes || hasLayouts)
  } catch {
    return false
  }
}

/**
 * Detect the content path by checking common locations
 */
async function detectContentPath(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<string | null> {

  for (const contentPath of CONTENT_PATHS) {
    try {
      const contents = await github.getRepoContents(owner, repo, contentPath)
      if (contents && contents.length > 0) {
        logger.info('Detected content path', { contentPath })
        return contentPath
      }
    } catch {
      // Path doesn't exist, try next
      continue
    }
  }

  return null
}

/**
 * Try to detect theme from themes/ directory (git submodule or direct)
 */
async function detectThemeFromDirectory(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const contents = await github.getRepoContents(owner, repo, 'themes')
    if (contents && contents.length > 0) {
      // Return the first theme directory found
      const themeDir = contents.find(
        item => typeof item === 'object' && 'type' in item && (item.type === 'dir' || item.type === 'submodule')
      )
      if (themeDir && 'name' in themeDir) {
        logger.info('Detected theme from directory', { theme: themeDir.name })
        return themeDir.name
      }
    }
  } catch {
    // themes/ directory doesn't exist
  }

  return null
}

/**
 * Quick check if a repo looks like a Hugo site (for filtering repo lists)
 */
export async function isLikelyHugoSite(
  github: GitHubClient,
  owner: string,
  repo: string
): Promise<boolean> {
  // Quick check: just look for hugo.toml or config.toml
  for (const configPath of ['hugo.toml', 'config.toml']) {
    try {
      const sha = await github.getFileSha(owner, repo, configPath)
      if (sha) return true
    } catch {
      continue
    }
  }
  return false
}
