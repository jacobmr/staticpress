import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRepoConfig } from "@/lib/cookies"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/')
  }

  const repoConfig = await getRepoConfig()

  if (!repoConfig) {
    redirect('/setup')
  }

  return (
    <OnboardingWizard
      repoOwner={repoConfig.owner}
      repoName={repoConfig.repo}
      userName={session.user.name || session.user.email || 'there'}
    />
  )
}
