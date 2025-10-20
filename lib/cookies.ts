import { cookies } from 'next/headers'

export interface RepoConfig {
  owner: string
  repo: string
  contentPath?: string // e.g., "content/posts"
}

export async function getRepoConfig(): Promise<RepoConfig | null> {
  const cookieStore = await cookies()
  const config = cookieStore.get('repo-config')

  if (!config) {
    return null
  }

  try {
    return JSON.parse(config.value)
  } catch {
    return null
  }
}

export async function setRepoConfig(config: RepoConfig) {
  const cookieStore = await cookies()
  cookieStore.set('repo-config', JSON.stringify(config), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

export async function clearRepoConfig() {
  const cookieStore = await cookies()
  cookieStore.delete('repo-config')
}
