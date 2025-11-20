export interface HugoTheme {
  id: string
  name: string
  description: string
  repo: string // GitHub repo for git submodule
  preview?: string // Preview image URL
}

export const HUGO_THEMES: HugoTheme[] = [
  {
    id: 'papermod',
    name: 'PaperMod',
    description: 'Fast, clean, SEO-friendly. Great for blogs.',
    repo: 'https://github.com/adityatelange/hugo-PaperMod.git',
  },
  {
    id: 'ananke',
    name: 'Ananke',
    description: 'Simple and clean. Official Hugo starter theme.',
    repo: 'https://github.com/theNewDynamic/gohugo-theme-ananke.git',
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'Card-based, modern design with dark mode.',
    repo: 'https://github.com/CaiJimmy/hugo-theme-stack.git',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Retro terminal aesthetic for developers.',
    repo: 'https://github.com/panr/hugo-theme-terminal.git',
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Minimal portfolio style for developers.',
    repo: 'https://github.com/luizdepra/hugo-coder.git',
  },
  {
    id: 'blowfish',
    name: 'Blowfish',
    description: 'Modern, Tailwind CSS with full dark mode.',
    repo: 'https://github.com/nunocoracao/blowfish.git',
  },
  {
    id: 'congo',
    name: 'Congo',
    description: 'Minimal, fast, and responsive.',
    repo: 'https://github.com/jpanther/congo.git',
  },
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Feature-rich with search and comments.',
    repo: 'https://github.com/chipzoller/hugo-clarity.git',
  },
]

export function getThemeById(id: string): HugoTheme | undefined {
  return HUGO_THEMES.find(theme => theme.id === id)
}

export const DEFAULT_THEME_ID = 'papermod'
