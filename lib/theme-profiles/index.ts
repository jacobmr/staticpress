import { ThemeProfile } from './types'
import { papermodProfile } from './papermod'
import { anankeProfile } from './ananke'
import { blowfishProfile } from './blowfish'
import { genericProfile } from './generic'
import { logger } from '@/lib/logger'

export type { ThemeProfile, PostData, ValidationResult } from './types'
export { escapeYaml } from './types'
export { papermodProfile } from './papermod'
export { anankeProfile } from './ananke'
export { blowfishProfile } from './blowfish'
export { genericProfile } from './generic'

// Registry of supported themes
const profileRegistry = new Map<string, ThemeProfile>([
  ['papermod', papermodProfile],
  ['PaperMod', papermodProfile],  // Case-insensitive lookup
  ['ananke', anankeProfile],
  ['Ananke', anankeProfile],
  ['blowfish', blowfishProfile],
  ['Blowfish', blowfishProfile],
  ['generic', genericProfile],
])

/**
 * Get theme profile by ID
 * Falls back to generic profile for unknown themes (preserves all existing frontmatter)
 */
export function getThemeProfile(id: string): ThemeProfile {
  const profile = profileRegistry.get(id)
  if (!profile) {
    // Log warning but don't crash - fall back to generic profile
    // Generic profile preserves all existing frontmatter fields
    logger.warn(`Unknown theme: ${id}, falling back to generic profile`)
    return genericProfile
  }
  return profile
}

/**
 * Check if a theme is supported
 */
export function isThemeSupported(id: string): boolean {
  return profileRegistry.has(id) || profileRegistry.has(id.toLowerCase())
}

/**
 * Get list of supported theme IDs
 */
export function getSupportedThemeIds(): string[] {
  // Return unique lowercase IDs
  return ['papermod', 'ananke', 'blowfish']
}

/**
 * Get all theme profiles for display
 */
export function getAllThemeProfiles(): ThemeProfile[] {
  return [papermodProfile, anankeProfile, blowfishProfile]
}

/**
 * Default theme ID
 */
export const DEFAULT_THEME_ID = 'papermod'
