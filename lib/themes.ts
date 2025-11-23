export interface HugoTheme {
  id: string
  name: string
  description: string
  repo: string // GitHub repo for git submodule
  preview?: string // Preview image URL
}

// Only fully supported themes - these have proper frontmatter and config handling
export const HUGO_THEMES: HugoTheme[] = [
  {
    id: 'papermod',
    name: 'PaperMod',
    description: 'Modern, fast, and feature-rich. Ideal for blogs and portfolios.',
    repo: 'https://github.com/adityatelange/hugo-PaperMod.git',
  },
  {
    id: 'ananke',
    name: 'Ananke',
    description: 'Clean and simple. Official Hugo starter theme with great defaults.',
    repo: 'https://github.com/theNewDynamic/gohugo-theme-ananke.git',
  },
]

// Legacy themes that are no longer fully supported
// Users with these themes will see a migration warning
export const LEGACY_THEMES = ['terminal', 'coder', 'poison', 'risotto']

export function getThemeById(id: string): HugoTheme | undefined {
  return HUGO_THEMES.find(theme => theme.id === id || theme.id === id.toLowerCase())
}

export function isLegacyTheme(id: string): boolean {
  return LEGACY_THEMES.includes(id.toLowerCase())
}

export const DEFAULT_THEME_ID = 'papermod'
