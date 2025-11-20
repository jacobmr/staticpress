import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GitHubClient } from "@/lib/github"
import { getRepoConfig } from "@/lib/cookies"
import { SetupClient } from "./setup-client"

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const session = await auth()

  if (!session?.user || !session.accessToken) {
    redirect('/')
  }

  // Check if already configured
  const existingConfig = await getRepoConfig()
  if (existingConfig) {
    redirect('/dashboard')
  }

  // Fetch user's repositories
  const github = new GitHubClient(session.accessToken)
  const repos = await github.getUserRepos()

  return <SetupClient repos={repos} userId={session.user.id} userEmail={session.user.email || ''} userName={session.user.name} userImage={session.user.image} />
}
