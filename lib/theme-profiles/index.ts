import { ThemeProfile } from './types'
import { papermodProfile } from './papermod'
import { anankeProfile } from './ananke'

export type { ThemeProfile, PostData, ValidationResult } from './types'
export { escapeYaml } from './types'
export { papermodProfile } from './papermod'
export { anankeProfile } from './ananke'

// Registry of supported themes
const profileRegistry = new Map<string, ThemeProfile>([
  ['papermod', papermodProfile],
  ['PaperMod', papermodProfile],  // Case-insensitive lookup
  ['ananke', anankeProfile],
  ['Ananke', anankeProfile],
])

/**
 * Get theme profile by ID
 * Falls back to PaperMod for unknown themes
 */
export function getThemeProfile(id: string): ThemeProfile {
  const profile = profileRegistry.get(id)
  if (!profile) {
    // Log warning but don't crash - fall back to PaperMod
    console.warn(`Unknown theme: ${id}, falling back to PaperMod`)
    return papermodProfile
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
  return ['papermod', 'ananke']
}

/**
 * Get all theme profiles for display
 */
export function getAllThemeProfiles(): ThemeProfile[] {
  return [papermodProfile, anankeProfile]
}

/**
 * Default theme ID
 */
export const DEFAULT_THEME_ID = 'papermod'
