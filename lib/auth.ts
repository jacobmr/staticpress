import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Dynamically import database functions to prevent build-time initialization
        const { getOrCreateUser, logEvent } = await import('./db')

        // Create or update user in database using GitHub numeric ID
        if (account?.providerAccountId && user.email) {
          const dbUser = await getOrCreateUser({
            id: account.providerAccountId, // Use GitHub's numeric ID, not NextAuth's UUID
            email: user.email,
            name: user.name,
            image: user.image,
          })

          // Log OAuth completion event
          await logEvent('oauth_completed', dbUser.id, {
            provider: 'github',
            user_email: user.email,
          })
        }
        return true
      } catch (error) {
        console.error('Error creating user in database:', error)
        return true // Still allow sign in even if database fails
      }
    },
    async jwt({ token, account, user, trigger }) {
      // On sign in, set the access token and GitHub ID
      if (account) {
        token.accessToken = account.access_token
        token.githubId = account.providerAccountId // Store GitHub numeric ID
      }

      return token
    },
    async session({ session, token }) {
      // If token is invalid, session will be null
      if (!token) {
        return session
      }

      session.accessToken = token.accessToken as string
      session.user.id = token.githubId as string // Use GitHub numeric ID
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
